/**
 * Product matching engine
 *
 * Matches extracted product codes/descriptions to catalog products.
 * Supports: exact code, barcode, fuzzy code, inactive product detection,
 * MOQ validation, UOM validation.
 */

import { Product, normalizeString } from "@po2order/core";
import type { MatchResult, ProductMatchOptions, ProductMatchWarning } from "./types";

export interface ProductMatchOutput {
  match: MatchResult<Product> | null;
  warnings: ProductMatchWarning[];
}

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
   * Fuzzy code match — handles common OCR/typo errors:
   *   - transposed characters
   *   - single char substitution
   *   - leading/trailing noise
   */
  matchByFuzzyCode(code: string, products: Product[]): MatchResult<Product> | null {
    const normalized = normalizeString(code);
    if (normalized.length < 2) return null;

    let bestMatch: Product | null = null;
    let bestDistance = Infinity;

    for (const product of products) {
      const productCode = normalizeString(product.code);
      const dist = this.levenshtein(normalized, productCode);

      // Allow at most ~25% of the code length as edit distance, min 1
      const threshold = Math.max(1, Math.ceil(productCode.length * 0.25));
      if (dist <= threshold && dist < bestDistance) {
        bestDistance = dist;
        bestMatch = product;
      }
    }

    if (bestMatch) {
      const maxLen = Math.max(normalized.length, normalizeString(bestMatch.code).length);
      const confidence = Math.max(0.5, 1 - bestDistance / maxLen);
      return {
        item: bestMatch,
        confidence: Math.round(confidence * 100) / 100,
        method: "fuzzy-code",
      };
    }

    return null;
  }

  /**
   * Full match pipeline — tries all methods in priority order.
   * Returns match plus any warnings (inactive, MOQ, UOM mismatch).
   */
  matchWithValidation(
    code: string,
    products: Product[],
    options?: ProductMatchOptions,
  ): ProductMatchOutput {
    const warnings: ProductMatchWarning[] = [];

    // Try exact code
    let result = this.matchByCode(code, products);

    // Try barcode
    if (!result) {
      result = this.matchByBarcode(code, products);
    }

    // Try fuzzy code
    if (!result) {
      result = this.matchByFuzzyCode(code, products);
    }

    if (!result) {
      return { match: null, warnings };
    }

    // Check inactive
    if (!result.item.active) {
      warnings.push({
        type: "inactive-product",
        message: `Product ${result.item.code} is inactive/discontinued`,
        productCode: result.item.code,
      });
    }

    // MOQ validation
    if (options?.quantity != null && options.moq != null) {
      if (options.quantity < options.moq) {
        warnings.push({
          type: "below-moq",
          message: `Quantity ${options.quantity} is below MOQ of ${options.moq} for ${result.item.code}`,
          productCode: result.item.code,
        });
      }
    }

    // UOM validation
    if (options?.unit && result.item.unit) {
      if (!this.unitsMatch(options.unit, result.item.unit)) {
        warnings.push({
          type: "uom-mismatch",
          message: `PO unit "${options.unit}" differs from catalog unit "${result.item.unit}" for ${result.item.code}`,
          productCode: result.item.code,
        });
      }
    }

    return { match: result, warnings };
  }

  /**
   * Simple match (backward compatible) — tries code, barcode, fuzzy
   */
  match(code: string, products: Product[]): MatchResult<Product> | null {
    const { match } = this.matchWithValidation(code, products);
    return match;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Check if two unit strings are equivalent.
   * Handles common abbreviations: ea/each, cs/case/cases, doz/dozen, etc.
   */
  private unitsMatch(a: string, b: string): boolean {
    const normalize = (u: string) => u.toLowerCase().trim().replace(/s$/, "");

    const na = normalize(a);
    const nb = normalize(b);
    if (na === nb) return true;

    const aliases: Record<string, string[]> = {
      ea: ["each", "ea", "unit", "pc", "pce", "piece"],
      cs: ["case", "cs", "ctn", "carton"],
      doz: ["dozen", "doz", "dz"],
      kg: ["kg", "kilo", "kilogram"],
      lb: ["lb", "pound"],
      bx: ["box", "bx"],
      pk: ["pack", "pk", "pkt", "packet"],
      bt: ["bottle", "bt", "btl"],
    };

    for (const group of Object.values(aliases)) {
      const normalizedGroup = group.map(normalize);
      if (normalizedGroup.includes(na) && normalizedGroup.includes(nb)) {
        return true;
      }
    }

    return false;
  }
}
