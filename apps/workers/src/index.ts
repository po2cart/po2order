/**
 * POtoOrder Background Workers
 *
 * Handles:
 * - Purchase order extraction
 * - Product/customer matching
 * - ERP order push (Accredo + future adapters)
 * - Catalog sync (products, customers, delivery addresses)
 */

import { Worker } from "bullmq";
import { QUEUES } from "@po2order/core";
import { processCatalogSync } from "./catalog-sync";
import { processERPPush } from "./erp-push";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Extraction worker
const extractionWorker = new Worker(
  QUEUES.EXTRACTION,
  async (job) => {
    console.log(`Processing extraction job ${job.id}`);
    // TODO: Implement extraction logic
  },
  { connection: redisConnection },
);

// Matching worker
const matchingWorker = new Worker(
  QUEUES.MATCHING,
  async (job) => {
    console.log(`Processing matching job ${job.id}`);
    // TODO: Implement matching logic
  },
  { connection: redisConnection },
);

// ERP push worker — creates sales orders in the ERP from approved POs
const erpPushWorker = new Worker(
  QUEUES.ERP_PUSH,
  async (job) => processERPPush(job),
  {
    connection: redisConnection,
    concurrency: 3,
  },
);

// Catalog sync worker — syncs products/customers/addresses from ERP to local DB
const catalogSyncWorker = new Worker(
  QUEUES.CATALOG_SYNC,
  async (job) => processCatalogSync(job),
  {
    connection: redisConnection,
    concurrency: 1, // One sync at a time to avoid API rate limits
  },
);

console.log("Workers started:");
console.log(`  - ${QUEUES.EXTRACTION}`);
console.log(`  - ${QUEUES.MATCHING}`);
console.log(`  - ${QUEUES.ERP_PUSH}`);
console.log(`  - ${QUEUES.CATALOG_SYNC}`);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await Promise.all([
    extractionWorker.close(),
    matchingWorker.close(),
    erpPushWorker.close(),
    catalogSyncWorker.close(),
  ]);
  process.exit(0);
});
