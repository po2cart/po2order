/**
 * Matching types
 */

export interface MatchResult<T> {
  item: T;
  confidence: number;
  method: string;
}

export interface ProductMatchOptions {
  /** Ordered quantity from the PO */
  quantity?: number;
  /** Minimum order quantity for this product */
  moq?: number;
  /** Unit from the PO (e.g. "cases", "each") */
  unit?: string;
}

export interface ProductMatchWarning {
  type: "inactive-product" | "below-moq" | "uom-mismatch";
  message: string;
  productCode: string;
}
