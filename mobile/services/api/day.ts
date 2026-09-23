import { apiFetch } from "./client";
import type { PrayerDay } from "./home";

function blankDay(date: string): PrayerDay {
  return { prayer_date: date, fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null };
}

/**
 * A single day's prayers, via the range endpoint. The backend never
 * creates a prayer_days row just from a GET, so an unlogged day comes
 * back as an empty array - normalize that to an all-pending day so the
 * UI always has something to render.
 */
export async function fetchDay(date: string): Promise<PrayerDay> {
  const days = await apiFetch<PrayerDay[]>(`/api/prayer-days?from=${date}&to=${date}`);
  return days[0] ?? blankDay(date);
}
