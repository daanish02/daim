import { deadlineForPrayerDate } from "../services/deadlineService";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerValue = 1 | -1 | null;

export interface PrayerDay {
  id: string;
  user_id: string;
  prayer_date: string;
  fajr: PrayerValue;
  dhuhr: PrayerValue;
  asr: PrayerValue;
  maghrib: PrayerValue;
  isha: PrayerValue;
  timezone: string;
  deadline_at: string;
}

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export async function findPrayerDay(db: D1Database, userId: string, prayerDate: string): Promise<PrayerDay | null> {
  const row = await db
    .prepare("SELECT * FROM prayer_days WHERE user_id = ? AND prayer_date = ?")
    .bind(userId, prayerDate)
    .first<PrayerDay>();
  return row ?? null;
}

/** Fetches the row for (user, date), creating it (all prayers null) if absent. */
export async function getOrCreatePrayerDay(
  db: D1Database,
  userId: string,
  prayerDate: string,
  timezone: string,
): Promise<PrayerDay> {
  const existing = await findPrayerDay(db, userId, prayerDate);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const deadlineAt = deadlineForPrayerDate(prayerDate, timezone);
  await db
    .prepare(
      `INSERT INTO prayer_days (id, user_id, prayer_date, fajr, dhuhr, asr, maghrib, isha, timezone, deadline_at)
       VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
    )
    .bind(id, userId, prayerDate, timezone, deadlineAt)
    .run();

  return {
    id,
    user_id: userId,
    prayer_date: prayerDate,
    fajr: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
    timezone,
    deadline_at: deadlineAt,
  };
}

/**
 * Sets one prayer's value on an existing prayer_days row. Caller is
 * responsible for the deadline-lock check before calling this.
 */
export async function setPrayerState(
  db: D1Database,
  userId: string,
  prayerDate: string,
  prayer: PrayerName,
  value: PrayerValue,
): Promise<PrayerDay> {
  if (!PRAYER_NAMES.includes(prayer)) {
    throw new Error(`Unknown prayer: ${prayer}`);
  }
  await db
    .prepare(`UPDATE prayer_days SET ${prayer} = ? WHERE user_id = ? AND prayer_date = ?`)
    .bind(value, userId, prayerDate)
    .run();

  const updated = await findPrayerDay(db, userId, prayerDate);
  if (!updated) throw new Error("prayer_days row missing after update - call getOrCreatePrayerDay first");
  return updated;
}
