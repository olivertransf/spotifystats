/**
 * Bucketing for “time of day” / “day of week” stats.
 * Node’s default is often UTC in production; use TIMEZONE so hours match where you listen.
 */

export function getStatsTimeZone(): string {
  const fromEnv = process.env.TIMEZONE?.trim() || process.env.SOUNDFOLIO_TIMEZONE?.trim();
  if (fromEnv) return fromEnv;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Hour 0–23 in `timeZone` (same instant as `date`). */
export function getHourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? parseInt(hourPart.value, 10) : 0;
}

/** 0 = Sunday … 6 = Saturday in `timeZone` (matches JS `Date#getDay`). */
export function getDayOfWeekInTimeZone(date: Date, timeZone: string): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** Calendar date `yyyy-MM-dd` in `timeZone` for bucketing daily charts. */
export function formatCalendarDateInZone(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}
