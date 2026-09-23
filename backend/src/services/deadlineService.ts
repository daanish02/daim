/**
 * Editing-window math: a prayer_date remains editable until the end of the
 * second calendar day after it, in the user's timezone. Server time (UTC
 * instant) determines whether that deadline has passed; the user's timezone
 * determines where "23:59:59 of that calendar day" falls in UTC.
 */

/** Offset in minutes of `timeZone` at the given UTC instant (east of UTC = positive). */
function tzOffsetMinutes(timeZone: string, atUtc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(atUtc).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - atUtc.getTime()) / 60000);
}

/**
 * Deadline (ISO UTC instant) for a prayer_date (YYYY-MM-DD) in the given
 * IANA timezone: 23:59:59.000 local time, two calendar days later.
 */
export function deadlineForPrayerDate(prayerDate: string, timeZone: string): string {
  const [y, m, d] = prayerDate.split("-").map(Number);
  // Target local calendar date: prayer date + 2 days, at 23:59:59.
  const targetLocalNoonGuess = new Date(Date.UTC(y, m - 1, d + 2, 23, 59, 59));
  // Resolve tz offset using a guess instant, then correct: offset is stable
  // across the DST-transition-sized window we care about for this lookup.
  const offsetMin = tzOffsetMinutes(timeZone, targetLocalNoonGuess);
  const utcMs = targetLocalNoonGuess.getTime() - offsetMin * 60000;
  return new Date(utcMs).toISOString();
}

/** True once `now` is strictly after `deadlineIso`. */
export function isLocked(deadlineIso: string, now: Date = new Date()): boolean {
  return now.getTime() > new Date(deadlineIso).getTime();
}
