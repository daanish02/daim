import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { getOrCreatePrayerDay, setPrayerState, listPrayerDaysInRange } from "../../src/db/prayerDayRepo";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function makeUser() {
  return upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
}

describe("getOrCreatePrayerDay", () => {
  test("creates a row with all prayers null on first access", async () => {
    const user = await makeUser();
    const day = await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");

    expect(day.prayer_date).toBe("2026-03-11");
    expect(day.fajr).toBeNull();
    expect(day.deadline_at).toBe("2026-03-13T23:59:59.000Z");
  });

  test("returns the same row on repeat access (idempotent)", async () => {
    const user = await makeUser();
    const first = await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    const second = await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    expect(second.id).toBe(first.id);
  });
});

describe("setPrayerState", () => {
  test("sets a single prayer to prayed (1)", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");

    const updated = await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);

    expect(updated.fajr).toBe(1);
    expect(updated.dhuhr).toBeNull();
  });

  test("sets a single prayer to exempt (-1)", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");

    const updated = await setPrayerState(env.DB, user.id, "2026-03-11", "asr", -1);

    expect(updated.asr).toBe(-1);
  });

  test("undo: sets a prayer back to null while editable", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "isha", 1);

    const updated = await setPrayerState(env.DB, user.id, "2026-03-11", "isha", null);

    expect(updated.isha).toBeNull();
  });
});

describe("listPrayerDaysInRange", () => {
  test("returns rows within [from, to] inclusive, ordered by date", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-10", "UTC");
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-12", "UTC");
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-15", "UTC"); // outside range
    await setPrayerState(env.DB, user.id, "2026-03-10", "fajr", 1);

    const days = await listPrayerDaysInRange(env.DB, user.id, "2026-03-10", "2026-03-12");

    expect(days.map((d) => d.prayer_date)).toEqual(["2026-03-10", "2026-03-12"]);
    expect(days[0].fajr).toBe(1);
  });

  test("returns empty array when nothing in range", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-2", displayName: "Bob", timezone: "UTC" });
    const days = await listPrayerDaysInRange(env.DB, user.id, "2026-01-01", "2026-01-31");
    expect(days).toEqual([]);
  });
});
