import { describe, expect, test } from "vitest";
import { parseGoogleIdTokenClaims } from "../../src/auth/google";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

describe("parseGoogleIdTokenClaims", () => {
  test("rejects a token with wrong issuer", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwt = await new SignJWT({ sub: "123", email: "a@b.com", name: "A" })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuer("https://evil.example.com")
      .setAudience("client-id")
      .setExpirationTime("1h")
      .sign(privateKey);

    await expect(
      parseGoogleIdTokenClaims(jwt, "client-id", async () => exportJWK(publicKey)),
    ).rejects.toThrow(/unexpected "iss" claim/i);
  });

  test("rejects a token with wrong audience", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwt = await new SignJWT({ sub: "123", email: "a@b.com", name: "A" })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuer("https://accounts.google.com")
      .setAudience("someone-else")
      .setExpirationTime("1h")
      .sign(privateKey);

    await expect(
      parseGoogleIdTokenClaims(jwt, "client-id", async () => exportJWK(publicKey)),
    ).rejects.toThrow(/unexpected "aud" claim/i);
  });

  test("extracts sub/email/name from a valid token", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const jwt = await new SignJWT({ sub: "google-sub-123", email: "user@gmail.com", name: "Test User" })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuer("https://accounts.google.com")
      .setAudience("client-id")
      .setExpirationTime("1h")
      .sign(privateKey);

    const claims = await parseGoogleIdTokenClaims(jwt, "client-id", async () => exportJWK(publicKey));

    expect(claims).toEqual({ sub: "google-sub-123", email: "user@gmail.com", name: "Test User" });
  });
});
