/**
 * Product matching engine
 * 
 * Matches extracted product codes/descriptions to catalog products
 */

import { Product, normalizeString } from "@po2order/core";
import { MatchResult } from "./types";

export class ProductMatcher {
  /**
   * Match product by exact code
   */
  matchByCode(code: string, products: Product[]): MatchResult<Product> | null {
    const normalized = normalizeString(code);
    
    for (const product of products) {
      if (normalizeString(product.code) === normalized) {
        return {
          item: product,
          confidence: 1.0,
          method: "exact-code",
        };
      }
    }
    
    return null;
  }

  /**
   * Match product by barcode
   */
  matchByBarcode(barcode: string, products: Product[]): MatchResult<Product> | null {
    const normalized = normalizeString(barcode);
    
    for (const product of products) {
      if (product.barcode && normalizeString(product.barcode) === normalized) {
        return {
          item: product,
          confidence: 1.0,
          method: "barcode",
        };
      }
    }
    
    return null;
  }

  /**
   * Match product (try all methods in priority order)
   */
  match(code: string, products: Product[]): MatchResult<Product> | null {
    // Try exact code first
    const codeMatch = this.matchByCode(code, products);
    if (codeMatch) return codeMatch;
    
    // Try barcode
    const barcodeMatch = this.matchByBarcode(code, products);
    if (barcodeMatch) return barcodeMatch;
    
    // TODO: Fuzzy description matching
    
    return null;
  }
}
