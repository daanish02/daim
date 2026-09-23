import type { MiddlewareHandler } from "hono";
import type { Env } from "../index";
import { hashSessionToken } from "../auth/session";
import { findUserIdBySessionHash } from "../db/sessionRepo";

export interface AuthEnv {
  Bindings: Env;
  Variables: { userId: string };
}

/** Resolves `Authorization: Bearer <token>` to a user_id, or 401s. */
export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return c.json({ error: "unauthorized" }, 401);

  const idHash = await hashSessionToken(token);
  const userId = await findUserIdBySessionHash(c.env.DB, idHash);
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  c.set("userId", userId);
  await next();
};
