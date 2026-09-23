import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession } from "../../src/db/sessionRepo";
import { hashSessionToken } from "../../src/auth/session";
import { authMiddleware, type AuthEnv } from "../../src/middleware/auth";
import { prayerDayRoutes } from "../../src/routes/prayerDays";
import { homeRoutes } from "../../src/routes/home";

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
  app.use("/api/*", authMiddleware);
  app.route("/api/prayer-days", prayerDayRoutes);
  app.route("/api/home", homeRoutes);
  return app;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = () => new Date().toISOString().slice(0, 10);

describe("GET /api/home", () => {
  test("includes today's prayers, contribution window, and consistency window", async () => {
    const { token } = await authedUser();
    const app = buildApp();

    await app.request(`/api/prayer-days/${today()}/fajr`, { method: "PUT", headers: authHeaders(token) }, env);
    await app.request(`/api/prayer-days/${today()}/dhuhr`, { method: "PUT", headers: authHeaders(token) }, env);

    const res = await app.request("/api/home", { headers: authHeaders(token) }, env);

    expect(res.status).toBe(200);
    const body = await res.json<{
      today: { prayer_date: string; fajr: number; dhuhr: number };
      contribution: { prayer_date: string }[];
      consistency: { period_key: string; consistency: number }[];
    }>();

    expect(body.today.prayer_date).toBe(today());
    expect(body.today.fajr).toBe(1);
    expect(body.today.dhuhr).toBe(1);
    expect(body.contribution).toHaveLength(56); // 8 weeks
    expect(body.consistency).toHaveLength(4); // 4 weeks
  });

  test("401 without auth", async () => {
    const app = buildApp();
    const res = await app.request("/api/home", {}, env);
    expect(res.status).toBe(401);
  });
});
