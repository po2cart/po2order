/**
 * Accredo ERP Adapter
 *
 * Implements the ERPAdapter interface for the Accredo REST API (OData).
 * Accredo is the ERP used by Crisp NZ (first customer prospect).
 *
 * API patterns:
 *   Products  → /api/stockitems   (OData $filter)
 *   Customers → /api/debtors      (OData $filter)
 *   Addresses → /api/debtors('{id}')/deliveryaddresses
 *   Orders    → /api/salesorders  (POST to create, GET with $filter)
 *   Health    → /api/system/info
 */

import { ERPAdapter } from "@po2order/erp-adapters-base";
import type {
  ExtractedPurchaseOrder,
  Product,
  Customer,
  SalesOrderStatus,
  DeliveryAddress,
  DuplicateCheckResult,
  CustomFieldMapping,
} from "@po2order/core";
import { AccredoConfigSchema, type AccredoConfig } from "./config";
import { AccredoClient, AccredoApiError } from "./client";
import type {
  AccredoStockItem,
  AccredoDebtor,
  AccredoDeliveryAddress,
  AccredoSalesOrderInput,
  AccredoSalesOrderLineInput,
  AccredoSalesOrderResponse,
  AccredoSalesOrder,
} from "./types";

export class AccredoAdapter implements ERPAdapter {
  private client!: AccredoClient;
  private config!: AccredoConfig;

  // ──────────────────────────────────────────────────────────────────
  // Connection
  // ──────────────────────────────────────────────────────────────────

  async connect(config: Record<string, any>): Promise<void> {
    this.config = AccredoConfigSchema.parse(config);
    this.client = new AccredoClient(this.config);

    // Verify connectivity
    await this.client.get("/api/system/info");
  }

  async disconnect(): Promise<void> {
    // Accredo REST API is stateless — nothing to clean up
  }

  // ──────────────────────────────────────────────────────────────────
  // Product sync
  // ──────────────────────────────────────────────────────────────────

  async syncProducts(): Promise<Product[]> {
    const items: AccredoStockItem[] = [];
    let skip = 0;
    const top = 200;

    // Paginate through all active stock items
    while (true) {
      const page = await this.client.get<AccredoStockItem[]>("/api/stockitems", {
        $filter: "Active eq true",
        $top: String(top),
        $skip: String(skip),
        $orderby: "StockCode",
      });

      items.push(...page);
      if (page.length < top) break;
      skip += top;
    }

    return items.map((item) => this.mapStockItemToProduct(item));
  }

  // ──────────────────────────────────────────────────────────────────
  // Customer sync
  // ──────────────────────────────────────────────────────────────────

  async syncCustomers(): Promise<Customer[]> {
    const debtors: AccredoDebtor[] = [];
    let skip = 0;
    const top = 200;

    while (true) {
      const page = await this.client.get<AccredoDebtor[]>("/api/debtors", {
        $filter: "Active eq true",
        $top: String(top),
        $skip: String(skip),
        $orderby: "DebtorCode",
      });

      debtors.push(...page);
      if (page.length < top) break;
      skip += top;
    }

    // For each debtor, also fetch delivery addresses
    const customers: Customer[] = [];
    for (const debtor of debtors) {
      const addresses = await this.fetchDeliveryAddressesForDebtor(debtor.DebtorID);
      customers.push(this.mapDebtorToCustomer(debtor, addresses));
    }

    return customers;
  }

  // ──────────────────────────────────────────────────────────────────
  // Delivery address sync
  // ──────────────────────────────────────────────────────────────────

  async syncDeliveryAddresses(customerCode?: string): Promise<DeliveryAddress[]> {
    if (customerCode) {
      // Fetch for a specific debtor
      const debtors = await this.client.get<AccredoDebtor[]>("/api/debtors", {
        $filter: `DebtorCode eq '${this.escapeOData(customerCode)}'`,
        $top: "1",
      });

      if (debtors.length === 0) return [];

      const addresses = await this.fetchDeliveryAddressesForDebtor(debtors[0].DebtorID);
      return addresses.map((a) => this.mapAccredoAddress(a, customerCode));
    }

    // Fetch all — get all debtors then their addresses
    const allAddresses: DeliveryAddress[] = [];
    const debtors = await this.client.get<AccredoDebtor[]>("/api/debtors", {
      $filter: "Active eq true",
      $orderby: "DebtorCode",
    });

    for (const debtor of debtors) {
      const addresses = await this.fetchDeliveryAddressesForDebtor(debtor.DebtorID);
      allAddresses.push(
        ...addresses.map((a) => this.mapAccredoAddress(a, debtor.DebtorCode)),
      );
    }

    return allAddresses;
  }

  // ──────────────────────────────────────────────────────────────────
  // Duplicate order detection
  // ──────────────────────────────────────────────────────────────────

  async checkDuplicateOrder(po: ExtractedPurchaseOrder): Promise<DuplicateCheckResult> {
    if (!po.orderNumber) {
      return { isDuplicate: false };
    }

    // Search for existing sales orders with the same customer order number
    const existing = await this.client.get<AccredoSalesOrder[]>("/api/salesorders", {
      $filter: `CustomerOrderNumber eq '${this.escapeOData(po.orderNumber)}'`,
      $top: "1",
    });

    if (existing.length > 0) {
      return {
        isDuplicate: true,
        existingOrderId: existing[0].SalesOrderID,
        existingOrderNumber: existing[0].OrderNumber,
        matchReason: `Existing order with CustomerOrderNumber '${po.orderNumber}'`,
      };
    }

    return { isDuplicate: false };
  }

  // ──────────────────────────────────────────────────────────────────
  // Sales order creation
  // ──────────────────────────────────────────────────────────────────

  async createSalesOrder(
    po: ExtractedPurchaseOrder,
    customFields?: CustomFieldMapping[],
  ): Promise<string> {
    const order = this.mapPOToAccredoOrder(po, customFields);
    const result = await this.client.post<AccredoSalesOrderResponse>(
      "/api/salesorders",
      order,
    );
    return result.OrderNumber;
  }

  // ──────────────────────────────────────────────────────────────────
  // Sales order status
  // ──────────────────────────────────────────────────────────────────

  async getSalesOrderStatus(erpOrderId: string): Promise<SalesOrderStatus> {
    const order = await this.client.get<AccredoSalesOrder>(
      `/api/salesorders('${this.escapeOData(erpOrderId)}')`,
    );

    return this.mapAccredoStatus(order.Status);
  }

  // ──────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────

  private async fetchDeliveryAddressesForDebtor(
    debtorId: string,
  ): Promise<AccredoDeliveryAddress[]> {
    try {
      return await this.client.get<AccredoDeliveryAddress[]>(
        `/api/debtors('${this.escapeOData(debtorId)}')/deliveryaddresses`,
      );
    } catch (err) {
      // Some debtors may not have delivery addresses configured
      if (err instanceof AccredoApiError && err.statusCode === 404) {
        return [];
      }
      throw err;
    }
  }

  private mapStockItemToProduct(item: AccredoStockItem): Product {
    return {
      id: item.StockItemID,
      workspaceId: "", // Set by the sync worker
      code: item.StockCode,
      description: item.Description,
      barcode: item.Barcode,
      unit: item.SalesUnit,
      price: item.SalesPrice,
      active: item.Active !== false,
      erpId: item.StockItemID,
    };
  }

  private mapDebtorToCustomer(
    debtor: AccredoDebtor,
    addresses: AccredoDeliveryAddress[],
  ): Customer {
    return {
      id: debtor.DebtorID,
      workspaceId: "", // Set by the sync worker
      code: debtor.DebtorCode,
      name: debtor.Name,
      email: debtor.Email,
      phone: debtor.Phone,
      erpId: debtor.DebtorID,
      deliveryAddresses: addresses.map((a) => ({
        code: a.DeliveryCode,
        name: a.Name,
        line1: a.Address1,
        line2: a.Address2,
        city: a.City,
        state: a.Region,
        postalCode: a.PostCode,
        country: a.Country,
      })),
    };
  }

  private mapAccredoAddress(
    a: AccredoDeliveryAddress,
    customerCode: string,
  ): DeliveryAddress {
    return {
      code: a.DeliveryCode,
      name: a.Name,
      line1: a.Address1,
      line2: a.Address2,
      city: a.City,
      state: a.Region,
      postalCode: a.PostCode,
      country: a.Country,
      customerId: customerCode,
    };
  }

  private mapPOToAccredoOrder(
    po: ExtractedPurchaseOrder,
    customFields?: CustomFieldMapping[],
  ): AccredoSalesOrderInput {
    const lines: AccredoSalesOrderLineInput[] = po.lines.map((line) => ({
      StockCode: line.productCode ?? "",
      Description: line.description,
      Quantity: line.quantity,
      UnitPrice: line.unitPrice,
    }));

    const order: AccredoSalesOrderInput = {
      DebtorCode: po.customerCode ?? "",
      OrderDate: po.orderDate ?? new Date().toISOString().split("T")[0],
      DeliveryDate: po.expectedDeliveryDate,
      CustomerOrderNumber: po.orderNumber,
      Lines: lines,
    };

    // Map delivery address fields
    if (po.deliveryCode) {
      order.DeliveryCode = po.deliveryCode;
    }
    if (po.deliveryAddress) {
      order.DeliveryAddress1 = po.deliveryAddress.line1;
      order.DeliveryAddress2 = po.deliveryAddress.line2;
      order.DeliveryCity = po.deliveryAddress.city;
      order.DeliveryRegion = po.deliveryAddress.state;
      order.DeliveryPostCode = po.deliveryAddress.postalCode;
      order.DeliveryCountry = po.deliveryAddress.country;
    }

    if (po.notes || po.specialInstructions) {
      order.Notes = [po.notes, po.specialInstructions].filter(Boolean).join("\n");
    }

    // Apply custom field mappings (e.g. Z_ fields for Accredo)
    if (customFields) {
      for (const mapping of customFields) {
        const value = (po as any)[mapping.localFieldName];
        if (value !== undefined) {
          order[mapping.erpFieldName] = this.applyTransform(value, mapping.transform);
        } else if (mapping.defaultValue !== undefined) {
          order[mapping.erpFieldName] = mapping.defaultValue;
        }
      }
    }

    return order;
  }

  private applyTransform(value: unknown, transform: string): unknown {
    if (typeof value !== "string") return value;
    switch (transform) {
      case "uppercase":
        return value.toUpperCase();
      case "lowercase":
        return value.toLowerCase();
      case "trim":
        return value.trim();
      default:
        return value;
    }
  }

  private mapAccredoStatus(accredoStatus: string): SalesOrderStatus {
    const normalized = accredoStatus.toLowerCase();
    if (normalized.includes("cancel")) return "cancelled";
    if (normalized.includes("deliver") || normalized.includes("complete"))
      return "delivered";
    if (normalized.includes("ship") || normalized.includes("dispatch"))
      return "shipped";
    if (normalized.includes("confirm") || normalized.includes("accept"))
      return "confirmed";
    return "pending";
  }

  /** Escape single quotes for OData filter strings */
  private escapeOData(value: string): string {
    return value.replace(/'/g, "''");
  }
}
