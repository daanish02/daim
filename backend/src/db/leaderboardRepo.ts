import type { PeriodType } from "./userPeriodStatsRepo";

export type LeaderboardSort = "points" | "consistency";

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  eligible_points: number;
}

export interface LeaderboardPage {
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 100;

function scoreExpr(sort: LeaderboardSort): string {
  return sort === "points"
    ? "s.points"
    : "CASE WHEN s.eligible_points > 0 THEN CAST(s.points AS REAL) / s.eligible_points ELSE 0 END";
}

/**
 * Visible-user leaderboard for a period, sorted by raw points or by
 * consistency (points/eligible_points). No hidden combined ranking score,
 * no participation threshold - matches PRD's "immediately understandable"
 * ranking rule. Paginated (default 100 rows) since the full table is
 * unbounded; use getUserRank to place a caller outside the current page.
 */
export async function getLeaderboard(
  db: D1Database,
  periodType: PeriodType,
  periodKey: string,
  sort: LeaderboardSort,
  page: LeaderboardPage = {},
): Promise<LeaderboardRow[]> {
  const limit = page.limit ?? DEFAULT_LIMIT;
  const offset = page.offset ?? 0;

  const { results } = await db
    .prepare(
      `SELECT u.id AS user_id, u.display_name, s.points, s.eligible_points
       FROM user_period_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.period_type = ? AND s.period_key = ? AND u.leaderboard_visible = 1
       ORDER BY ${scoreExpr(sort)} DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(periodType, periodKey, limit, offset)
    .all<LeaderboardRow>();

  return results;
}

export interface UserRank {
  rank: number;
  points: number;
  eligible_points: number;
}

/**
 * The caller's 1-indexed rank for a period, or null if they have no
 * stats row for it or have opted out of the leaderboard. Lets the client
 * always show "your rank" even when it falls outside the current page.
 */
export async function getUserRank(
  db: D1Database,
  periodType: PeriodType,
  periodKey: string,
  sort: LeaderboardSort,
  userId: string,
): Promise<UserRank | null> {
  const mine = await db
    .prepare(
      `SELECT s.points, s.eligible_points
       FROM user_period_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.period_type = ? AND s.period_key = ? AND s.user_id = ? AND u.leaderboard_visible = 1`,
    )
    .bind(periodType, periodKey, userId)
    .first<{ points: number; eligible_points: number }>();

  if (!mine) return null;

  const myScore = sort === "points" ? mine.points : mine.eligible_points > 0 ? mine.points / mine.eligible_points : 0;

  const { count } = (await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM user_period_stats s
       JOIN users u ON u.id = s.user_id
       WHERE s.period_type = ? AND s.period_key = ? AND u.leaderboard_visible = 1
         AND ${scoreExpr(sort)} > ?`,
    )
    .bind(periodType, periodKey, myScore)
    .first<{ count: number }>())!;

  return { rank: count + 1, points: mine.points, eligible_points: mine.eligible_points };
}
