/**
 * Core domain types for POtoOrder
 */

import { z } from "zod";

// ============================================================================
// Purchase Order Types
// ============================================================================

export const PurchaseOrderStatusSchema = z.enum([
  "processing",    // Being extracted
  "review",        // Needs human review
  "approved",      // Approved, ready for ERP
  "pushed",        // Pushed to ERP
  "error",         // Extraction or ERP error
  "rejected",      // Manually rejected
]);

export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const ExtractedPurchaseOrderSchema = z.object({
  // Header
  orderNumber: z.string().optional(),
  orderDate: z.string().optional(), // ISO date string
  expectedDeliveryDate: z.string().optional(),
  
  // Customer
  customerCode: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  
  // Delivery
  deliveryAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  deliveryCode: z.string().optional(),
  
  // Line items
  lines: z.array(z.object({
    lineNumber: z.number().optional(),
    productCode: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number(),
    unit: z.string().optional(),
    unitPrice: z.number().optional(),
    totalPrice: z.number().optional(),
    notes: z.string().optional(),
    
    // Confidence scores (0-1)
    productCodeConfidence: z.number().optional(),
    quantityConfidence: z.number().optional(),
  })),
  
  // Totals
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  
  // Metadata
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

export type ExtractedPurchaseOrder = z.infer<typeof ExtractedPurchaseOrderSchema>;

// ============================================================================
// Product Types
// ============================================================================

export const ProductSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  code: z.string(),
  description: z.string(),
  barcode: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().optional(),
  active: z.boolean().default(true),
  
  // ERP metadata
  erpId: z.string().optional(),
  erpLastSyncedAt: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// ============================================================================
// Customer Types
// ============================================================================

export const CustomerSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  code: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  
  // Delivery addresses
  deliveryAddresses: z.array(z.object({
    code: z.string(),
    name: z.string().optional(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string().optional(),
  })).optional(),
  
  // ERP metadata
  erpId: z.string().optional(),
  erpLastSyncedAt: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// ============================================================================
// ERP Adapter Types
// ============================================================================

export const ERPConfigSchema = z.object({
  type: z.string(), // "netsuite", "sap-b1", "pronto-xi", "d365-fo", etc.
  credentials: z.record(z.any()), // ERP-specific credentials
});

export type ERPConfig = z.infer<typeof ERPConfigSchema>;

export const SalesOrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export type SalesOrderStatus = z.infer<typeof SalesOrderStatusSchema>;

// ============================================================================
// Delivery Address Types
// ============================================================================

export const DeliveryAddressSchema = z.object({
  code: z.string(),
  name: z.string().optional(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().optional(),
  customerId: z.string().optional(),
});

export type DeliveryAddress = z.infer<typeof DeliveryAddressSchema>;

// ============================================================================
// Custom Field Mapping Types
// ============================================================================

export const CustomFieldMappingSchema = z.object({
  erpFieldName: z.string(),
  localFieldName: z.string(),
  fieldType: z.enum(["string", "number", "boolean", "date"]),
  defaultValue: z.any().optional(),
  transform: z.enum(["none", "uppercase", "lowercase", "trim"]).default("none"),
});

export type CustomFieldMapping = z.infer<typeof CustomFieldMappingSchema>;

// ============================================================================
// Duplicate Check Types
// ============================================================================

export const DuplicateCheckResultSchema = z.object({
  isDuplicate: z.boolean(),
  existingOrderId: z.string().optional(),
  existingOrderNumber: z.string().optional(),
  matchReason: z.string().optional(),
});

export type DuplicateCheckResult = z.infer<typeof DuplicateCheckResultSchema>;
