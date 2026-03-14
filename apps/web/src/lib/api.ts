/**
 * POtoOrder Frontend API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchApi(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" })) as { message?: string };
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  purchaseOrders: {
    list: (status?: string) => fetchApi(`/api/purchase-orders${status ? `?status=${status}` : ""}`),
    get: (id: string) => fetchApi(`/api/purchase-orders/${id}`),
    hold: (id: string) => fetchApi(`/api/purchase-orders/${id}/hold`, { method: "POST" }),
    release: (id: string) => fetchApi(`/api/purchase-orders/${id}/release`, { method: "POST" }),
    approve: (id: string) => fetchApi(`/api/purchase-orders/${id}/approve`, { method: "POST" }),
  },
};
