import { findPrayerDay } from "./prayerDayRepo";
import { prayerStateToPoints, periodKeysForDate, type PeriodKeys } from "../services/scoringService";
import { isLocked } from "../services/deadlineService";

export type PeriodType = "weekly" | "monthly" | "yearly" | "alltime";

export interface PeriodStats {
  points: number;
  eligible_points: number;
}

const PRAYER_NAMES = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export async function getPeriodStats(
  db: D1Database,
  userId: string,
  periodType: PeriodType,
  periodKey: string,
): Promise<PeriodStats> {
  const row = await db
    .prepare("SELECT points, eligible_points FROM user_period_stats WHERE user_id = ? AND period_type = ? AND period_key = ?")
    .bind(userId, periodType, periodKey)
    .first<PeriodStats>();
  return row ?? { points: 0, eligible_points: 0 };
}

/**
 * Recomputes and upserts every period row (weekly/monthly/yearly/alltime)
 * that `prayerDate` belongs to. Called on every prayer write (write-time
 * upsert design). Each period row is fully re-derived from prayer_days
 * every time, so repeated calls are idempotent - no double counting.
 */
export async function recomputePeriodStats(
  db: D1Database,
  userId: string,
  prayerDate: string,
  now: Date = new Date(),
): Promise<void> {
  const day = await findPrayerDay(db, userId, prayerDate);
  if (!day) throw new Error("prayer_days row missing - call getOrCreatePrayerDay first");

  const keys = periodKeysForDate(prayerDate);
  const periods: [PeriodType, string][] = [
    ["weekly", keys.weekly],
    ["monthly", keys.monthly],
    ["yearly", keys.yearly],
    ["alltime", keys.alltime],
  ];

  for (const [periodType, periodKey] of periods) {
    const { points, eligible_points } = await sumPeriodFromPrayerDays(db, userId, periodType, periodKey, now);
    await upsertPeriodRow(db, userId, periodType, periodKey, points, eligible_points);
  }
}

async function upsertPeriodRow(
  db: D1Database,
  userId: string,
  periodType: PeriodType,
  periodKey: string,
  points: number,
  eligiblePoints: number,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO user_period_stats (id, user_id, period_type, period_key, points, eligible_points, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, period_type, period_key)
       DO UPDATE SET points = excluded.points, eligible_points = excluded.eligible_points, updated_at = excluded.updated_at`,
    )
    .bind(crypto.randomUUID(), userId, periodType, periodKey, points, eligiblePoints, updatedAt)
    .run();
}

/** Re-derives a period's totals by scanning every prayer_days row that maps to it. */
async function sumPeriodFromPrayerDays(
  db: D1Database,
  userId: string,
  periodType: PeriodType,
  periodKey: string,
  now: Date,
): Promise<PeriodStats> {
  const { results } = await db
    .prepare("SELECT * FROM prayer_days WHERE user_id = ?")
    .bind(userId)
    .all<{
      prayer_date: string;
      deadline_at: string;
      fajr: 1 | -1 | null;
      dhuhr: 1 | -1 | null;
      asr: 1 | -1 | null;
      maghrib: 1 | -1 | null;
      isha: 1 | -1 | null;
    }>();

  let points = 0;
  let eligible = 0;

  for (const day of results) {
    const keys = periodKeysForDate(day.prayer_date);
    if (keyFor(periodType, keys) !== periodKey) continue;

    const locked = isLocked(day.deadline_at, now);
    for (const prayer of PRAYER_NAMES) {
      const score = prayerStateToPoints(day[prayer], { locked });
      points += score.points;
      eligible += score.eligible;
    }
  }

  return { points, eligible_points: eligible };
}

function keyFor(periodType: PeriodType, keys: PeriodKeys): string {
  return keys[periodType];
}
