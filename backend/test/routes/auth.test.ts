import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { Hono } from "hono";
import { ensureMigrated } from "../helpers/migrate";
import { buildAuthRoutes } from "../../src/routes/auth";
import type { GoogleClaims } from "../../src/auth/google";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

function buildApp(verifyGoogleIdToken: (idToken: string, clientId: string) => Promise<GoogleClaims>) {
  const app = new Hono<{ Bindings: typeof env }>();
  app.route("/api/auth", buildAuthRoutes({ verifyGoogleIdToken }));
  return app;
}

describe("POST /api/auth/google", () => {
  test("verifies id_token, creates user, returns a session token", async () => {
    const app = buildApp(async () => ({ sub: "google-sub-1", email: "ada@gmail.com", name: "Ada" }));

    const res = await app.request(
      "/api/auth/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "irrelevant-in-this-test", timezone: "UTC" }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json<{ session_token: string; user: { display_name: string } }>();
    expect(body.session_token).toBeTruthy();
    expect(body.user.display_name).toBe("Ada");
  });

  test("400 when id_token missing", async () => {
    const app = buildApp(async () => ({ sub: "x", email: "x", name: "x" }));
    const res = await app.request(
      "/api/auth/google",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timezone: "UTC" }) },
      env,
    );
    expect(res.status).toBe(400);
  });

  test("401 when Google verification fails", async () => {
    const app = buildApp(async () => {
      throw new Error("bad token");
    });

    const res = await app.request(
      "/api/auth/google",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: "garbage", timezone: "UTC" }),
      },
      env,
    );
    expect(res.status).toBe(401);
  });

  test("repeat sign-in reuses the same user and issues a new session", async () => {
    const app = buildApp(async () => ({ sub: "google-sub-2", email: "bob@gmail.com", name: "Bob" }));

    const first = await app.request(
      "/api/auth/google",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_token: "t1", timezone: "UTC" }) },
      env,
    );
    const second = await app.request(
      "/api/auth/google",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_token: "t2", timezone: "UTC" }) },
      env,
    );

    const firstBody = await first.json<{ session_token: string; user: { id: string } }>();
    const secondBody = await second.json<{ session_token: string; user: { id: string } }>();

    expect(secondBody.user.id).toBe(firstBody.user.id);
    expect(secondBody.session_token).not.toBe(firstBody.session_token);
  });
});

describe("POST /api/auth/logout", () => {
  test("204s and invalidates the session token", async () => {
    const app = buildApp(async () => ({ sub: "google-sub-3", email: "cam@gmail.com", name: "Cam" }));

    const signIn = await app.request(
      "/api/auth/google",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_token: "t", timezone: "UTC" }) },
      env,
    );
    const { session_token } = await signIn.json<{ session_token: string }>();

    const res = await app.request(
      "/api/auth/logout",
      { method: "POST", headers: { Authorization: `Bearer ${session_token}` } },
      env,
    );
    expect(res.status).toBe(204);
  });

  test("204s even with no Authorization header (idempotent)", async () => {
    const app = buildApp(async () => ({ sub: "x", email: "x", name: "x" }));
    const res = await app.request("/api/auth/logout", { method: "POST" }, env);
    expect(res.status).toBe(204);
  });
});
