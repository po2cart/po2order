/**
 * POtoOrder API Server (Hono)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "@po2order/db";
import { QUEUES } from "@po2order/core";
import { Queue } from "bullmq";

const app = new Hono();

// Redis connection for BullMQ
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// Initialize queues
const erpPushQueue = new Queue(QUEUES.ERP_PUSH, { connection: redisConnection });

// Middleware
app.use("/*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.get("/api/purchase-orders", async (c) => {
  const status = c.req.query("status");
  try {
    const pos = await db.purchaseOrder.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
    return c.json({ data: pos });
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return c.json({ message: "Failed to fetch purchase orders", error }, 500);
  }
});

app.get("/api/purchase-orders/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true, customer: true },
    });

    if (!po) {
      return c.json({ message: "Purchase order not found" }, 404);
    }

    return c.json({ data: po });
  } catch (error) {
    console.error(`Failed to fetch purchase order ${id}:`, error);
    return c.json({ message: "Failed to fetch purchase order", error }, 500);
  }
});

// Mutation endpoints
app.post("/api/purchase-orders/:id/hold", async (c) => {
  const id = c.req.param("id");
  try {
    const po = await db.purchaseOrder.update({
      where: { id },
      data: { status: "held" },
    });
    return c.json({ data: po, message: "Purchase order moved to held status" });
  } catch (error) {
    console.error(`Failed to hold purchase order ${id}:`, error);
    return c.json({ message: "Failed to hold purchase order", error }, 500);
  }
});

app.post("/api/purchase-orders/:id/release", async (c) => {
  const id = c.req.param("id");
  try {
    const po = await db.purchaseOrder.update({
      where: { id },
      data: { status: "review" }, // Move back to review stage
    });
    return c.json({ data: po, message: "Purchase order released back to review" });
  } catch (error) {
    console.error(`Failed to release purchase order ${id}:`, error);
    return c.json({ message: "Failed to release purchase order", error }, 500);
  }
});

app.post("/api/purchase-orders/:id/approve", async (c) => {
  const id = c.req.param("id");
  try {
    const po = await db.purchaseOrder.update({
      where: { id },
      data: { status: "approved" },
    });

    // Trigger ERP push worker
    await erpPushQueue.add("push-to-erp", { 
      purchaseOrderId: id,
      workspaceId: po.workspaceId
    });

    return c.json({ 
      data: po, 
      message: "Purchase order approved and queued for ERP push" 
    });
  } catch (error) {
    console.error(`Failed to approve purchase order ${id}:`, error);
    return c.json({ message: "Failed to approve purchase order", error }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT || "3001");
console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
