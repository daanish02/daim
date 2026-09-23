export type PrayerState = 1 | -1 | null;

export interface Score {
  points: number;
  eligible: number;
}

/**
 * Convert a single prayer's stored state to points/eligible-points.
 *
 * 1    = prayed      -> 1 point, 1 eligible
 * -1   = exempt      -> excluded from scoring entirely
 * null = unrecorded  -> pending (not yet locked): excluded until deadline
 *                       locked (deadline passed): 0 points, 1 eligible
 */
export function prayerStateToPoints(
  state: PrayerState,
  opts: { locked: boolean } = { locked: false },
): Score {
  if (state === 1) return { points: 1, eligible: 1 };
  if (state === -1) return { points: 0, eligible: 0 };
  // state === null
  return opts.locked ? { points: 0, eligible: 1 } : { points: 0, eligible: 0 };
}

export interface PeriodKeys {
  weekly: string;
  monthly: string;
  yearly: string;
  alltime: string;
}

/**
 * Derive the period keys a given prayer_date (YYYY-MM-DD, already resolved to
 * the user's timezone) contributes to. ISO-8601 week numbering for weekly.
 */
export function periodKeysForDate(dateStr: string): PeriodKeys {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  const yearly = String(y);
  const monthly = `${y}-${String(m).padStart(2, "0")}`;

  // ISO week: Thursday of the current week determines the ISO week-year.
  const isoDate = new Date(date.getTime());
  const dayNum = (isoDate.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  isoDate.setUTCDate(isoDate.getUTCDate() - dayNum + 3); // nearest Thursday
  const isoYear = isoDate.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4.getTime());
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum);
  const weekNum = Math.round((isoDate.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1;
  const weekly = `${isoYear}-W${String(weekNum).padStart(2, "0")}`;

  return { weekly, monthly, yearly, alltime: "alltime" };
}
