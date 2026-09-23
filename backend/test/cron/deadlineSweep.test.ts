import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { getOrCreatePrayerDay, setPrayerState } from "../../src/db/prayerDayRepo";
import { getPeriodStats } from "../../src/db/userPeriodStatsRepo";
import { runDeadlineSweep } from "../../src/cron/deadlineSweep";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

describe("runDeadlineSweep", () => {
  test("recomputes stats for a day whose deadline passed with pending prayers", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
    // Deadline for 2026-03-11 (UTC) is 2026-03-13T23:59:59Z.
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);
    // dhuhr/asr/maghrib/isha stay pending (null) - never touched again.

    // No recompute has run yet since the deadline passed.
    const before = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    expect(before).toEqual({ points: 0, eligible_points: 0 });

    await runDeadlineSweep(env.DB, new Date("2026-03-20T00:00:00Z"));

    const after = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    // fajr=1 (1pt/1elig) + 4 locked-pending (0pt/1elig each) = 1pt / 5elig
    expect(after).toEqual({ points: 1, eligible_points: 5 });
  });

  test("does not touch a day whose deadline has not passed yet", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-2", displayName: "Bob", timezone: "UTC" });
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);

    // "now" is before the 2026-03-13T23:59:59Z deadline.
    await runDeadlineSweep(env.DB, new Date("2026-03-12T00:00:00Z"));

    const stats = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    expect(stats).toEqual({ points: 0, eligible_points: 0 });
  });

  test("is idempotent - running twice does not double count", async () => {
    const user = await upsertUserByGoogleId(env.DB, { googleId: "g-3", displayName: "Cam", timezone: "UTC" });
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);

    await runDeadlineSweep(env.DB, new Date("2026-03-20T00:00:00Z"));
    await runDeadlineSweep(env.DB, new Date("2026-03-21T00:00:00Z"));

    const stats = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    expect(stats).toEqual({ points: 1, eligible_points: 5 });
  });
});
