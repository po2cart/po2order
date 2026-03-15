/**
 * Customer matching engine
 *
 * Matches extracted customer identifiers against the customer database.
 * Supports: code, email, phone, name, and address matching.
 */

import { Customer, normalizeString } from "@po2order/core";
import type { MatchResult } from "./types";

export class CustomerMatcher {
  /**
   * Match customer by code (highest confidence)
   */
  matchByCode(code: string, customers: Customer[]): MatchResult<Customer> | null {
    const normalized = normalizeString(code);
    const customer = customers.find((c) => normalizeString(c.code) === normalized);
    return customer ? { item: customer, confidence: 1.0, method: "code" } : null;
  }

  /**
   * Match customer by email
   */
  matchByEmail(email: string, customers: Customer[]): MatchResult<Customer> | null {
    const lower = email.toLowerCase().trim();
    const customer = customers.find((c) => c.email?.toLowerCase().trim() === lower);
    return customer ? { item: customer, confidence: 0.95, method: "email" } : null;
  }

  /**
   * Match customer by phone (normalized — digits only)
   */
  matchByPhone(phone: string, customers: Customer[]): MatchResult<Customer> | null {
    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 6) return null;

    const customer = customers.find((c) => {
      if (!c.phone) return false;
      const cDigits = c.phone.replace(/\D/g, "").replace(/^0+/, "");
      // Match last N digits to handle country code differences (e.g. +64 vs 0)
      const minLen = Math.min(digits.length, cDigits.length);
      if (minLen < 6) return false;
      
      return digits.slice(-minLen) === cDigits.slice(-minLen);
    });
    return customer ? { item: customer, confidence: 0.85, method: "phone" } : null;
  }

  /**
   * Match customer by name (fuzzy — handles "Ltd", "Limited", "Inc", etc.)
   */
  matchByName(name: string, customers: Customer[]): MatchResult<Customer> | null {
    const normalized = this.normalizeCompanyName(name);
    if (normalized.length < 2) return null;

    let bestMatch: Customer | null = null;
    let bestScore = 0;

    for (const customer of customers) {
      const customerNorm = this.normalizeCompanyName(customer.name);
      const score = this.nameSimilarity(normalized, customerNorm);

      if (score > bestScore && score >= 0.8) {
        bestScore = score;
        bestMatch = customer;
      }
    }

    if (bestMatch) {
      return {
        item: bestMatch,
        confidence: Math.round(Math.min(bestScore * 0.9, 0.85) * 100) / 100,
        method: "name",
      };
    }

    return null;
  }

  /**
   * Match customer by delivery address
   */
  matchByAddress(
    address: { line1?: string; city?: string; postalCode?: string },
    customers: Customer[],
  ): MatchResult<Customer> | null {
    if (!address.postalCode && !address.line1) return null;

    for (const customer of customers) {
      if (!customer.deliveryAddresses?.length) continue;

      for (const addr of customer.deliveryAddresses) {
        let matchScore = 0;
        let factors = 0;

        if (address.postalCode && addr.postalCode) {
          factors++;
          if (
            normalizeString(address.postalCode) ===
            normalizeString(addr.postalCode)
          ) {
            matchScore += 1;
          }
        }

        if (address.line1 && addr.line1) {
          factors++;
          if (
            normalizeString(address.line1) === normalizeString(addr.line1)
          ) {
            matchScore += 1;
          }
        }

        if (address.city && addr.city) {
          factors++;
          if (
            normalizeString(address.city) === normalizeString(addr.city)
          ) {
            matchScore += 1;
          }
        }

        if (factors > 0 && matchScore / factors >= 0.66) {
          return {
            item: customer,
            confidence: Math.round((matchScore / factors) * 0.8 * 100) / 100,
            method: "address",
          };
        }
      }
    }

    return null;
  }

  /**
   * Try all matching methods in priority order.
   * Returns the highest-confidence match.
   */
  match(
    identifiers: {
      code?: string;
      email?: string;
      phone?: string;
      name?: string;
      address?: { line1?: string; city?: string; postalCode?: string };
    },
    customers: Customer[],
  ): MatchResult<Customer> | null {
    if (identifiers.code) {
      const result = this.matchByCode(identifiers.code, customers);
      if (result) return result;
    }

    if (identifiers.email) {
      const result = this.matchByEmail(identifiers.email, customers);
      if (result) return result;
    }

    if (identifiers.phone) {
      const result = this.matchByPhone(identifiers.phone, customers);
      if (result) return result;
    }

    if (identifiers.name) {
      const result = this.matchByName(identifiers.name, customers);
      if (result) return result;
    }

    if (identifiers.address) {
      const result = this.matchByAddress(identifiers.address, customers);
      if (result) return result;
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(
        /\b(ltd|limited|inc|incorporated|corp|corporation|pty|proprietary|co|company|llc|plc|nz|au|group|holdings)\b/g,
        "",
      )
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private nameSimilarity(a: string, b: string): number {
    const tokensA = new Set(a.split(" ").filter(Boolean));
    const tokensB = new Set(b.split(" ").filter(Boolean));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let overlap = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) overlap++;
    }

    const union = new Set([...tokensA, ...tokensB]).size;
    return overlap / union;
  }
}
