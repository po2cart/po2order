/**
 * Extraction Worker Handler
 *
 * Two-pass AI extraction pipeline:
 *   Pass 1 — Extract customer identifiers from the PO document
 *   Pass 2 — Re-extract with customer context for higher accuracy
 *
 * After extraction, enqueues a matching job for product/customer resolution.
 */

import { Queue } from "bullmq";
import { db } from "@po2order/db";
import { PurchaseOrderExtractor } from "@po2order/extraction";
import { CustomerMatcher } from "@po2order/matching";
import type { Customer } from "@po2order/core";
import type { DocumentInput, CustomerIdentification } from "@po2order/extraction";

export interface ExtractionJobData {
  purchaseOrderId: string;
  workspaceId: string;
}

export async function processExtraction(
  data: ExtractionJobData,
  matchingQueue: Queue,
): Promise<void> {
  const { purchaseOrderId, workspaceId } = data;

  const extractor = new PurchaseOrderExtractor({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    model: process.env.EXTRACTION_MODEL || "gpt-4o",
  });

  // Load the PO record
  const po = await db.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrderId },
  });

  // Build document input from source attachment or raw content
  const input = buildDocumentInput(po);

  // -------------------------------------------------------------------------
  // Pass 1 — Customer Identification
  // -------------------------------------------------------------------------
  console.log(`[extraction] Pass 1 — identifying customer for PO ${purchaseOrderId}`);
  const pass1 = await extractor.extractCustomerIdentifiers(input);
  console.log(
    `[extraction] Pass 1 complete — confidence: ${pass1.confidence}, tokens: ${pass1.tokensUsed}, time: ${pass1.timeMs}ms`,
  );

  // Try to match the customer against the workspace's customer database
  let matchedCustomer: Customer | null = null;

  if (hasCustomerIdentifiers(pass1.data)) {
    const customers = await loadCustomersWithAddresses(workspaceId);
    const customerMatcher = new CustomerMatcher();

    const customerMatch = customerMatcher.match(
      {
        code: pass1.data.customerCode,
        email: pass1.data.customerEmail,
        phone: pass1.data.customerPhone,
        name: pass1.data.customerName,
        address: pass1.data.deliveryAddress
          ? {
              line1: pass1.data.deliveryAddress.line1,
              city: pass1.data.deliveryAddress.city,
              postalCode: pass1.data.deliveryAddress.postalCode,
            }
          : undefined,
      },
      customers,
    );

    if (customerMatch) {
      matchedCustomer = customerMatch.item;
      console.log(
        `[extraction] Customer matched: ${matchedCustomer.name} (${customerMatch.method}, confidence: ${customerMatch.confidence})`,
      );

      // Save customer match to PO
      await db.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          customerId: matchedCustomer.id,
          customerCode: matchedCustomer.code,
        },
      });
    } else {
      console.log("[extraction] No customer match found — proceeding without context");
    }
  }

  // -------------------------------------------------------------------------
  // Pass 2 — Full Extraction with Customer Context
  // -------------------------------------------------------------------------
  console.log(
    `[extraction] Pass 2 — full extraction${matchedCustomer ? ` with context for ${matchedCustomer.name}` : ""}`,
  );
  const pass2 = await extractor.extractFull(input, matchedCustomer);
  console.log(
    `[extraction] Pass 2 complete — confidence: ${pass2.confidence}, tokens: ${pass2.tokensUsed}, time: ${pass2.timeMs}ms`,
  );

  const extracted = pass2.data;

  // -------------------------------------------------------------------------
  // Persist extraction results
  // -------------------------------------------------------------------------
  await db.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      orderNumber: extracted.orderNumber,
      orderDate: extracted.orderDate ? new Date(extracted.orderDate) : null,
      expectedDeliveryDate: extracted.expectedDeliveryDate
        ? new Date(extracted.expectedDeliveryDate)
        : null,
      customerCode: extracted.customerCode || po.customerCode,
      deliveryAddressLine1: extracted.deliveryAddress?.line1,
      deliveryAddressLine2: extracted.deliveryAddress?.line2,
      deliveryCity: extracted.deliveryAddress?.city,
      deliveryState: extracted.deliveryAddress?.state,
      deliveryPostalCode: extracted.deliveryAddress?.postalCode,
      deliveryCountry: extracted.deliveryAddress?.country,
      deliveryCode: extracted.deliveryCode,
      subtotal: extracted.subtotal,
      tax: extracted.tax,
      total: extracted.total,
      notes: extracted.notes,
      specialInstructions: extracted.specialInstructions,
      status: "review", // Move to review after extraction
    },
  });

  // Create line items
  if (extracted.lines.length > 0) {
    await db.purchaseOrderLine.createMany({
      data: extracted.lines.map((line, idx) => ({
        purchaseOrderId,
        lineNumber: line.lineNumber ?? idx + 1,
        productCode: line.productCode,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        notes: line.notes,
        productCodeConfidence: line.productCodeConfidence,
        quantityConfidence: line.quantityConfidence,
      })),
    });
  }

  // -------------------------------------------------------------------------
  // Enqueue matching job
  // -------------------------------------------------------------------------
  await matchingQueue.add("match", {
    purchaseOrderId,
    workspaceId,
  });

  console.log(
    `[extraction] Done — ${extracted.lines.length} lines extracted, matching job enqueued`,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDocumentInput(po: {
  sourceAttachment?: string | null;
  rawContent?: string | null;
  sourceType: string;
}): DocumentInput {
  // For now, use rawContent as text input.
  // When file storage (S3/R2) is wired up, this will download the file
  // and return the appropriate DocumentInput type (pdf, image, etc.)
  if (po.rawContent) {
    return { type: "text", content: po.rawContent };
  }

  if (po.sourceAttachment) {
    // TODO: Download from S3/R2 and detect file type
    // For PDFs: return { type: "pdf", data: buffer }
    // For images: return { type: "image", data: buffer, mimeType: "image/png" }
    throw new Error(
      `File-based extraction not yet implemented. sourceAttachment: ${po.sourceAttachment}`,
    );
  }

  throw new Error("PO has no rawContent or sourceAttachment to extract from");
}

function hasCustomerIdentifiers(id: CustomerIdentification): boolean {
  return !!(
    id.customerCode ||
    id.customerEmail ||
    id.customerPhone ||
    id.customerName ||
    id.deliveryAddress
  );
}

async function loadCustomersWithAddresses(workspaceId: string): Promise<Customer[]> {
  const dbCustomers = await db.customer.findMany({
    where: { workspaceId },
    include: { deliveryAddresses: true },
  });

  return dbCustomers.map((c) => ({
    id: c.id,
    workspaceId: c.workspaceId,
    code: c.code,
    name: c.name,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    deliveryAddresses: c.deliveryAddresses.map((a) => ({
      code: a.code,
      name: a.name ?? undefined,
      line1: a.line1,
      line2: a.line2 ?? undefined,
      city: a.city,
      state: a.state ?? undefined,
      postalCode: a.postalCode,
      country: a.country ?? undefined,
    })),
  }));
}
