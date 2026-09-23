import { createRemoteJWKSet, importJWK, jwtVerify, type JWK } from "jose";

const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export interface GoogleClaims {
  sub: string;
  email: string;
  name: string;
}

type JwkFetcher = () => Promise<JWK>;

/**
 * Verify a Google-issued id_token's signature, issuer, audience, and
 * expiry, then extract the identity claims we store. `fetchKey` is
 * injectable for tests; production uses Google's live JWKS endpoint.
 */
export async function parseGoogleIdTokenClaims(
  idToken: string,
  expectedAudience: string,
  fetchKey: JwkFetcher,
): Promise<GoogleClaims> {
  const jwk = await fetchKey();
  const key = await importJWK(jwk, "RS256");

  const { payload } = await jwtVerify(idToken, key, {
    issuer: GOOGLE_ISSUER,
    audience: expectedAudience,
  });

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
  };
}

/** Production entry point: verifies against Google's live JWKS. */
export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleClaims> {
  const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUER,
    audience: clientId,
  });

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
  };
}
