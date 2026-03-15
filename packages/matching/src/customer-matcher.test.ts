import { describe, it, expect } from "vitest";
import { CustomerMatcher } from "./customer-matcher";
import { Customer } from "@po2order/core";

const mockCustomers: Customer[] = [
  {
    id: "c1",
    code: "CUST-001",
    name: "Acme Corp Ltd",
    email: "billing@acme.com",
    phone: "0123456789",
    active: true,
    workspaceId: "ws-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryAddresses: [
      {
        id: "a1",
        code: "MAIN",
        line1: "123 Industrial Way",
        city: "Tech City",
        postalCode: "12345",
        workspaceId: "ws-1",
        customerId: "c1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
  },
  {
    id: "c2",
    code: "CUST-002",
    name: "Global Industries Limited",
    email: "info@global.co",
    phone: "+64 21 987 654",
    active: true,
    workspaceId: "ws-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("CustomerMatcher", () => {
  const matcher = new CustomerMatcher();

  describe("matchByCode", () => {
    it("should match by exact code", () => {
      const result = matcher.matchByCode("CUST-001", mockCustomers);
      expect(result?.item.id).toBe("c1");
      expect(result?.confidence).toBe(1.0);
    });
  });

  describe("matchByEmail", () => {
    it("should match by email", () => {
      const result = matcher.matchByEmail("billing@acme.com", mockCustomers);
      expect(result?.item.id).toBe("c1");
      expect(result?.confidence).toBe(0.95);
    });

    it("should match case-insensitively", () => {
      const result = matcher.matchByEmail("BILLING@ACME.COM", mockCustomers);
      expect(result?.item.id).toBe("c1");
    });
  });

  describe("matchByPhone", () => {
    it("should match by phone (ignoring non-digits)", () => {
      const result = matcher.matchByPhone("(01) 234 56789", mockCustomers);
      expect(result?.item.id).toBe("c1");
    });

    it("should match last N digits to handle country codes", () => {
      const result = matcher.matchByPhone("021987654", mockCustomers);
      expect(result?.item.id).toBe("c2");
    });
  });

  describe("matchByName", () => {
    it("should match fuzzy name (ignoring business suffixes)", () => {
      const result = matcher.matchByName("Acme Corp", mockCustomers);
      expect(result?.item.id).toBe("c1");
      expect(result?.method).toBe("name");
    });

    it("should handle Global Industries match", () => {
      const result = matcher.matchByName("Global Industries", mockCustomers);
      expect(result?.item.id).toBe("c2");
    });
  });

  describe("matchByAddress", () => {
    it("should match by line1 and postal code", () => {
      const result = matcher.matchByAddress({
        line1: "123 Industrial Way",
        postalCode: "12345"
      }, mockCustomers);
      expect(result?.item.id).toBe("c1");
      expect(result?.method).toBe("address");
    });

    it("should return null for no address match", () => {
      const result = matcher.matchByAddress({
        line1: "999 Ghost St",
        postalCode: "00000"
      }, mockCustomers);
      expect(result).toBeNull();
    });
  });

  describe("match pipeline", () => {
    it("should prioritize code over others", () => {
      const result = matcher.match({
        code: "CUST-001",
        email: "wrong@email.com"
      }, mockCustomers);
      expect(result?.item.id).toBe("c1");
      expect(result?.method).toBe("code");
    });

    it("should fall back to email if code not provided", () => {
      const result = matcher.match({
        email: "info@global.co"
      }, mockCustomers);
      expect(result?.item.id).toBe("c2");
      expect(result?.method).toBe("email");
    });
  });
});
