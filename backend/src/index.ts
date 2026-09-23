import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { prayerDayRoutes } from "./routes/prayerDays";
import { homeRoutes } from "./routes/home";
import { leaderboardRoutes } from "./routes/leaderboard";
import { meRoutes } from "./routes/me";
import { authMiddleware, type AuthEnv } from "./middleware/auth";

export interface Env {
  DB: D1Database;
  ANALYTICS: AnalyticsEngineDataset;
  GOOGLE_CLIENT_ID: string;
}

const app = new Hono<AuthEnv>();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);
app.use("/api/prayer-days/*", authMiddleware);
app.route("/api/prayer-days", prayerDayRoutes);
app.use("/api/home", authMiddleware);
app.route("/api/home", homeRoutes);
app.use("/api/leaderboard", authMiddleware);
app.route("/api/leaderboard", leaderboardRoutes);
app.use("/api/me*", authMiddleware);
app.route("/api/me", meRoutes);

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, _env: Env, _ctx: ExecutionContext) {
    // deadline sweep cron - wired in a later step
  },
};
