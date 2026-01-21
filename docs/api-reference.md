# API Reference

POtoOrder REST API documentation.

**Base URL**: `https://api.po2order.com` (production)  
**Base URL**: `http://localhost:3001` (development)

## Authentication

All API endpoints require authentication via API key or Clerk session token.

**Header**: `Authorization: Bearer <api_key>`

## Endpoints

### Purchase Orders

#### `POST /api/purchase-orders`

Create a new purchase order from uploaded file or text.

**Request**:
```json
{
  "sourceType": "upload",
  "content": "base64-encoded-pdf-or-text",
  "filename": "po-12345.pdf"
}
```

**Response**:
```json
{
  "id": "po_abc123",
  "status": "processing",
  "createdAt": "2026-01-21T10:00:00Z"
}
```

#### `GET /api/purchase-orders/:id`

Get purchase order by ID.

**Response**:
```json
{
  "id": "po_abc123",
  "status": "review",
  "orderNumber": "PO-12345",
  "customerCode": "CUST001",
  "lines": [
    {
      "lineNumber": 1,
      "productCode": "SKU123",
      "description": "Widget A",
      "quantity": 10,
      "unitPrice": 25.00
    }
  ]
}
```

#### `PATCH /api/purchase-orders/:id`

Update purchase order (during review).

**Request**:
```json
{
  "lines": [
    {
      "lineNumber": 1,
      "productCode": "SKU123-CORRECTED"
    }
  ]
}
```

#### `POST /api/purchase-orders/:id/approve`

Approve purchase order and push to ERP.

**Response**:
```json
{
  "success": true,
  "erpOrderId": "SO-67890",
  "message": "Sales Order created in NetSuite"
}
```

### Products

#### `GET /api/products`

List products in catalog.

**Query params**:
- `page` (default: 1)
- `limit` (default: 50)
- `search` (optional)

#### `POST /api/products/sync`

Trigger catalog sync from ERP.

**Response**:
```json
{
  "success": true,
  "recordsProcessed": 1250,
  "timeMs": 5420
}
```

### Customers

#### `GET /api/customers`

List customers.

#### `POST /api/customers/sync`

Trigger customer sync from ERP.

---

Full OpenAPI spec: Coming soon
