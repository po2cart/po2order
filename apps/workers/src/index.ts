/**
 * POtoOrder Background Workers
 *
 * Pipeline: extraction → matching → review queue
 *
 * Extraction worker runs two-pass AI extraction:
 *   Pass 1: Identify customer from document
 *   Pass 2: Full extraction with customer context
 *
 * Matching worker runs product + customer matching against catalog/DB.
 *
 * ERP push worker sends approved orders to ERP (separate concern).
 */

import { Worker, Queue } from "bullmq";
import { QUEUES } from "@po2order/core";
import { processExtraction } from "./handlers/extraction";
import { processMatching } from "./handlers/matching";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Queues (for enqueuing downstream jobs)
export const matchingQueue = new Queue(QUEUES.MATCHING, { connection: redisConnection });
export const erpPushQueue = new Queue(QUEUES.ERP_PUSH, { connection: redisConnection });

// ---------------------------------------------------------------------------
// Extraction Worker
// ---------------------------------------------------------------------------
const extractionWorker = new Worker(
  QUEUES.EXTRACTION,
  async (job) => {
    console.log(`[extraction] Processing job ${job.id} — PO ${job.data.purchaseOrderId}`);
    await processExtraction(job.data, matchingQueue);
  },
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: { max: 10, duration: 60_000 }, // 10 jobs/min to respect OpenAI rate limits
  },
);

extractionWorker.on("failed", (job, err) => {
  console.error(`[extraction] Job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Matching Worker
// ---------------------------------------------------------------------------
const matchingWorker = new Worker(
  QUEUES.MATCHING,
  async (job) => {
    console.log(`[matching] Processing job ${job.id} — PO ${job.data.purchaseOrderId}`);
    await processMatching(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

matchingWorker.on("failed", (job, err) => {
  console.error(`[matching] Job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// ERP Push Worker (stub — separate implementation)
// ---------------------------------------------------------------------------
const erpPushWorker = new Worker(
  QUEUES.ERP_PUSH,
  async (job) => {
    console.log(`[erp-push] Processing job ${job.id} — PO ${job.data.purchaseOrderId}`);
    // TODO: Implement ERP push logic via @po2order/erp-adapters-base
  },
  { connection: redisConnection },
);

erpPushWorker.on("failed", (job, err) => {
  console.error(`[erp-push] Job ${job?.id} failed:`, err.message);
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
console.log("Workers started:");
console.log(`  - ${QUEUES.EXTRACTION} (concurrency: 3)`);
console.log(`  - ${QUEUES.MATCHING}   (concurrency: 5)`);
console.log(`  - ${QUEUES.ERP_PUSH}`);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await Promise.all([
    extractionWorker.close(),
    matchingWorker.close(),
    erpPushWorker.close(),
    matchingQueue.close(),
    erpPushQueue.close(),
  ]);
  process.exit(0);
});
