import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { createSession, findUserIdBySessionHash } from "../../src/db/sessionRepo";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

describe("createSession / findUserIdBySessionHash", () => {
  test("a created session resolves back to its user_id", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();

    await createSession(env.DB, { idHash: "hash-abc", userId: user.id, expiresAt });

    expect(await findUserIdBySessionHash(env.DB, "hash-abc")).toBe(user.id);
  });

  test("unknown hash resolves to null", async () => {
    expect(await findUserIdBySessionHash(env.DB, "no-such-hash")).toBeNull();
  });

  test("expired session resolves to null", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-2", displayName: "Bob", timezone: "UTC" });
    const expiresAt = new Date(Date.now() - 1000).toISOString(); // already expired

    await createSession(env.DB, { idHash: "hash-expired", userId: user.id, expiresAt });

    expect(await findUserIdBySessionHash(env.DB, "hash-expired")).toBeNull();
  });
});
