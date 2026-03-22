import {
  startOfWeek,
  startOfMonth,
  subMonths,
  subWeeks,
  subDays,
  format,
} from "date-fns";
import type { TimeRangeFilter } from "@/lib/stats";
import {
  getStatsTimeZone,
  getHourInTimeZone,
  getDayOfWeekInTimeZone,
  formatCalendarDateInZone,
} from "@/lib/stats-timezone";
import { getDemoStreams, type DemoStreamRow } from "@/lib/demo-seed";

function buildWhere(filter: TimeRangeFilter) {
  const where: { playedAt?: { gte?: Date; lte?: Date } } = {};
  if (filter.since) where.playedAt = { ...where.playedAt, gte: filter.since };
  if (filter.until) where.playedAt = { ...where.playedAt, lte: filter.until };
  return Object.keys(where).length ? where : {};
}

function filterByRange(
  streams: DemoStreamRow[],
  filter: TimeRangeFilter | undefined
): DemoStreamRow[] {
  if (!filter) return streams;
  const w = buildWhere(filter);
  if (!w.playedAt) return streams;
  return streams.filter(
    (s) =>
      (!w.playedAt!.gte || s.playedAt >= w.playedAt!.gte) &&
      (!w.playedAt!.lte || s.playedAt <= w.playedAt!.lte)
  );
}

function resolveDateWhere(filter: TimeRangeFilter | undefined, fallbackSince: Date) {
  if (!filter) return (s: DemoStreamRow) => s.playedAt >= fallbackSince;
  if (filter.since || filter.until) {
    const w = buildWhere(filter);
    if (!w.playedAt) return () => true;
    return (s: DemoStreamRow) =>
      (!w.playedAt!.gte || s.playedAt >= w.playedAt!.gte) &&
      (!w.playedAt!.lte || s.playedAt <= w.playedAt!.lte);
  }
  return () => true;
}

export function demoGetTotalStats(filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  let totalMs = 0;
  for (const s of streams) totalMs += s.durationMs;
  return {
    totalStreams: streams.length,
    totalMinutes: Math.round(totalMs / 60000),
    totalHours: Math.round(totalMs / 3600000),
  };
}

export function demoGetTopTracks(limit = 20, filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  const map = new Map<
    string,
    {
      trackId: string;
      trackName: string;
      artistName: string;
      albumName: string;
      albumArt: string | null;
      streams: number;
      durationMs: number;
    }
  >();

  for (const s of streams) {
    const key = `${s.trackId}|${s.trackName}|${s.artistName}|${s.albumName}`;
    const cur = map.get(key);
    if (cur) {
      cur.streams += 1;
      cur.durationMs += s.durationMs;
    } else {
      map.set(key, {
        trackId: s.trackId,
        trackName: s.trackName,
        artistName: s.artistName,
        albumName: s.albumName,
        albumArt: s.albumArt,
        streams: 1,
        durationMs: s.durationMs,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.streams - a.streams)
    .slice(0, limit)
    .map((t) => ({
      trackId: t.trackId,
      trackName: t.trackName,
      artistName: t.artistName,
      albumName: t.albumName,
      albumArt: t.albumArt,
      streams: t.streams,
      minutesListened: Math.round(t.durationMs / 60000),
    }));
}

export function demoGetTopArtists(limit = 20, filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  const map = new Map<
    string,
    { streams: number; durationMs: number; artistArt: string | null }
  >();

  for (const s of streams) {
    const cur = map.get(s.artistName);
    if (cur) {
      cur.streams += 1;
      cur.durationMs += s.durationMs;
      if (!cur.artistArt && s.artistArt) cur.artistArt = s.artistArt;
    } else {
      map.set(s.artistName, {
        streams: 1,
        durationMs: s.durationMs,
        artistArt: s.artistArt,
      });
    }
  }

  return [...map.entries()]
    .sort((a, b) => b[1].streams - a[1].streams)
    .slice(0, limit)
    .map(([artistName, v]) => ({
      artistName,
      artistArt: v.artistArt,
      streams: v.streams,
      minutesListened: Math.round(v.durationMs / 60000),
    }));
}

export function demoGetTopAlbums(limit = 20, filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  const map = new Map<
    string,
    {
      albumName: string;
      albumArt: string | null;
      artistName: string;
      streams: number;
      durationMs: number;
    }
  >();

  for (const s of streams) {
    const key = `${s.albumName}|${s.artistName}`;
    const cur = map.get(key);
    if (cur) {
      cur.streams += 1;
      cur.durationMs += s.durationMs;
    } else {
      map.set(key, {
        albumName: s.albumName,
        albumArt: s.albumArt,
        artistName: s.artistName,
        streams: 1,
        durationMs: s.durationMs,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.streams - a.streams)
    .slice(0, limit)
    .map((a) => ({
      albumName: a.albumName,
      albumArt: a.albumArt,
      artistName: a.artistName,
      streams: a.streams,
      minutesListened: Math.round(a.durationMs / 60000),
    }));
}

export function demoGetRecentStreams(limit = 50) {
  return [...getDemoStreams()]
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .slice(0, limit);
}

export function demoGetStreamsByHour(filter?: TimeRangeFilter) {
  const tz = getStatsTimeZone();
  const streams = filterByRange(getDemoStreams(), filter);
  const byHour: Record<number, { streams: number; minutes: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { streams: 0, minutes: 0 };

  for (const s of streams) {
    const h = getHourInTimeZone(s.playedAt, tz);
    byHour[h].streams++;
    byHour[h].minutes += Math.round(s.durationMs / 60000);
  }

  return Object.entries(byHour).map(([hour, data]) => ({
    hour: parseInt(hour, 10),
    label: `${hour.toString().padStart(2, "0")}:00`,
    ...data,
  }));
}

export function demoGetStreamsByDayOfWeek(filter?: TimeRangeFilter) {
  const tz = getStatsTimeZone();
  const streams = filterByRange(getDemoStreams(), filter);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay: Record<number, { streams: number; minutes: number }> = {};
  for (let d = 0; d < 7; d++) byDay[d] = { streams: 0, minutes: 0 };

  for (const s of streams) {
    const d = getDayOfWeekInTimeZone(s.playedAt, tz);
    byDay[d].streams++;
    byDay[d].minutes += Math.round(s.durationMs / 60000);
  }

  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    day: d,
    label: dayNames[d],
    ...byDay[d],
  }));
}

export function demoGetListeningHeatmap(filter?: TimeRangeFilter) {
  const tz = getStatsTimeZone();
  const streams = filterByRange(getDemoStreams(), filter);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) counts[`${d}-${h}`] = 0;
  }
  for (const s of streams) {
    const d = getDayOfWeekInTimeZone(s.playedAt, tz);
    const h = getHourInTimeZone(s.playedAt, tz);
    counts[`${d}-${h}`]++;
  }
  const grid: { day: number; hour: number; count: number }[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.push({ day: d, hour: h, count: counts[`${d}-${h}`] ?? 0 });
    }
  }
  return { grid, dayNames };
}

export function demoGetStreamsByWeek(weeksBack = 26, filter?: TimeRangeFilter) {
  const defaultSince = subWeeks(new Date(), weeksBack);
  const pred = resolveDateWhere(filter, defaultSince);
  const streams = getDemoStreams().filter(pred).sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  const byWeek: Record<string, { streams: number; minutes: number }> = {};
  for (const s of streams) {
    const weekStart = format(startOfWeek(s.playedAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!byWeek[weekStart]) byWeek[weekStart] = { streams: 0, minutes: 0 };
    byWeek[weekStart].streams++;
    byWeek[weekStart].minutes += Math.round(s.durationMs / 60000);
  }
  return Object.entries(byWeek).map(([week, data]) => ({ week, ...data }));
}

export function demoGetStreamsByMonth(monthsBack = 12, filter?: TimeRangeFilter) {
  const defaultSince = subMonths(new Date(), monthsBack);
  const pred = resolveDateWhere(filter, defaultSince);
  const streams = getDemoStreams().filter(pred).sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  const byMonth: Record<string, { streams: number; minutes: number }> = {};
  for (const s of streams) {
    const monthKey = format(startOfMonth(s.playedAt), "yyyy-MM");
    if (!byMonth[monthKey]) byMonth[monthKey] = { streams: 0, minutes: 0 };
    byMonth[monthKey].streams++;
    byMonth[monthKey].minutes += Math.round(s.durationMs / 60000);
  }
  return Object.entries(byMonth).map(([month, data]) => ({ month, ...data }));
}

export function demoGetStreamsByDay(filter?: TimeRangeFilter) {
  const tz = getStatsTimeZone();
  const defaultSince = subDays(new Date(), 90);
  const pred = resolveDateWhere(filter, defaultSince);
  const streams = getDemoStreams().filter(pred).sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  const byDay: Record<string, { streams: number; minutes: number }> = {};
  for (const s of streams) {
    const day = formatCalendarDateInZone(s.playedAt, tz);
    if (!byDay[day]) byDay[day] = { streams: 0, minutes: 0 };
    byDay[day].streams++;
    byDay[day].minutes += Math.round(s.durationMs / 60000);
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, data]) => ({ label, ...data }));
}

export function demoGetListeningSpan(filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  if (streams.length === 0) return null;
  let first = streams[0].playedAt;
  let last = streams[0].playedAt;
  for (const s of streams) {
    if (s.playedAt < first) first = s.playedAt;
    if (s.playedAt > last) last = s.playedAt;
  }
  return { first, last };
}

export function demoGetListeningDiversity(filter?: TimeRangeFilter) {
  const streams = filterByRange(getDemoStreams(), filter);
  const tracks = new Set(streams.map((s) => s.trackId));
  const artists = new Set(streams.map((s) => s.artistName));
  return { uniqueTracks: tracks.size, uniqueArtists: artists.size };
}

export function demoGetLatestPlayAt(): Date | null {
  const streams = getDemoStreams();
  if (streams.length === 0) return null;
  return streams.reduce((a, s) => (s.playedAt > a ? s.playedAt : a), streams[0].playedAt);
}
