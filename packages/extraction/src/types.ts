/**
 * Extraction-specific types
 */

export interface ExtractionResult<T> {
  data: T;
  confidence: number;
  model: string;
  tokensUsed: number;
  timeMs: number;
}
