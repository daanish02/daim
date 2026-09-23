import { Hono } from "hono";
import type { Env } from "../index";
import type { GoogleClaims } from "../auth/google";
import { verifyGoogleIdToken as defaultVerifyGoogleIdToken } from "../auth/google";
import { generateSessionToken, hashSessionToken } from "../auth/session";
import { upsertUserByGoogleId } from "../db/userRepo";
import { createSession } from "../db/sessionRepo";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthRoutesDeps {
  verifyGoogleIdToken: (idToken: string, clientId: string) => Promise<GoogleClaims>;
}

/** Builds the /google sign-in route with an injectable Google verifier (for tests). */
export function buildAuthRoutes(deps: AuthRoutesDeps = { verifyGoogleIdToken: defaultVerifyGoogleIdToken }) {
  const routes = new Hono<{ Bindings: Env }>();

  routes.post("/google", async (c) => {
    const body = await c.req.json<{ id_token?: string; timezone?: string }>().catch(() => ({}) as never);
    if (!body.id_token || !body.timezone) {
      return c.json({ error: "id_token and timezone are required" }, 400);
    }

    let claims: GoogleClaims;
    try {
      claims = await deps.verifyGoogleIdToken(body.id_token, c.env.GOOGLE_CLIENT_ID);
    } catch {
      return c.json({ error: "invalid id_token" }, 401);
    }

    const user = await upsertUserByGoogleId(c.env.DB, {
      googleId: claims.sub,
      displayName: claims.name,
      timezone: body.timezone,
    });

    const token = generateSessionToken();
    const idHash = await hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
    await createSession(c.env.DB, { idHash, userId: user.id, expiresAt });

    return c.json({ session_token: token, user });
  });

  return routes;
}

/** Production router: uses the real Google JWKS verifier. */
export const authRoutes = buildAuthRoutes();
