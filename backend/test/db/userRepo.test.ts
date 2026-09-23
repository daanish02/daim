import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { upsertUserByGoogleId, findUserByGoogleId, findUserById } from "../../src/db/userRepo";
import { ensureMigrated } from "../helpers/migrate";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

describe("upsertUserByGoogleId", () => {
  test("creates a new user on first sign-in", async () => {
    const user = await upsertUserByGoogleId(env.DB, {
      googleId: "g-1",
      displayName: "Ada",
      timezone: "UTC",
    });

    expect(user.google_id).toBe("g-1");
    expect(user.display_name).toBe("Ada");
    expect(user.id).toBeTruthy();
  });

  test("returns the same user on repeat sign-in (idempotent)", async () => {
    const first = await upsertUserByGoogleId(env.DB, {
      googleId: "g-2",
      displayName: "Bob",
      timezone: "UTC",
    });
    const second = await upsertUserByGoogleId(env.DB, {
      googleId: "g-2",
      displayName: "Bob Updated",
      timezone: "UTC",
    });

    expect(second.id).toBe(first.id);
    expect(second.display_name).toBe("Bob Updated");
  });
});

describe("findUserByGoogleId", () => {
  test("returns null when no user exists", async () => {
    expect(await findUserByGoogleId(env.DB, "does-not-exist")).toBeNull();
  });

  test("finds an existing user", async () => {
    await upsertUserByGoogleId(env.DB, { googleId: "g-3", displayName: "Cam", timezone: "UTC" });
    const found = await findUserByGoogleId(env.DB, "g-3");
    expect(found?.display_name).toBe("Cam");
  });
});

describe("findUserById", () => {
  test("returns null when no user exists", async () => {
    expect(await findUserById(env.DB, "does-not-exist")).toBeNull();
  });

  test("finds an existing user by id", async () => {
    const created = await upsertUserByGoogleId(env.DB, { googleId: "g-4", displayName: "Dee", timezone: "UTC" });
    const found = await findUserById(env.DB, created.id);
    expect(found?.display_name).toBe("Dee");
  });
});
