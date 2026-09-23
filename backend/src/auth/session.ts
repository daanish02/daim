/**
 * Opaque session tokens: a random token is handed to the client and sent as
 * `Authorization: Bearer <token>` on every request. Only its SHA-256 hash is
 * stored server-side (sessions.id_hash), so a leaked DB row can't be replayed
 * as a bearer token.
 */

/** Random URL-safe token (32 bytes -> 43-char base64url, no padding). */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Hex-encoded SHA-256 of the token, for storage/lookup as sessions.id_hash. */
export async function hashSessionToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
