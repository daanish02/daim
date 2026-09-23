import { recomputePeriodStats } from "../db/userPeriodStatsRepo";

/**
 * Daily job: for every prayer_days row whose deadline has passed and still
 * has at least one pending (null) prayer, recompute that user's period
 * stats. recomputePeriodStats itself derives locked/pending state from
 * deadline_at vs `now`, so this just guarantees a recompute HAPPENS for
 * users who never reopen the app after their editing window closes -
 * without it, a pending prayer would stay excluded from eligible_points
 * forever instead of settling to its locked value (0 points, 1 eligible).
 *
 * Idempotent: recompute always re-derives the full period total from
 * prayer_days, so running the sweep more than once never double-counts.
 */
export async function runDeadlineSweep(db: D1Database, now: Date = new Date()): Promise<number> {
  const nowIso = now.toISOString();
  const { results } = await db
    .prepare(
      `SELECT DISTINCT user_id, prayer_date FROM prayer_days
       WHERE deadline_at < ?
         AND (fajr IS NULL OR dhuhr IS NULL OR asr IS NULL OR maghrib IS NULL OR isha IS NULL)`,
    )
    .bind(nowIso)
    .all<{ user_id: string; prayer_date: string }>();

  for (const row of results) {
    await recomputePeriodStats(db, row.user_id, row.prayer_date, now);
  }

  return results.length;
}
