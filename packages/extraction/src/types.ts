/**
 * Extraction-specific types
 */

export interface ExtractionResult<T> {
  data: T;
  confidence: number;
  model: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  timeMs: number;
}

/**
 * Pass 1 output — just enough to identify the customer
 */
export interface CustomerIdentification {
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Input document for extraction — supports text, images, PDFs, and spreadsheets
 */
export type DocumentInput =
  | { type: "text"; content: string }
  | { type: "image"; data: Buffer | string; mimeType: string }
  | { type: "pdf"; data: Buffer | string; filename?: string }
  | { type: "spreadsheet"; content: string }; // pre-parsed to text table
