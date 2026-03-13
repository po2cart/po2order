/**
 * Catalog sync worker — periodically pulls product and customer data
 * from the ERP (Accredo) into the local Postgres database.
 *
 * This decouples matching from ERP availability: the matching engine
 * works against local data, and this worker keeps it fresh.
 */

import type { Job } from "bullmq";
import { db } from "@po2order/db";
import { ERP_TYPES } from "@po2order/core";
import type { ERPAdapter } from "@po2order/erp-adapters-base";
import { AccredoAdapter } from "@po2order/erp-adapters-accredo";

export interface CatalogSyncJobData {
  workspaceId: string;
  syncType: "products" | "customers" | "delivery_addresses" | "full";
}

/** Create the right adapter for the workspace's ERP config */
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

export async function processCatalogSync(job: Job<CatalogSyncJobData>) {
  const { workspaceId, syncType } = job.data;
  const startTime = Date.now();
  let recordsProcessed = 0;

  console.log(`[catalog-sync] Starting ${syncType} sync for workspace ${workspaceId}`);

  const adapter = await createAdapter(workspaceId);

  try {
    if (syncType === "products" || syncType === "full") {
      const products = await adapter.syncProducts();
      recordsProcessed += products.length;

      // Upsert products into local database
      for (const product of products) {
        await db.product.upsert({
          where: {
            workspaceId_code: { workspaceId, code: product.code },
          },
          create: {
            workspaceId,
            code: product.code,
            description: product.description,
            barcode: product.barcode,
            unit: product.unit,
            price: product.price,
            active: product.active,
            erpId: product.erpId,
            erpLastSyncedAt: new Date(),
          },
          update: {
            description: product.description,
            barcode: product.barcode,
            unit: product.unit,
            price: product.price,
            active: product.active,
            erpId: product.erpId,
            erpLastSyncedAt: new Date(),
          },
        });
      }

      console.log(`[catalog-sync] Synced ${products.length} products`);
    }

    if (syncType === "customers" || syncType === "full") {
      const customers = await adapter.syncCustomers();
      recordsProcessed += customers.length;

      for (const customer of customers) {
        const dbCustomer = await db.customer.upsert({
          where: {
            workspaceId_code: { workspaceId, code: customer.code },
          },
          create: {
            workspaceId,
            code: customer.code,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            erpId: customer.erpId,
            erpLastSyncedAt: new Date(),
          },
          update: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            erpId: customer.erpId,
            erpLastSyncedAt: new Date(),
          },
        });

        // Sync delivery addresses for this customer
        if (customer.deliveryAddresses) {
          for (const addr of customer.deliveryAddresses) {
            await db.customerAddress.upsert({
              where: {
                id: `${dbCustomer.id}_${addr.code}`, // Composite lookup
              },
              create: {
                customerId: dbCustomer.id,
                code: addr.code,
                name: addr.name,
                line1: addr.line1,
                line2: addr.line2,
                city: addr.city,
                state: addr.state,
                postalCode: addr.postalCode,
                country: addr.country,
              },
              update: {
                name: addr.name,
                line1: addr.line1,
                line2: addr.line2,
                city: addr.city,
                state: addr.state,
                postalCode: addr.postalCode,
                country: addr.country,
              },
            });
          }
          recordsProcessed += customer.deliveryAddresses.length;
        }
      }

      console.log(`[catalog-sync] Synced ${customers.length} customers`);
    }

    if (syncType === "delivery_addresses") {
      const addresses = await adapter.syncDeliveryAddresses();
      recordsProcessed += addresses.length;
      console.log(`[catalog-sync] Synced ${addresses.length} delivery addresses`);
    }

    // Update last sync timestamp on ERP config
    await db.eRPConfig.update({
      where: { workspaceId },
      data: { lastCatalogSyncAt: new Date() },
    });

    const timeMs = Date.now() - startTime;
    console.log(
      `[catalog-sync] Completed ${syncType} sync: ${recordsProcessed} records in ${timeMs}ms`,
    );

    return { success: true, recordsProcessed, timeMs };
  } finally {
    await adapter.disconnect();
  }
}
