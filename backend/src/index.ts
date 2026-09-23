import { Hono } from "hono";
import { authRoutes } from "./routes/auth";
import { prayerDayRoutes } from "./routes/prayerDays";
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

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, _env: Env, _ctx: ExecutionContext) {
    // deadline sweep cron - wired in a later step
  },
};
