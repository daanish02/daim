import { apiFetch } from "./client";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerValue = 1 | -1 | null;

export interface PrayerDay {
  prayer_date: string;
  fajr: PrayerValue;
  dhuhr: PrayerValue;
  asr: PrayerValue;
  maghrib: PrayerValue;
  isha: PrayerValue;
}

export interface HomeData {
  today: PrayerDay;
  contribution: PrayerDay[];
  consistency: { period_key: string; consistency: number }[];
}

export function fetchHome(): Promise<HomeData> {
  return apiFetch<HomeData>("/api/home");
}

export function setPrayerState(date: string, prayer: PrayerName, value?: PrayerValue): Promise<PrayerDay> {
  if (value === undefined) {
    return apiFetch<PrayerDay>(`/api/prayer-days/${date}/${prayer}`, { method: "PUT" });
  }
  return apiFetch<PrayerDay>(`/api/prayer-days/${date}/${prayer}`, { method: "PUT", body: { value } });
}

export function setDayExempt(date: string): Promise<PrayerDay> {
  return apiFetch<PrayerDay>(`/api/prayer-days/${date}/exempt`, { method: "PUT" });
}
