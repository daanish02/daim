import { describe, expect, test } from "vitest";
import { generateSessionToken, hashSessionToken } from "../../src/auth/session";

describe("generateSessionToken", () => {
  test("returns a random 43+ char url-safe string", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("two calls return different tokens", () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
});

describe("hashSessionToken", () => {
  test("same token hashes to the same value", async () => {
    const token = "abc123";
    expect(await hashSessionToken(token)).toBe(await hashSessionToken(token));
  });

  test("different tokens hash to different values", async () => {
    expect(await hashSessionToken("abc123")).not.toBe(await hashSessionToken("xyz789"));
  });

  test("hash is hex-encoded SHA-256 (64 chars)", async () => {
    const hash = await hashSessionToken("abc123");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
