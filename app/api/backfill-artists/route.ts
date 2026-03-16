import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getArtistArt } from "@/lib/lastfm";

export const maxDuration = 60;

const MAX_PER_RUN = 100;
const DELAY_MS = 300;

export async function POST() {
  try {
    if (!process.env.LASTFM_API_KEY) {
      return NextResponse.json(
        { error: "LASTFM_API_KEY not configured" },
        { status: 500 }
      );
    }

    const missing = await db.stream.groupBy({
      by: ["artistName"],
      where: { artistArt: null },
    });

    if (missing.length === 0) {
      return NextResponse.json({
        updated: 0,
        total: 0,
        remaining: 0,
        message: "No artists missing artwork",
      });
    }

    const toProcess = missing.slice(0, MAX_PER_RUN);
    const remaining = missing.length - toProcess.length;
    let updated = 0;

    for (const m of toProcess) {
      const art = await getArtistArt(m.artistName);
      if (art) {
        const result = await db.stream.updateMany({
          where: { artistName: m.artistName, artistArt: null },
          data: { artistArt: art },
        });
        updated += result.count;
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    return NextResponse.json({
      updated,
      total: toProcess.length,
      remaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backfill failed";
    console.error("Backfill artists error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
