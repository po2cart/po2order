/**
 * ERP order push worker — maps extracted PO data to Accredo sales order
 * format and pushes it via the adapter API.
 *
 * Flow:
 *   1. Load the PurchaseOrder + lines from Postgres
 *   2. Check for duplicate orders in the ERP
 *   3. Create the sales order via the adapter
 *   4. Store the resulting SalesOrder record locally
 *   5. Update the PurchaseOrder status to "pushed"
 */

import type { Job } from "bullmq";
import { db } from "@po2order/db";
import { ERP_TYPES, type ExtractedPurchaseOrder } from "@po2order/core";
import type { ERPAdapter } from "@po2order/erp-adapters-base";
import { AccredoAdapter } from "@po2order/erp-adapters-accredo";

export interface ERPPushJobData {
  purchaseOrderId: string;
  workspaceId: string;
}

async function createAdapter(workspaceId: string): Promise<ERPAdapter> {
  const erpConfig = await db.eRPConfig.findUnique({
    where: { workspaceId },
  });

  if (!erpConfig || !erpConfig.active) {
    throw new Error(`No active ERP config for workspace ${workspaceId}`);
  }

  const credentials = JSON.parse(erpConfig.credentials);

  let adapter: ERPAdapter;
  switch (erpConfig.type) {
    case ERP_TYPES.ACCREDO:
      adapter = new AccredoAdapter();
      break;
    default:
      throw new Error(`Unsupported ERP type: ${erpConfig.type}`);
  }

  await adapter.connect(credentials);
  return adapter;
}

export async function processERPPush(job: Job<ERPPushJobData>) {
  const { purchaseOrderId, workspaceId } = job.data;

  console.log(`[erp-push] Processing order push for PO ${purchaseOrderId}`);

  // Load the purchase order with its lines
  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { lines: { orderBy: { lineNumber: "asc" } } },
  });

  if (!po) {
    throw new Error(`PurchaseOrder ${purchaseOrderId} not found`);
  }

  if (po.status !== "approved") {
    console.log(`[erp-push] Skipping PO ${purchaseOrderId}: status is ${po.status}, not approved`);
    return { skipped: true, reason: `status is ${po.status}` };
  }

  const adapter = await createAdapter(workspaceId);

  try {
    // Map DB record to ExtractedPurchaseOrder for the adapter
    const extractedPO: ExtractedPurchaseOrder = {
      orderNumber: po.orderNumber ?? undefined,
      orderDate: po.orderDate?.toISOString().split("T")[0],
      expectedDeliveryDate: po.expectedDeliveryDate?.toISOString().split("T")[0],
      customerCode: po.customerCode ?? undefined,
      deliveryCode: po.deliveryCode ?? undefined,
      deliveryAddress: po.deliveryAddressLine1
        ? {
            line1: po.deliveryAddressLine1,
            line2: po.deliveryAddressLine2 ?? undefined,
            city: po.deliveryCity ?? undefined,
            state: po.deliveryState ?? undefined,
            postalCode: po.deliveryPostalCode ?? undefined,
            country: po.deliveryCountry ?? undefined,
          }
        : undefined,
      lines: po.lines.map((line) => ({
        lineNumber: line.lineNumber,
        productCode: line.productCode ?? undefined,
        description: line.description ?? undefined,
        quantity: Number(line.quantity),
        unit: line.unit ?? undefined,
        unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
        totalPrice: line.totalPrice ? Number(line.totalPrice) : undefined,
        notes: line.notes ?? undefined,
      })),
      subtotal: po.subtotal ? Number(po.subtotal) : undefined,
      tax: po.tax ? Number(po.tax) : undefined,
      total: po.total ? Number(po.total) : undefined,
      notes: po.notes ?? undefined,
      specialInstructions: po.specialInstructions ?? undefined,
    };

    // Step 1: Check for duplicates
    const dupCheck = await adapter.checkDuplicateOrder(extractedPO);
    if (dupCheck.isDuplicate) {
      console.log(
        `[erp-push] Duplicate detected for PO ${purchaseOrderId}: ${dupCheck.matchReason}`,
      );

      await db.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: "error",
          errorDetails: `Duplicate order detected: ${dupCheck.matchReason} (existing: ${dupCheck.existingOrderNumber})`,
        },
      });

      return {
        success: false,
        duplicate: true,
        existingOrderNumber: dupCheck.existingOrderNumber,
      };
    }

    // Step 2: Create the sales order in the ERP
    const erpOrderNumber = await adapter.createSalesOrder(extractedPO);

    console.log(
      `[erp-push] Created Accredo order ${erpOrderNumber} for PO ${purchaseOrderId}`,
    );

    // Step 3: Store the SalesOrder record
    await db.salesOrder.create({
      data: {
        workspaceId,
        purchaseOrderId,
        erpOrderId: erpOrderNumber,
        status: "pending",
        erpResponse: JSON.stringify({ orderNumber: erpOrderNumber }),
      },
    });

    // Step 4: Update PO status
    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: "pushed" },
    });

    // Update last order push timestamp
    await db.eRPConfig.update({
      where: { workspaceId },
      data: { lastOrderPushAt: new Date() },
    });

    return { success: true, erpOrderNumber };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[erp-push] Failed to push PO ${purchaseOrderId}:`, message);

    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: "error",
        errorDetails: `ERP push failed: ${message}`,
      },
    });

    throw error;
  } finally {
    await adapter.disconnect();
  }
}
