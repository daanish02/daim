import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";
import { getOrCreatePrayerDay, setPrayerState, listPrayerDaysInRange, type PrayerName } from "../db/prayerDayRepo";
import { recomputePeriodStats } from "../db/userPeriodStatsRepo";
import { isLocked } from "../services/deadlineService";
import { findUserById } from "../db/userRepo";

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isFutureDate(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr > today;
}

export const prayerDayRoutes = new Hono<AuthEnv>();

prayerDayRoutes.get("/", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) {
    return c.json({ error: "from and to (YYYY-MM-DD) are required" }, 400);
  }

  const days = await listPrayerDaysInRange(c.env.DB, c.get("userId"), from, to);
  return c.json(days);
});

prayerDayRoutes.put("/:date/exempt", async (c) => {
  const date = c.req.param("date");
  if (!DATE_RE.test(date)) return c.json({ error: "invalid date" }, 400);
  if (isFutureDate(date)) return c.json({ error: "cannot log a future date" }, 400);

  const userId = c.get("userId");
  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: "user not found" }, 404);

  const day = await getOrCreatePrayerDay(c.env.DB, userId, date, user.timezone);
  if (isLocked(day.deadline_at)) return c.json({ error: "editing window closed" }, 409);

  let updated = day;
  for (const prayer of PRAYER_NAMES) {
    updated = await setPrayerState(c.env.DB, userId, date, prayer, -1);
  }
  await recomputePeriodStats(c.env.DB, userId, date);

  return c.json(updated);
});

prayerDayRoutes.put("/:date/:prayer", async (c) => {
  const date = c.req.param("date");
  const prayer = c.req.param("prayer") as PrayerName;

  if (!DATE_RE.test(date)) return c.json({ error: "invalid date" }, 400);
  if (!PRAYER_NAMES.includes(prayer)) return c.json({ error: "unknown prayer" }, 400);
  if (isFutureDate(date)) return c.json({ error: "cannot log a future date" }, 400);

  const userId = c.get("userId");
  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: "user not found" }, 404);

  const day = await getOrCreatePrayerDay(c.env.DB, userId, date, user.timezone);
  if (isLocked(day.deadline_at)) return c.json({ error: "editing window closed" }, 409);

  const updated = await setPrayerState(c.env.DB, userId, date, prayer, 1);
  await recomputePeriodStats(c.env.DB, userId, date);

  return c.json(updated);
});
