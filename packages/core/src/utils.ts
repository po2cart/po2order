/**
 * Shared utility functions
 */

/**
 * Normalize string for matching (remove non-alphanumeric, uppercase)
 */
export function normalizeString(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidence(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Sleep utility for retries
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff calculator
 */
export function exponentialBackoff(attempt: number, baseMs: number = 1000): number {
  return Math.min(baseMs * Math.pow(2, attempt), 30000);
}
