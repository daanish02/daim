import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession } from "../../src/db/sessionRepo";
import { hashSessionToken } from "../../src/auth/session";
import { authMiddleware, type AuthEnv } from "../../src/middleware/auth";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

function buildApp() {
  const app = new Hono<AuthEnv>();
  app.use("/protected", authMiddleware);
  app.get("/protected", (c) => c.json({ userId: c.get("userId") }));
  return app;
}

describe("authMiddleware", () => {
  test("401 when no Authorization header", async () => {
    const app = buildApp();
    const res = await app.request("/protected", {}, env);
    expect(res.status).toBe(401);
  });

  test("401 when Authorization header is not Bearer", async () => {
    const app = buildApp();
    const res = await app.request("/protected", { headers: { Authorization: "Basic xyz" } }, env);
    expect(res.status).toBe(401);
  });

  test("401 when bearer token has no matching session", async () => {
    const app = buildApp();
    const res = await app.request("/protected", { headers: { Authorization: "Bearer nonexistent" } }, env);
    expect(res.status).toBe(401);
  });

  test("200 and sets userId when bearer token matches a valid session", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
    const token = "raw-token-123";
    const idHash = await hashSessionToken(token);
    await createSession(env.DB, {
      idHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    const app = buildApp();
    const res = await app.request("/protected", { headers: { Authorization: `Bearer ${token}` } }, env);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: user.id });
  });
});
