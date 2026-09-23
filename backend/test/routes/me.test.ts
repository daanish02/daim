import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession } from "../../src/db/sessionRepo";
import { hashSessionToken } from "../../src/auth/session";
import { authMiddleware, type AuthEnv } from "../../src/middleware/auth";
import { meRoutes } from "../../src/routes/me";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function authedUser() {
  const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
  const token = "test-token";
  await createSession(env.DB, {
    idHash: await hashSessionToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  });
  return { user, token };
}

function buildApp() {
  const app = new Hono<AuthEnv>();
  app.use("/api/me*", authMiddleware);
  app.route("/api/me", meRoutes);
  return app;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const jsonHeaders = (token: string) => ({ ...authHeaders(token), "Content-Type": "application/json" });

describe("GET /api/me", () => {
  test("returns the current user", async () => {
    const { token } = await authedUser();
    const res = await buildApp().request("/api/me", { headers: authHeaders(token) }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ display_name: string }>();
    expect(body.display_name).toBe("Ada");
  });

  test("401 without auth", async () => {
    const res = await buildApp().request("/api/me", {}, env);
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/me", () => {
  test("updates leaderboard_visible, country, language", async () => {
    const { token } = await authedUser();
    const res = await buildApp().request(
      "/api/me",
      { method: "PATCH", headers: jsonHeaders(token), body: JSON.stringify({ leaderboard_visible: true, country: "IN", language: "en" }) },
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json<{ leaderboard_visible: number; country: string }>();
    expect(body.leaderboard_visible).toBe(1);
    expect(body.country).toBe("IN");
  });

  test("ignores attempts to change google_id or id", async () => {
    const { user, token } = await authedUser();
    const res = await buildApp().request(
      "/api/me",
      { method: "PATCH", headers: jsonHeaders(token), body: JSON.stringify({ id: "hacked", google_id: "hacked" }) },
      env,
    );
    const body = await res.json<{ id: string; google_id: string }>();
    expect(body.id).toBe(user.id);
    expect(body.google_id).toBe("g-1");
  });
});

describe("DELETE /api/me", () => {
  test("deletes the account and its prayer history", async () => {
    const { user, token } = await authedUser();
    const res = await buildApp().request("/api/me", { method: "DELETE", headers: authHeaders(token) }, env);
    expect(res.status).toBe(204);

    const row = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(user.id).first();
    expect(row).toBeNull();
  });
});

describe("GET /api/me/export", () => {
  test("returns user profile and prayer history as JSON", async () => {
    const { token } = await authedUser();
    const res = await buildApp().request("/api/me/export", { headers: authHeaders(token) }, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ user: { display_name: string }; prayer_days: unknown[] }>();
    expect(body.user.display_name).toBe("Ada");
    expect(Array.isArray(body.prayer_days)).toBe(true);
  });
});
