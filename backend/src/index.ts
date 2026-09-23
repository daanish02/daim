import { Hono } from "hono";
import { authRoutes } from "./routes/auth";

export interface Env {
  DB: D1Database;
  ANALYTICS: AnalyticsEngineDataset;
  GOOGLE_CLIENT_ID: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes);

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, _env: Env, _ctx: ExecutionContext) {
    // deadline sweep cron - wired in a later step
  },
};
