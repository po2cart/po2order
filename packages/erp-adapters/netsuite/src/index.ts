/**
 * NetSuite ERP Adapter
 *
 * TODO: Implement NetSuite SuiteTalk integration
 * https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html
 */

import { ERPAdapter } from "@po2order/erp-adapters-base";
import {
  ExtractedPurchaseOrder,
  Product,
  Customer,
  SalesOrderStatus,
  DeliveryAddress,
  DuplicateCheckResult,
  CustomFieldMapping,
} from "@po2order/core";

export class NetSuiteAdapter implements ERPAdapter {
  async connect(config: Record<string, any>): Promise<void> {
    // TODO: Implement OAuth 2.0 / Token-based auth
    throw new Error("NetSuiteAdapter.connect() not implemented");
  }

  async disconnect(): Promise<void> {
    // TODO: Clean up connection
  }

  async syncProducts(): Promise<Product[]> {
    // TODO: Fetch items from NetSuite Items endpoint
    throw new Error("NetSuiteAdapter.syncProducts() not implemented");
  }

  async syncCustomers(): Promise<Customer[]> {
    // TODO: Fetch customers from NetSuite Customers endpoint
    throw new Error("NetSuiteAdapter.syncCustomers() not implemented");
  }

  async syncDeliveryAddresses(customerCode?: string): Promise<DeliveryAddress[]> {
    // TODO: Fetch delivery addresses from NetSuite
    throw new Error("NetSuiteAdapter.syncDeliveryAddresses() not implemented");
  }

  async checkDuplicateOrder(po: ExtractedPurchaseOrder): Promise<DuplicateCheckResult> {
    // TODO: Check for duplicate orders in NetSuite
    throw new Error("NetSuiteAdapter.checkDuplicateOrder() not implemented");
  }

  async createSalesOrder(po: ExtractedPurchaseOrder, customFields?: CustomFieldMapping[]): Promise<string> {
    // TODO: Map PO to NetSuite Sales Order format and POST
    throw new Error("NetSuiteAdapter.createSalesOrder() not implemented");
  }

  async getSalesOrderStatus(erpOrderId: string): Promise<SalesOrderStatus> {
    // TODO: Query NetSuite Sales Order status
    throw new Error("NetSuiteAdapter.getSalesOrderStatus() not implemented");
  }
}
