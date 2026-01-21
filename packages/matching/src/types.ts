/**
 * Matching types
 */

export interface MatchResult<T> {
  item: T;
  confidence: number;
  method: string;
}
