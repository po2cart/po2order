/**
 * Customer matching engine
 */

import { Customer } from "@po2order/core";
import { MatchResult } from "./types";

export class CustomerMatcher {
  /**
   * Match customer by code
   */
  matchByCode(code: string, customers: Customer[]): MatchResult<Customer> | null {
    const customer = customers.find((c) => c.code === code);
    return customer ? { item: customer, confidence: 1.0, method: "code" } : null;
  }

  /**
   * Match customer by email
   */
  matchByEmail(email: string, customers: Customer[]): MatchResult<Customer> | null {
    const customer = customers.find((c) => c.email?.toLowerCase() === email.toLowerCase());
    return customer ? { item: customer, confidence: 0.9, method: "email" } : null;
  }

  /**
   * Match customer by phone
   */
  matchByPhone(phone: string, customers: Customer[]): MatchResult<Customer> | null {
    const normalized = phone.replace(/\D/g, "");
    const customer = customers.find((c) => c.phone?.replace(/\D/g, "") === normalized);
    return customer ? { item: customer, confidence: 0.85, method: "phone" } : null;
  }
}
