export interface CreateSessionInput {
  idHash: string;
  userId: string;
  expiresAt: string;
}

export async function createSession(db: D1Database, input: CreateSessionInput): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO sessions (id_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(input.idHash, input.userId, input.expiresAt, now)
    .run();
}

/** Resolves a session hash to its user_id, or null if unknown/expired. */
export async function findUserIdBySessionHash(db: D1Database, idHash: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id_hash = ?")
    .bind(idHash)
    .first<{ user_id: string; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row.user_id;
}
