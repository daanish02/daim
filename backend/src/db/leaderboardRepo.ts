import type { PeriodType } from "./userPeriodStatsRepo";

export type LeaderboardSort = "points" | "consistency";

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  eligible_points: number;
}

/**
 * Visible-user leaderboard for a period, sorted by raw points or by
 * consistency (points/eligible_points). No hidden combined ranking score,
 * no participation threshold - matches PRD's "immediately understandable"
 * ranking rule.
 */
export async function getLeaderboard(
  db: D1Database,
  periodType: PeriodType,
  periodKey: string,
  sort: LeaderboardSort,
): Promise<LeaderboardRow[]> {
  const orderBy =
    sort === "points"
      ? "s.points DESC"
      : "CASE WHEN s.eligible_points > 0 THEN CAST(s.points AS REAL) / s.eligible_points ELSE 0 END DESC";

  const { results } = await db
    .prepare(
      `SELECT u.id AS user_id, u.display_name, s.points, s.eligible_points
       FROM user_period_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.period_type = ? AND s.period_key = ? AND u.leaderboard_visible = 1
       ORDER BY ${orderBy}`,
    )
    .bind(periodType, periodKey)
    .all<LeaderboardRow>();

  return results;
}
