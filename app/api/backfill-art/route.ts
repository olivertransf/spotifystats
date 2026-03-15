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

  const trackIds = missing.map((m) => m.trackId);
  if (trackIds.length === 0) {
    return NextResponse.json({ updated: 0, total: 0, remaining: 0, message: "No tracks missing artwork" });
  }

  const MAX_PER_RUN = 500;
  const idsToProcess = trackIds.slice(0, MAX_PER_RUN);
  const remaining = trackIds.length - idsToProcess.length;

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
    const isAuth = message.toLowerCase().includes("token") || message.toLowerCase().includes("401") || message.toLowerCase().includes("403");
    console.error("Backfill error:", err);
    return NextResponse.json(
      { error: isAuth ? "Spotify token invalid or expired. Run `npm run get-token` to get a new one." : message },
      { status: 500 }
    );
  }
}
