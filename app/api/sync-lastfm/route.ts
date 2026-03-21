import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRecentTracks } from "@/lib/lastfm";

export const maxDuration = 30;

export async function POST() {
  const username = process.env.LASTFM_USER?.trim();
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!username || !apiKey) {
    // 200 (not 400): SyncOnLoad POSTs on every page load; missing env is expected until configured.
    const detail =
      !apiKey && !username
        ? "Set LASTFM_USER and LASTFM_API_KEY in .env"
        : !apiKey
          ? "Set LASTFM_API_KEY in .env"
          : "Set LASTFM_USER in .env (your Last.fm profile name, e.g. the name in last.fm/user/yourname)";
    return NextResponse.json({
      synced: 0,
      skipped: true,
      message: "Last.fm not configured",
      detail,
    });
  }

  try {
    const latest = await db.stream.findFirst({
      orderBy: { playedAt: "desc" },
      select: { playedAt: true },
    });

    const fromTimestamp = latest?.playedAt
      ? Math.floor(latest.playedAt.getTime() / 1000)
      : undefined;

    const tracks = await getRecentTracks(username, 50, fromTimestamp);

    if (tracks.length === 0) {
      return NextResponse.json({ synced: 0, message: "No new scrobbles" });
    }

    const result = await db.stream.createMany({
      data: tracks.map((t) => ({
        trackId: `lfm-${t.playedAt.getTime()}`,
        trackName: t.name,
        artistName: t.artist,
        artistArt: null,
        albumName: t.album,
        albumArt: t.image,
        durationMs: 180000,
        playedAt: t.playedAt,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      synced: result.count,
      fetched: tracks.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("Last.fm sync error:", err);
    return NextResponse.json({ error: "Sync failed", detail: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
