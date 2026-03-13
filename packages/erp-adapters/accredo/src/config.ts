import { z } from "zod";

/**
 * Accredo ERP connection configuration
 *
 * Accredo uses a REST API with OData-style query parameters.
 * Base URL example: https://accredo.example.com
 * Authentication via API key in headers.
 */
export const AccredoConfigSchema = z.object({
  baseUrl: z.string().url().describe("Accredo Web API base URL"),
  apiKey: z.string().min(1).describe("Accredo API key"),
  companyCode: z.string().optional().describe("Accredo company code (multi-company setups)"),
  /** Timeout for individual API requests in ms */
  requestTimeoutMs: z.number().default(30_000),
  /** Max concurrent requests to Accredo API */
  maxConcurrency: z.number().default(5),
});

export type AccredoConfig = z.infer<typeof AccredoConfigSchema>;
