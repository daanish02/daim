import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";
import { getLeaderboard, getUserRank, type LeaderboardSort } from "../db/leaderboardRepo";
import { periodKeysForDate } from "../services/scoringService";
import type { PeriodType } from "../db/userPeriodStatsRepo";

const VALID_PERIODS: PeriodType[] = ["weekly", "monthly", "yearly", "alltime"];
const VALID_SORTS: LeaderboardSort[] = ["points", "consistency"];
const DEFAULT_LIMIT = 100;

export const leaderboardRoutes = new Hono<AuthEnv>();

leaderboardRoutes.get("/", async (c) => {
  const period = (c.req.query("period") ?? "monthly") as PeriodType;
  const sort = (c.req.query("sort") ?? "points") as LeaderboardSort;

  if (!VALID_PERIODS.includes(period)) return c.json({ error: "invalid period" }, 400);
  if (!VALID_SORTS.includes(sort)) return c.json({ error: "invalid sort" }, 400);

  const limit = Math.max(1, Number(c.req.query("limit") ?? DEFAULT_LIMIT));
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const offset = (page - 1) * limit;

  const todayStr = new Date().toISOString().slice(0, 10);
  const periodKey = periodKeysForDate(todayStr)[period];

  const [entries, me] = await Promise.all([
    getLeaderboard(c.env.DB, period, periodKey, sort, { limit, offset }),
    getUserRank(c.env.DB, period, periodKey, sort, c.get("userId")),
  ]);

  return c.json({ entries, me });
});
