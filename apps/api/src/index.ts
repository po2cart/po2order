/**
 * POtoOrder API Server (Hono)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { quickBooksRouter } from "./quickbooks";

export const app = new Hono();

// Middleware
app.use("/*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.route("/api/quickbooks", quickBooksRouter);

app.get("/api/purchase-orders", async (c) => {
  // TODO: Implement
  return c.json({ message: "Not implemented" }, 501);
});

app.post("/api/purchase-orders", async (c) => {
  // TODO: Implement
  return c.json({ message: "Not implemented" }, 501);
});

// Start server
const port = parseInt(process.env.PORT || "3001");
console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
