# ERP Integration Guide

This guide explains how to add support for a new ERP system to POtoOrder.

## Overview

POtoOrder uses a **pluggable adapter pattern** for ERP integrations. Each adapter implements the `ERPAdapter` interface defined in `@po2order/erp-adapters-base`.

## Adapter Interface

```typescript
interface ERPAdapter {
  connect(config: Record<string, any>): Promise<void>;
  disconnect(): Promise<void>;
  syncProducts(): Promise<Product[]>;
  syncCustomers(): Promise<Customer[]>;
  createSalesOrder(po: ExtractedPurchaseOrder): Promise<string>;
  getSalesOrderStatus(erpOrderId: string): Promise<SalesOrderStatus>;
}
```

## Step-by-Step Guide

### 1. Create Adapter Package

```bash
mkdir -p packages/erp-adapters/my-erp/src
cd packages/erp-adapters/my-erp
pnpm init
```

Update `package.json`:

```json
{
  "name": "@po2order/erp-adapters-my-erp",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@po2order/core": "workspace:*",
    "@po2order/erp-adapters-base": "workspace:*"
  }
}
```

### 2. Implement Adapter

Create `src/index.ts`:

```typescript
import { ERPAdapter } from "@po2order/erp-adapters-base";
import { ExtractedPurchaseOrder, Product, Customer, SalesOrderStatus } from "@po2order/core";

export class MyERPAdapter implements ERPAdapter {
  private client: any; // ERP SDK client

  async connect(config: Record<string, any>): Promise<void> {
    // Initialize ERP SDK with credentials
    this.client = new MyERPClient({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
    });
    
    await this.client.authenticate();
  }

  async disconnect(): Promise<void> {
    // Clean up connection
  }

  async syncProducts(): Promise<Product[]> {
    const erpProducts = await this.client.getProducts();
    
    return erpProducts.map((p) => ({
      id: p.id,
      code: p.sku,
      description: p.name,
      barcode: p.barcode,
      unit: p.unit,
      price: p.price,
      erpId: p.id,
    }));
  }

  async syncCustomers(): Promise<Customer[]> {
    // Similar to syncProducts
  }

  async createSalesOrder(po: ExtractedPurchaseOrder): Promise<string> {
    // Map PO to ERP Sales Order format
    const erpOrder = {
      customer_id: po.customerId,
      lines: po.lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
        price: line.unitPrice,
      })),
    };
    
    const response = await this.client.createOrder(erpOrder);
    return response.order_number;
  }

  async getSalesOrderStatus(erpOrderId: string): Promise<SalesOrderStatus> {
    const order = await this.client.getOrder(erpOrderId);
    return mapERPStatusToPOtoOrder(order.status);
  }
}
```

### 3. Add Configuration Schema

Create `src/config.ts`:

```typescript
import { z } from "zod";

export const MyERPConfigSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string(),
  companyId: z.string().optional(),
});

export type MyERPConfig = z.infer<typeof MyERPConfigSchema>;
```

### 4. Write Tests

Create `src/index.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { MyERPAdapter } from "./index";

describe("MyERPAdapter", () => {
  it("should connect to ERP", async () => {
    const adapter = new MyERPAdapter();
    await adapter.connect({ apiUrl: "https://test.com", apiKey: "test" });
    // Assert connection
  });

  it("should sync products", async () => {
    // Mock ERP API response
    // Call syncProducts()
    // Assert products are mapped correctly
  });
});
```

### 5. Update Registry

Add adapter to `packages/erp-adapters/base/src/registry.ts`:

```typescript
import { MyERPAdapter } from "@po2order/erp-adapters-my-erp";

export const ERP_ADAPTERS = {
  netsuite: NetSuiteAdapter,
  "sap-b1": SAPBusinessOneAdapter,
  "my-erp": MyERPAdapter, // <-- Add here
};
```

### 6. Document

Update this guide and README with ERP-specific instructions (API docs, credentials, setup steps).

## Common Patterns

### Error Handling

```typescript
try {
  await this.client.createOrder(order);
} catch (error) {
  throw new Error(`Failed to create order in MyERP: ${error.message}`);
}
```

### Retry Logic

```typescript
import { sleep, exponentialBackoff } from "@po2order/core";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(exponentialBackoff(attempt));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Rate Limiting

```typescript
import pLimit from "p-limit";

const limit = pLimit(5); // Max 5 concurrent requests

const products = await Promise.all(
  productIds.map((id) => limit(() => this.client.getProduct(id)))
);
```

## Resources

- [NetSuite SuiteTalk Docs](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html)
- [SAP B1 Service Layer Docs](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5ba5a12e1b0a0f2a0/4e46ce93d1e64a7c97ed4eea5f8aab5e.html)
- [D365 F&O OData Docs](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata)

---

Questions? Ask in Slack `#po2order-erp` or create a GitHub issue.
