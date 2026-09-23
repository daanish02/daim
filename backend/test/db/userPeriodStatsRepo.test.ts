import { beforeEach, describe, expect, test } from "vitest";
import { env } from "cloudflare:test";
import { ensureMigrated } from "../helpers/migrate";
import { upsertUserByGoogleId } from "../../src/db/userRepo";
import { recomputePeriodStats, getPeriodStats } from "../../src/db/userPeriodStatsRepo";
import { getOrCreatePrayerDay, setPrayerState } from "../../src/db/prayerDayRepo";

beforeEach(async () => {
  await ensureMigrated(env.DB);
});

async function makeUser() {
  return upsertUserByGoogleId(env.DB, { googleId: "g-1", displayName: "Ada", timezone: "UTC" });
}

describe("recomputePeriodStats", () => {
  test("sums points/eligible across a day's 5 prayers into weekly/monthly/yearly/alltime rows", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);
    await setPrayerState(env.DB, user.id, "2026-03-11", "dhuhr", 1);
    await setPrayerState(env.DB, user.id, "2026-03-11", "asr", -1); // exempt, excluded
    // maghrib, isha stay null/pending (not locked -> excluded from eligible too)

    await recomputePeriodStats(env.DB, user.id, "2026-03-11", new Date("2026-03-11T12:00:00Z"));

    const weekly = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    expect(weekly).toEqual({ points: 2, eligible_points: 2 });

    const monthly = await getPeriodStats(env.DB, user.id, "monthly", "2026-03");
    expect(monthly).toEqual({ points: 2, eligible_points: 2 });

    const alltime = await getPeriodStats(env.DB, user.id, "alltime", "alltime");
    expect(alltime).toEqual({ points: 2, eligible_points: 2 });
  });

  test("locked pending prayer counts as 0 points, 1 eligible", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);
    // rest stay null; evaluate "now" well past the 2-day deadline

    await recomputePeriodStats(env.DB, user.id, "2026-03-11", new Date("2026-03-20T00:00:00Z"));

    const weekly = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    // fajr=1 (1pt/1elig) + 4 locked-nulls (0pt/1elig each) = 1pt / 5elig
    expect(weekly).toEqual({ points: 1, eligible_points: 5 });
  });

  test("re-running recompute after another prayer logged updates the same row (no double count)", async () => {
    const user = await makeUser();
    await getOrCreatePrayerDay(env.DB, user.id, "2026-03-11", "UTC");
    await setPrayerState(env.DB, user.id, "2026-03-11", "fajr", 1);
    await recomputePeriodStats(env.DB, user.id, "2026-03-11", new Date("2026-03-11T12:00:00Z"));

    await setPrayerState(env.DB, user.id, "2026-03-11", "dhuhr", 1);
    await recomputePeriodStats(env.DB, user.id, "2026-03-11", new Date("2026-03-11T13:00:00Z"));

    const weekly = await getPeriodStats(env.DB, user.id, "weekly", "2026-W11");
    expect(weekly).toEqual({ points: 2, eligible_points: 2 });
  });
});

describe("getPeriodStats", () => {
  test("returns zero stats when no row exists yet", async () => {
    const user = await makeUser();
    expect(await getPeriodStats(env.DB, user.id, "weekly", "2026-W11")).toEqual({ points: 0, eligible_points: 0 });
  });
});
