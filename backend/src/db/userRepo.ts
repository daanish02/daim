export interface User {
  id: string;
  google_id: string;
  display_name: string;
  country: string | null;
  timezone: string;
  language: string;
  leaderboard_visible: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertUserInput {
  googleId: string;
  displayName: string;
  timezone: string;
  country?: string | null;
  language?: string;
}

export async function findUserByGoogleId(db: D1Database, googleId: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .bind(googleId)
    .first<User>();
  return row ?? null;
}

/**
 * Create the user on first Google sign-in, or refresh display_name on
 * repeat sign-in. Identity (google_id) never changes once created.
 */
export async function upsertUserByGoogleId(db: D1Database, input: UpsertUserInput): Promise<User> {
  const existing = await findUserByGoogleId(db, input.googleId);
  const now = new Date().toISOString();

  if (existing) {
    await db
      .prepare("UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?")
      .bind(input.displayName, now, existing.id)
      .run();
    return { ...existing, display_name: input.displayName, updated_at: now };
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO users (id, google_id, display_name, country, timezone, language, leaderboard_visible, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
    .bind(id, input.googleId, input.displayName, input.country ?? null, input.timezone, input.language ?? "en", now, now)
    .run();

  return {
    id,
    google_id: input.googleId,
    display_name: input.displayName,
    country: input.country ?? null,
    timezone: input.timezone,
    language: input.language ?? "en",
    leaderboard_visible: 0,
    created_at: now,
    updated_at: now,
  };
}
