/**
 * Abstract ERP Adapter Interface
 * 
 * All ERP adapters must implement this interface
 */

import { ExtractedPurchaseOrder, Product, Customer, SalesOrderStatus } from "@po2order/core";

export interface ERPAdapter {
  /**
   * Connect to ERP and authenticate
   */
  connect(config: Record<string, any>): Promise<void>;

  /**
   * Disconnect from ERP
   */
  disconnect(): Promise<void>;

  /**
   * Sync product catalog from ERP
   */
  syncProducts(): Promise<Product[]>;

  /**
   * Sync customer catalog from ERP
   */
  syncCustomers(): Promise<Customer[]>;

  /**
   * Create Sales Order in ERP from Purchase Order
   * Returns ERP order ID/number
   */
  createSalesOrder(po: ExtractedPurchaseOrder): Promise<string>;

  /**
   * Get Sales Order status from ERP
   */
  getSalesOrderStatus(erpOrderId: string): Promise<SalesOrderStatus>;
}
