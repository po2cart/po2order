import { describe, it, expect } from "vitest";
import { ProductMatcher } from "./product-matcher";
import { Product } from "@po2order/core";

const mockProducts: Product[] = [
  {
    id: "1",
    code: "PROD-100",
    name: "Widget A",
    active: true,
    unit: "each",
    barcode: "123456789",
    workspaceId: "ws-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    code: "PROD-200",
    name: "Gadget B",
    active: false,
    unit: "case",
    barcode: "987654321",
    workspaceId: "ws-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    code: "SKU-999",
    name: "Hammer",
    active: true,
    unit: "ea",
    workspaceId: "ws-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("ProductMatcher", () => {
  const matcher = new ProductMatcher();

  describe("matchByCode", () => {
    it("should match by exact code", () => {
      const result = matcher.matchByCode("PROD-100", mockProducts);
      expect(result?.item.id).toBe("1");
      expect(result?.confidence).toBe(1.0);
      expect(result?.method).toBe("exact-code");
    });

    it("should match case-insensitively", () => {
      const result = matcher.matchByCode("prod-100", mockProducts);
      expect(result?.item.id).toBe("1");
    });

    it("should return null if no match found", () => {
      const result = matcher.matchByCode("NON-EXISTENT", mockProducts);
      expect(result).toBeNull();
    });
  });

  describe("matchByBarcode", () => {
    it("should match by barcode", () => {
      const result = matcher.matchByBarcode("123456789", mockProducts);
      expect(result?.item.id).toBe("1");
      expect(result?.method).toBe("barcode");
    });

    it("should return null if no barcode match found", () => {
      const result = matcher.matchByBarcode("000000000", mockProducts);
      expect(result).toBeNull();
    });
  });

  describe("matchByFuzzyCode", () => {
    it("should match with single character difference", () => {
      const result = matcher.matchByFuzzyCode("PROD-101", mockProducts);
      expect(result?.item.id).toBe("1");
      expect(result?.method).toBe("fuzzy-code");
      expect(result?.confidence).toBeGreaterThan(0.8);
    });

    it("should match with transpositions", () => {
      const result = matcher.matchByFuzzyCode("PRDO-100", mockProducts);
      expect(result?.item.id).toBe("1");
    });

    it("should not match if distance is too high", () => {
      const result = matcher.matchByFuzzyCode("X-100", mockProducts);
      expect(result).toBeNull();
    });
  });

  describe("matchWithValidation", () => {
    it("should return match and no warnings for clean match", () => {
      const { match, warnings } = matcher.matchWithValidation("PROD-100", mockProducts);
      expect(match?.item.id).toBe("1");
      expect(warnings).toHaveLength(0);
    });

    it("should return warning for inactive product", () => {
      const { match, warnings } = matcher.matchWithValidation("PROD-200", mockProducts);
      expect(match?.item.id).toBe("2");
      expect(warnings).toContainEqual(expect.objectContaining({ type: "inactive-product" }));
    });

    it("should return warning for UOM mismatch", () => {
      const { match, warnings } = matcher.matchWithValidation("PROD-100", mockProducts, { unit: "case" });
      expect(match?.item.id).toBe("1");
      expect(warnings).toContainEqual(expect.objectContaining({ type: "uom-mismatch" }));
    });

    it("should recognize equivalent units (ea vs each)", () => {
      const { match, warnings } = matcher.matchWithValidation("SKU-999", mockProducts, { unit: "each" });
      expect(match?.item.id).toBe("3");
      expect(warnings).not.toContainEqual(expect.objectContaining({ type: "uom-mismatch" }));
    });
  });
});
