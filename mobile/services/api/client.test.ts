import { apiFetch, ApiError } from "./client";
import * as session from "../auth/session";

jest.mock("../auth/session");

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("apiFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("attaches Bearer header when a session token exists", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue("my-token");
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await apiFetch("/api/home");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-token");
  });

  test("omits Authorization header when no token stored", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue(null);
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch("/api/home");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test("returns parsed JSON body on success", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue("t");
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ hello: "world" }) });

    const result = await apiFetch<{ hello: string }>("/api/home");
    expect(result.hello).toBe("world");
  });

  test("throws ApiError with status and body on non-ok response", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue("t");
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) });

    await expect(apiFetch("/api/home")).rejects.toMatchObject({ status: 401 });
    await expect(apiFetch("/api/home")).rejects.toBeInstanceOf(ApiError);
  });

  test("returns undefined for a 204 No Content response instead of parsing JSON", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue("t");
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("should not be called on 204");
      },
    });

    const result = await apiFetch("/api/me");
    expect(result).toBeUndefined();
  });

  test("sends JSON content-type and stringifies body when body is given", async () => {
    (session.getSessionToken as jest.Mock).mockResolvedValue("t");
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch("/api/prayer-days/2026-03-11/fajr", { method: "PUT", body: { foo: "bar" } });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe(JSON.stringify({ foo: "bar" }));
  });
});
