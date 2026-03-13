/**
 * Accredo API response types.
 *
 * These mirror the shapes returned by the Accredo REST/OData API.
 * Field names use Accredo's PascalCase convention.
 */

/** GET /api/stockitems */
export interface AccredoStockItem {
  StockItemID: string;
  StockCode: string;
  Description: string;
  Barcode?: string;
  SalesUnit?: string;
  SalesPrice?: number;
  Active?: boolean;
  /** Custom Z_ fields appear as additional properties */
  [key: string]: unknown;
}

/** GET /api/debtors */
export interface AccredoDebtor {
  DebtorID: string;
  DebtorCode: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Active?: boolean;
  [key: string]: unknown;
}

/** GET /api/debtors('{id}')/deliveryaddresses */
export interface AccredoDeliveryAddress {
  DeliveryAddressID: string;
  DeliveryCode: string;
  Name?: string;
  Address1: string;
  Address2?: string;
  City: string;
  Region?: string;
  PostCode: string;
  Country?: string;
  DebtorID: string;
}

/** POST /api/salesorders — request body */
export interface AccredoSalesOrderInput {
  DebtorCode: string;
  OrderDate: string; // ISO date
  DeliveryDate?: string;
  CustomerOrderNumber?: string;
  DeliveryCode?: string;
  DeliveryAddress1?: string;
  DeliveryAddress2?: string;
  DeliveryCity?: string;
  DeliveryRegion?: string;
  DeliveryPostCode?: string;
  DeliveryCountry?: string;
  Notes?: string;
  Lines: AccredoSalesOrderLineInput[];
  /** Custom Z_ fields */
  [key: string]: unknown;
}

export interface AccredoSalesOrderLineInput {
  StockCode: string;
  Description?: string;
  Quantity: number;
  UnitPrice?: number;
  DiscountPercent?: number;
  Notes?: string;
  [key: string]: unknown;
}

/** POST /api/salesorders — response */
export interface AccredoSalesOrderResponse {
  SalesOrderID: string;
  OrderNumber: string;
  Status: string;
  TotalExcl?: number;
  TotalIncl?: number;
  [key: string]: unknown;
}

/** GET /api/system/info */
export interface AccredoSystemInfo {
  Version: string;
  Company: string;
  Database: string;
}

/** GET /api/salesorders?$filter=... — for duplicate detection */
export interface AccredoSalesOrder {
  SalesOrderID: string;
  OrderNumber: string;
  CustomerOrderNumber?: string;
  DebtorCode: string;
  Status: string;
  OrderDate: string;
  [key: string]: unknown;
}
