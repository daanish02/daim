import type { MiddlewareHandler } from "hono";
import type { AuthEnv } from "./auth";

/** Requires prior authMiddleware; additionally checks admin_users membership. */
export const adminMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const userId = c.get("userId");
  const row = await c.env.DB.prepare("SELECT user_id FROM admin_users WHERE user_id = ?")
    .bind(userId)
    .first<{ user_id: string }>();
  if (!row) return c.json({ error: "forbidden" }, 403);
  await next();
};
