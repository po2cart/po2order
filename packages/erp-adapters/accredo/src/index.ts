/**
 * @po2order/erp-adapters-accredo
 *
 * Accredo ERP adapter for POtoOrder.
 * Accredo uses a REST API with OData-style query parameters.
 */

export { AccredoAdapter } from "./adapter";
export { AccredoConfigSchema, type AccredoConfig } from "./config";
export { AccredoClient, AccredoApiError } from "./client";
export type * from "./types";
