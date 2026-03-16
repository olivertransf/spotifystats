import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRecentTracks } from "@/lib/lastfm";

export const maxDuration = 30;

export async function POST() {
  const username = process.env.LASTFM_USER;
  if (!username || !process.env.LASTFM_API_KEY) {
    return NextResponse.json(
      { error: "Missing LASTFM_USER or LASTFM_API_KEY in environment" },
      { status: 500 }
    );
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
