# ERP Adapters

This directory contains pluggable ERP adapters for POtoOrder.

## Supported ERPs

- **NetSuite** (`netsuite/`) — Oracle NetSuite SuiteTalk REST/SOAP
- **SAP Business One** (`sap-b1/`) — SAP B1 Service Layer REST
- **Pronto Xi** (`pronto-xi/`) — Pronto Xi SOAP Web Services + DB read
- **Dynamics 365 F&O** (`d365-fo/`) — Microsoft D365 F&O OData REST

## Adding a New ERP Adapter

See [docs/erp-integration-guide.md](../../../docs/erp-integration-guide.md) for step-by-step instructions.

### Quick Steps

1. Create new directory: `packages/erp-adapters/my-erp/`
2. Implement `ERPAdapter` interface from `@po2order/erp-adapters-base`
3. Add configuration schema (Zod)
4. Write integration tests
5. Document in `docs/erp-integration-guide.md`

## Adapter Interface

All adapters must implement:

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

## Configuration

ERP credentials are stored encrypted in the `erp_configs` table per workspace.

Example config structure:

```typescript
{
  type: "netsuite",
  credentials: {
    accountId: "...",
    consumerKey: "...",
    consumerSecret: "...",
    tokenId: "...",
    tokenSecret: "..."
  }
}
```
