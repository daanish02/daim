import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";

export const adminRoutes = new Hono<AuthEnv>();

// ---------------------------------------------------------------------------
// Issue #6 — Analytics routes
// ---------------------------------------------------------------------------

/** Total registered users. */
adminRoutes.get("/analytics/users/total", async (c) => {
  const row = await c.env.DB.prepare("SELECT COUNT(*) AS total FROM users").first<{ total: number }>();
  return c.json({ total: row?.total ?? 0 });
});

/** New users per period: ?period=day|week|month, ?since=YYYY-MM-DD */
adminRoutes.get("/analytics/users/new", async (c) => {
  const period = c.req.query("period") ?? "day";
  const since = c.req.query("since");

  const groupExpr =
    period === "month"
      ? "strftime('%Y-%m', created_at)"
      : period === "week"
        ? "strftime('%Y-W%W', created_at)"
        : "strftime('%Y-%m-%d', created_at)";

  const whereSql = since ? `WHERE created_at >= ?` : "";
  const stmt = c.env.DB.prepare(
    `SELECT ${groupExpr} AS period, COUNT(*) AS count FROM users ${whereSql} GROUP BY 1 ORDER BY 1 DESC LIMIT 90`,
  );
  const bound = since ? stmt.bind(since) : stmt;
  const { results } = await bound.all<{ period: string; count: number }>();
  return c.json(results);
});

/** Daily / weekly / monthly active users (distinct users with at least one session created or prayer logged). */
adminRoutes.get("/analytics/users/active", async (c) => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const dayStart = iso(now);
  const weekStart = iso(new Date(now.getTime() - 6 * 86400000));
  const monthStart = iso(new Date(now.getTime() - 29 * 86400000));

  const dau = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE created_at >= ?",
  )
    .bind(dayStart)
    .first<{ n: number }>();

  const wau = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE created_at >= ?",
  )
    .bind(weekStart)
    .first<{ n: number }>();

  const mau = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) AS n FROM sessions WHERE created_at >= ?",
  )
    .bind(monthStart)
    .first<{ n: number }>();

  return c.json({ dau: dau?.n ?? 0, wau: wau?.n ?? 0, mau: mau?.n ?? 0 });
});

/** Prayer logging activity: total prayer_days rows and rows with at least one prayer logged. */
adminRoutes.get("/analytics/prayers/activity", async (c) => {
  const total = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM prayer_days").first<{ n: number }>();
  const logged = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM prayer_days WHERE fajr = 1 OR dhuhr = 1 OR asr = 1 OR maghrib = 1 OR isha = 1",
  ).first<{ n: number }>();

  // Average number of prayers per logged day (over days with at least one prayer)
  const avg = await c.env.DB.prepare(
    `SELECT AVG(
       (CASE WHEN fajr = 1 THEN 1 ELSE 0 END) +
       (CASE WHEN dhuhr = 1 THEN 1 ELSE 0 END) +
       (CASE WHEN asr = 1 THEN 1 ELSE 0 END) +
       (CASE WHEN maghrib = 1 THEN 1 ELSE 0 END) +
       (CASE WHEN isha = 1 THEN 1 ELSE 0 END)
     ) AS avg_prayers
     FROM prayer_days
     WHERE fajr = 1 OR dhuhr = 1 OR asr = 1 OR maghrib = 1 OR isha = 1`,
  ).first<{ avg_prayers: number | null }>();

  return c.json({
    total_prayer_days: total?.n ?? 0,
    days_with_any_prayer: logged?.n ?? 0,
    avg_prayers_per_active_day: avg?.avg_prayers != null ? Math.round(avg.avg_prayers * 100) / 100 : null,
  });
});

/** Average consistency across all users with any period stats. */
adminRoutes.get("/analytics/prayers/consistency", async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT AVG(CASE WHEN eligible_points > 0 THEN CAST(points AS REAL) / eligible_points ELSE NULL END) AS avg_consistency
     FROM user_period_stats
     WHERE period_type = 'alltime'`,
  ).first<{ avg_consistency: number | null }>();

  return c.json({
    avg_consistency_pct:
      row?.avg_consistency != null ? Math.round(row.avg_consistency * 10000) / 100 : null,
  });
});

/** Leaderboard opt-in rate. */
adminRoutes.get("/analytics/leaderboard/opt-in-rate", async (c) => {
  const total = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  const optedIn = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM users WHERE leaderboard_visible = 1",
  ).first<{ n: number }>();

  const t = total?.n ?? 0;
  const o = optedIn?.n ?? 0;
  return c.json({ total_users: t, opted_in: o, opt_in_rate_pct: t > 0 ? Math.round((o / t) * 10000) / 100 : null });
});

/** Country distribution. */
adminRoutes.get("/analytics/users/countries", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT country, COUNT(*) AS count FROM users GROUP BY country ORDER BY count DESC",
  ).all<{ country: string | null; count: number }>();
  return c.json(results);
});

/** Language distribution. */
adminRoutes.get("/analytics/users/languages", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT language, COUNT(*) AS count FROM users GROUP BY language ORDER BY count DESC",
  ).all<{ language: string; count: number }>();
  return c.json(results);
});

// ---------------------------------------------------------------------------
// Issue #7 — Performance / debug routes
// ---------------------------------------------------------------------------

/** Database row counts for all tables — quick health check. */
adminRoutes.get("/debug/db/counts", async (c) => {
  const tables = ["users", "sessions", "prayer_days", "user_period_stats", "admin_users"] as const;
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const row = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
    counts[table] = row?.n ?? 0;
  }
  return c.json(counts);
});

/** Sessions: active (not expired) vs expired. */
adminRoutes.get("/debug/sessions", async (c) => {
  const now = new Date().toISOString();
  const active = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?",
  )
    .bind(now)
    .first<{ n: number }>();
  const expired = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sessions WHERE expires_at <= ?",
  )
    .bind(now)
    .first<{ n: number }>();
  return c.json({ active: active?.n ?? 0, expired: expired?.n ?? 0 });
});

/**
 * Cron deadline sweep status: rows still pending after their deadline.
 * A non-zero result means the last cron run may not have completed, or
 * new rows have accumulated since it ran.
 */
adminRoutes.get("/debug/cron/deadline-sweep", async (c) => {
  const now = new Date().toISOString();
  const { results } = await c.env.DB.prepare(
    `SELECT COUNT(*) AS pending_rows,
            MIN(deadline_at) AS oldest_deadline,
            MAX(deadline_at) AS newest_deadline
     FROM prayer_days
     WHERE deadline_at < ?
       AND (fajr IS NULL OR dhuhr IS NULL OR asr IS NULL OR maghrib IS NULL OR isha IS NULL)`,
  )
    .bind(now)
    .all<{ pending_rows: number; oldest_deadline: string | null; newest_deadline: string | null }>();

  const row = results[0];
  return c.json({
    pending_rows_after_deadline: row?.pending_rows ?? 0,
    oldest_deadline: row?.oldest_deadline ?? null,
    newest_deadline: row?.newest_deadline ?? null,
    checked_at: now,
  });
});

/** System health: DB connectivity and basic stats. */
adminRoutes.get("/debug/health", async (c) => {
  const start = Date.now();
  try {
    await c.env.DB.prepare("SELECT 1").first();
    const db_latency_ms = Date.now() - start;
    return c.json({ ok: true, db_latency_ms, checked_at: new Date().toISOString() });
  } catch (err) {
    return c.json({ ok: false, error: String(err), checked_at: new Date().toISOString() }, 500);
  }
});
