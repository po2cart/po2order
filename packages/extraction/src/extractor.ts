/**
 * Purchase Order Extractor
 * 
 * Uses OpenAI GPT-4 to extract structured data from PDFs and emails
 */

import OpenAI from "openai";
import { ExtractedPurchaseOrder, ExtractedPurchaseOrderSchema } from "@po2order/core";

export interface ExtractorConfig {
  openaiApiKey: string;
  model?: string;
}

export class PurchaseOrderExtractor {
  private openai: OpenAI;
  private model: string;

  constructor(config: ExtractorConfig) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.model = config.model || "gpt-4o";
  }

  /**
   * Extract purchase order data from text content
   */
  async extract(content: string): Promise<ExtractedPurchaseOrder> {
    const systemPrompt = `You are an AI assistant that extracts purchase order data from documents.
Extract the following information and return it as JSON:
- Order number, order date, expected delivery date
- Customer code, name, phone, email
- Delivery address (line1, line2, city, state, postalCode, country)
- Line items (productCode, description, quantity, unit, unitPrice, totalPrice)
- Totals (subtotal, tax, total)
- Any special instructions or notes

Return ONLY valid JSON matching the schema. If a field is not present, omit it or set to null.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const extractedText = response.choices[0]?.message?.content;
    if (!extractedText) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(extractedText);
    return ExtractedPurchaseOrderSchema.parse(parsed);
  }
}
