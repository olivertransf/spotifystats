import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTracks } from "@/lib/spotify";

export const maxDuration = 60;

export async function POST() {
  try {
  const missing = await db.stream.groupBy({
    by: ["trackId"],
    where: { albumArt: null },
  });

  const SPOTIFY_ID_REGEX = /^[a-zA-Z0-9]{22}$/;
  const spotifyIds = missing
    .map((m) => m.trackId)
    .filter((id) => !id.startsWith("lfm-") && SPOTIFY_ID_REGEX.test(id));
  if (spotifyIds.length === 0) {
    return NextResponse.json({ updated: 0, total: 0, remaining: 0, message: "No Spotify tracks missing artwork (Last.fm tracks are skipped)" });
  }

  const MAX_PER_RUN = 500;
  const idsToProcess = spotifyIds.slice(0, MAX_PER_RUN);
  const remaining = spotifyIds.length - idsToProcess.length;

  let updated = 0;
  const BATCH_SIZE = 50;
  const DELAY_MS = 150;

  for (let i = 0; i < idsToProcess.length; i += BATCH_SIZE) {
    const batch = idsToProcess.slice(i, i + BATCH_SIZE);
    const tracks = await getTracks(batch);

    for (const t of tracks) {
      if (t.albumArt) {
        const result = await db.stream.updateMany({
          where: { trackId: t.id, albumArt: null },
          data: { albumArt: t.albumArt },
        });
        updated += result.count;
      }
    }

    if (i + BATCH_SIZE < idsToProcess.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return NextResponse.json({ updated, total: idsToProcess.length, remaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill failed";
    console.error("Backfill error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
