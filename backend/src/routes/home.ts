import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";
import { getOrCreatePrayerDay, listPrayerDaysInRange } from "../db/prayerDayRepo";
import { getPeriodStats } from "../db/userPeriodStatsRepo";
import { periodKeysForDate } from "../services/scoringService";
import { findUserById } from "../db/userRepo";

export const homeRoutes = new Hono<AuthEnv>();

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

homeRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: "user not found" }, 404);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = await getOrCreatePrayerDay(c.env.DB, userId, todayStr, user.timezone);

  // 8-week / 56-day contribution window, ending today. Zero-filled so the
  // graph always renders 56 squares even for days with no prayer_days row.
  const contributionFrom = addDays(todayStr, -55);
  const existingDays = await listPrayerDaysInRange(c.env.DB, userId, contributionFrom, todayStr);
  const byDate = new Map(existingDays.map((d) => [d.prayer_date, d]));
  const contribution = [];
  for (let i = 0; i < 56; i++) {
    const date = addDays(contributionFrom, i);
    contribution.push(
      byDate.get(date) ?? {
        prayer_date: date,
        fajr: null,
        dhuhr: null,
        asr: null,
        maghrib: null,
        isha: null,
      },
    );
  }

  // 4-week consistency trend: this week and the 3 preceding it.
  const consistency = [];
  for (let i = 3; i >= 0; i--) {
    const weekAnchor = addDays(todayStr, -7 * i);
    const { weekly } = periodKeysForDate(weekAnchor);
    const stats = await getPeriodStats(c.env.DB, userId, "weekly", weekly);
    const pct = stats.eligible_points > 0 ? Math.round((stats.points / stats.eligible_points) * 100) : 0;
    consistency.push({ period_key: weekly, consistency: pct });
  }

  return c.json({ today, contribution, consistency });
});
