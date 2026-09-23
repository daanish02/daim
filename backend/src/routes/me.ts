import { Hono } from "hono";
import type { AuthEnv } from "../middleware/auth";
import { findUserById, updateUserProfile, deleteUser } from "../db/userRepo";
import { listPrayerDaysInRange } from "../db/prayerDayRepo";

export const meRoutes = new Hono<AuthEnv>();

meRoutes.get("/", async (c) => {
  const user = await findUserById(c.env.DB, c.get("userId"));
  if (!user) return c.json({ error: "user not found" }, 404);
  return c.json(user);
});

meRoutes.patch("/", async (c) => {
  type PatchBody = { country?: string; language?: string; leaderboard_visible?: boolean };
  const body = await c.req.json<PatchBody>().catch((): PatchBody => ({}));
  const updated = await updateUserProfile(c.env.DB, c.get("userId"), {
    country: body.country,
    language: body.language,
    leaderboardVisible: body.leaderboard_visible,
  });
  return c.json(updated);
});

meRoutes.delete("/", async (c) => {
  await deleteUser(c.env.DB, c.get("userId"));
  return c.body(null, 204);
});

meRoutes.get("/export", async (c) => {
  const userId = c.get("userId");
  const user = await findUserById(c.env.DB, userId);
  if (!user) return c.json({ error: "user not found" }, 404);

  // Full history: no upper bound on range needed for an export.
  const prayerDays = await listPrayerDaysInRange(c.env.DB, userId, "0000-01-01", "9999-12-31");

  return c.json({ user, prayer_days: prayerDays });
});
