import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession } from "../../src/db/sessionRepo";
import { hashSessionToken } from "../../src/auth/session";
import { authMiddleware, type AuthEnv } from "../../src/middleware/auth";
import { prayerDayRoutes } from "../../src/routes/prayerDays";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function authedUser(timezone = "UTC") {
  const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone });
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
  app.use("/api/prayer-days/*", authMiddleware);
  app.route("/api/prayer-days", prayerDayRoutes);
  return app;
}

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const today = () => new Date().toISOString().slice(0, 10);

describe("PUT /api/prayer-days/:date/:prayer", () => {
  test("logs a prayer as prayed", async () => {
    const { token } = await authedUser();
    const app = buildApp();

    const res = await app.request(
      `/api/prayer-days/${today()}/fajr`,
      { method: "PUT", headers: authHeaders(token) },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json<{ fajr: number }>();
    expect(body.fajr).toBe(1);
  });

  test("401 without auth", async () => {
    const app = buildApp();
    const res = await app.request(`/api/prayer-days/${today()}/fajr`, { method: "PUT" }, env);
    expect(res.status).toBe(401);
  });

  test("400 for an unknown prayer name", async () => {
    const { token } = await authedUser();
    const app = buildApp();
    const res = await app.request(
      `/api/prayer-days/${today()}/zuhr`,
      { method: "PUT", headers: authHeaders(token) },
      env,
    );
    expect(res.status).toBe(400);
  });

  test("400 for a future date", async () => {
    const { token } = await authedUser();
    const app = buildApp();
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const res = await app.request(
      `/api/prayer-days/${futureDate}/fajr`,
      { method: "PUT", headers: authHeaders(token) },
      env,
    );
    expect(res.status).toBe(400);
  });

  test("409 when the editing window has closed", async () => {
    const { token } = await authedUser();
    const app = buildApp();
    const res = await app.request(
      "/api/prayer-days/2020-01-01/fajr",
      { method: "PUT", headers: authHeaders(token) },
      env,
    );
    expect(res.status).toBe(409);
  });
});

describe("PUT /api/prayer-days/:date/exempt", () => {
  test("marks all five prayers exempt", async () => {
    const { token } = await authedUser();
    const app = buildApp();

    const res = await app.request(
      `/api/prayer-days/${today()}/exempt`,
      { method: "PUT", headers: authHeaders(token) },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json<Record<string, number>>();
    expect([body.fajr, body.dhuhr, body.asr, body.maghrib, body.isha]).toEqual([-1, -1, -1, -1, -1]);
  });
});
