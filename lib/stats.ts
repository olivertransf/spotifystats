import { db } from "@/lib/db";
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  subMonths,
  subWeeks,
  subDays,
  format,
  getHours,
  getDay,
} from "date-fns";

export type TimeRangePreset = "30d" | "3m" | "6m" | "1y" | "ytd" | "all";

export interface TimeRangeFilter {
  since?: Date;
  until?: Date;
  label: string;
}

export function parseTimeRange(
  range?: string,
  from?: string,
  to?: string
): TimeRangeFilter {
  const now = new Date();

  if (from && to) {
    const since = new Date(from);
    const until = new Date(to);
    if (!isNaN(since.getTime()) && !isNaN(until.getTime())) {
      return { since, until, label: `${format(since, "MMM d, yyyy")} – ${format(until, "MMM d, yyyy")}` };
    }
  }

  switch (range) {
    case "30d":
      return { since: subDays(now, 30), until: now, label: "Last 30 days" };
    case "3m":
      return { since: subMonths(now, 3), until: now, label: "Last 3 months" };
    case "6m":
      return { since: subMonths(now, 6), until: now, label: "Last 6 months" };
    case "1y":
      return { since: subMonths(now, 12), until: now, label: "Last year" };
    case "ytd":
      return { since: startOfYear(now), until: now, label: "This year" };
    case "all":
    default:
      return { label: "All time" };
  }
}

function buildWhere(filter: TimeRangeFilter) {
  const where: { playedAt?: { gte?: Date; lte?: Date } } = {};
  if (filter.since) where.playedAt = { ...where.playedAt, gte: filter.since };
  if (filter.until) where.playedAt = { ...where.playedAt, lte: filter.until };
  return Object.keys(where).length ? where : {};
}

export async function getTotalStats(filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};

  const result = await db.stream.aggregate({
    where,
    _sum: { durationMs: true },
    _count: { id: true },
  });

  const totalMs = result._sum.durationMs ?? 0;
  return {
    totalStreams: result._count.id,
    totalMinutes: Math.round(totalMs / 60000),
    totalHours: Math.round(totalMs / 3600000),
  };
}

export async function getTopTracks(limit = 20, filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};

  const tracks = await db.stream.groupBy({
    by: ["trackId", "trackName", "artistName", "albumName", "albumArt"],
    where,
    _count: { id: true },
    _sum: { durationMs: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return tracks.map((t) => ({
    trackId: t.trackId,
    trackName: t.trackName,
    artistName: t.artistName,
    albumName: t.albumName,
    albumArt: t.albumArt,
    streams: t._count.id,
    minutesListened: Math.round((t._sum.durationMs ?? 0) / 60000),
  }));
}

export async function getTopArtists(limit = 20, filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};

  const artists = await db.stream.groupBy({
    by: ["artistName"],
    where,
    _count: { id: true },
    _sum: { durationMs: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const names = artists.map((a) => a.artistName);
  const artRows = await db.stream.findMany({
    where: { artistName: { in: names }, artistArt: { not: null } },
    select: { artistName: true, artistArt: true },
    distinct: ["artistName"],
  });
  const artMap = new Map(artRows.map((r) => [r.artistName, r.artistArt]));

  return artists.map((a) => ({
    artistName: a.artistName,
    artistArt: artMap.get(a.artistName) ?? null,
    streams: a._count.id,
    minutesListened: Math.round((a._sum.durationMs ?? 0) / 60000),
  }));
}

export async function getRecentStreams(limit = 50) {
  return db.stream.findMany({
    orderBy: { playedAt: "desc" },
    take: limit,
  });
}

export async function getTopAlbums(limit = 20, filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};

  const albums = await db.stream.groupBy({
    by: ["albumName", "albumArt", "artistName"],
    where,
    _count: { id: true },
    _sum: { durationMs: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return albums.map((a) => ({
    albumName: a.albumName,
    albumArt: a.albumArt,
    artistName: a.artistName,
    streams: a._count.id,
    minutesListened: Math.round((a._sum.durationMs ?? 0) / 60000),
  }));
}

export async function getStreamsByHour(filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};
  const streams = await db.stream.findMany({
    where,
    select: { playedAt: true, durationMs: true },
  });

  const byHour: Record<number, { streams: number; minutes: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { streams: 0, minutes: 0 };

  for (const s of streams) {
    const h = getHours(s.playedAt);
    byHour[h].streams++;
    byHour[h].minutes += Math.round(s.durationMs / 60000);
  }

  return Object.entries(byHour).map(([hour, data]) => ({
    hour: parseInt(hour, 10),
    label: `${hour.toString().padStart(2, "0")}:00`,
    ...data,
  }));
}

export async function getStreamsByDayOfWeek(filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};
  const streams = await db.stream.findMany({
    where,
    select: { playedAt: true, durationMs: true },
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay: Record<number, { streams: number; minutes: number }> = {};
  for (let d = 0; d < 7; d++) byDay[d] = { streams: 0, minutes: 0 };

  for (const s of streams) {
    const d = getDay(s.playedAt);
    byDay[d].streams++;
    byDay[d].minutes += Math.round(s.durationMs / 60000);
  }

  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    day: d,
    label: dayNames[d],
    ...byDay[d],
  }));
}

export async function getListeningHeatmap(filter?: TimeRangeFilter) {
  const where = filter ? buildWhere(filter) : {};
  const streams = await db.stream.findMany({
    where,
    select: { playedAt: true },
  });

  const grid: { day: number; hour: number; count: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const counts: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      counts[`${d}-${h}`] = 0;
    }
  }

  for (const s of streams) {
    const d = getDay(s.playedAt);
    const h = getHours(s.playedAt);
    counts[`${d}-${h}`]++;
  }

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.push({ day: d, hour: h, count: counts[`${d}-${h}`] ?? 0 });
    }
  }

  return { grid, dayNames };
}

export async function getStreamsByWeek(weeksBack = 26, filter?: TimeRangeFilter) {
  const defaultSince = subWeeks(new Date(), weeksBack);
  const where =
    filter && (filter.since || filter.until)
      ? buildWhere(filter)
      : { playedAt: { gte: defaultSince } };
  const streams = await db.stream.findMany({
    where,
    select: { playedAt: true, durationMs: true },
    orderBy: { playedAt: "asc" },
  });

  const byWeek: Record<string, { streams: number; minutes: number }> = {};

  for (const s of streams) {
    const weekStart = format(startOfWeek(s.playedAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!byWeek[weekStart]) byWeek[weekStart] = { streams: 0, minutes: 0 };
    byWeek[weekStart].streams++;
    byWeek[weekStart].minutes += Math.round(s.durationMs / 60000);
  }

  return Object.entries(byWeek).map(([week, data]) => ({ week, ...data }));
}

export async function getStreamsByMonth(monthsBack = 12, filter?: TimeRangeFilter) {
  const defaultSince = subMonths(new Date(), monthsBack);
  const where =
    filter && (filter.since || filter.until)
      ? buildWhere(filter)
      : { playedAt: { gte: defaultSince } };
  const streams = await db.stream.findMany({
    where,
    select: { playedAt: true, durationMs: true },
    orderBy: { playedAt: "asc" },
  });

  const byMonth: Record<string, { streams: number; minutes: number }> = {};

  for (const s of streams) {
    const monthKey = format(startOfMonth(s.playedAt), "yyyy-MM");
    if (!byMonth[monthKey]) byMonth[monthKey] = { streams: 0, minutes: 0 };
    byMonth[monthKey].streams++;
    byMonth[monthKey].minutes += Math.round(s.durationMs / 60000);
  }

  return Object.entries(byMonth).map(([month, data]) => ({ month, ...data }));
}

export async function getActivityHeatmap() {
  const since = subMonths(new Date(), 12);
  const streams = await db.stream.findMany({
    where: { playedAt: { gte: since } },
    select: { playedAt: true },
  });

  const byDay: Record<string, number> = {};
  for (const s of streams) {
    const day = format(s.playedAt, "yyyy-MM-dd");
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  return byDay;
}

export async function getLastSyncedAt(): Promise<Date | null> {
  const latest = await db.stream.findFirst({
    orderBy: { playedAt: "desc" },
    select: { playedAt: true },
  });
  return latest?.playedAt ?? null;
}

