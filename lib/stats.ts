import { db } from "@/lib/db";
import { startOfWeek, startOfMonth, subMonths, subWeeks, format } from "date-fns";

export async function getTotalStats() {
  const result = await db.stream.aggregate({
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

export async function getTopTracks(limit = 20, since?: Date) {
  const where = since ? { playedAt: { gte: since } } : {};

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

export async function getTopArtists(limit = 20, since?: Date) {
  const where = since ? { playedAt: { gte: since } } : {};

  const artists = await db.stream.groupBy({
    by: ["artistName"],
    where,
    _count: { id: true },
    _sum: { durationMs: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return artists.map((a) => ({
    artistName: a.artistName,
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

export async function getStreamsByWeek(weeksBack = 26) {
  const since = subWeeks(new Date(), weeksBack);
  const streams = await db.stream.findMany({
    where: { playedAt: { gte: since } },
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

export async function getStreamsByMonth(monthsBack = 12) {
  const since = subMonths(new Date(), monthsBack);
  const streams = await db.stream.findMany({
    where: { playedAt: { gte: since } },
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

export function getTimeRangeDate(range: "4w" | "6m" | "1y" | "all"): Date | undefined {
  const now = new Date();
  switch (range) {
    case "4w": return subWeeks(now, 4);
    case "6m": return subMonths(now, 6);
    case "1y": return subMonths(now, 12);
    case "all": return undefined;
  }
}
