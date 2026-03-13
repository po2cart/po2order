import type { AccredoConfig } from "./config";

/**
 * Low-level HTTP client for the Accredo Web API.
 *
 * Accredo's API follows OData conventions:
 *   GET  /api/{entity}?$filter=...&$top=...&$skip=...
 *   GET  /api/{entity}('{id}')
 *   POST /api/{entity}
 *
 * Responses are JSON with an array in the response body for list queries.
 */
export class AccredoClient {
  private baseUrl: string;
  private apiKey: string;
  private requestTimeoutMs: number;

  constructor(config: AccredoConfig) {
    // Strip trailing slash
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.requestTimeoutMs),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AccredoApiError(response.status, `GET ${path}`, body);
    }

    return response.json() as Promise<T>;
  }

  async post<T = any>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { ...this.headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.requestTimeoutMs),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AccredoApiError(response.status, `POST ${path}`, text);
    }

    return response.json() as Promise<T>;
  }

  private headers(): Record<string, string> {
    return {
      Accept: "application/json",
      "X-API-KEY": this.apiKey,
    };
  }
}

export class AccredoApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly responseBody: string,
  ) {
    super(`Accredo API error ${statusCode} on ${endpoint}: ${responseBody}`);
    this.name = "AccredoApiError";
  }
}
