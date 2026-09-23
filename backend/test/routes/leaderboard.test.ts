import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession } from "../../src/db/sessionRepo";
import { hashSessionToken } from "../../src/auth/session";
import { authMiddleware, type AuthEnv } from "../../src/middleware/auth";
import { leaderboardRoutes } from "../../src/routes/leaderboard";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function authedUser() {
  const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
  await env.DB.prepare("UPDATE users SET leaderboard_visible = 1 WHERE id = ?").bind(user.id).run();
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
  app.use("/api/leaderboard", authMiddleware);
  app.route("/api/leaderboard", leaderboardRoutes);
  return app;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("GET /api/leaderboard", () => {
  test("defaults to monthly period, points sort", async () => {
    const { user, token } = await authedUser();
    await env.DB.prepare(
      `INSERT INTO user_period_stats (id, user_id, period_type, period_key, points, eligible_points, updated_at)
       VALUES (?, ?, 'monthly', ?, 10, 10, ?)`,
    )
      .bind(crypto.randomUUID(), user.id, new Date().toISOString().slice(0, 7), new Date().toISOString())
      .run();

    const app = buildApp();
    const res = await app.request("/api/leaderboard", { headers: authHeaders(token) }, env);

    expect(res.status).toBe(200);
    const body = await res.json<{ display_name: string }[]>();
    expect(body[0].display_name).toBe("Ada");
  });

  test("400 for invalid period", async () => {
    const { token } = await authedUser();
    const app = buildApp();
    const res = await app.request("/api/leaderboard?period=decade", { headers: authHeaders(token) }, env);
    expect(res.status).toBe(400);
  });

  test("400 for invalid sort", async () => {
    const { token } = await authedUser();
    const app = buildApp();
    const res = await app.request("/api/leaderboard?sort=age", { headers: authHeaders(token) }, env);
    expect(res.status).toBe(400);
  });

  test("401 without auth", async () => {
    const app = buildApp();
    const res = await app.request("/api/leaderboard", {}, env);
    expect(res.status).toBe(401);
  });
});
