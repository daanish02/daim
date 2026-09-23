import { getSessionToken } from "../auth/session";

// EXPO_PUBLIC_* vars are inlined at build time - set in .env / eas.json per environment.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
}

/**
 * Fetch wrapper for the Daim backend: resolves the base URL, attaches the
 * stored session as a Bearer token when present, JSON-encodes the request
 * body, and throws ApiError on any non-2xx response.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = await getSessionToken();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
