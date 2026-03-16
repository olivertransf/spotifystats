/**
 * Backfill artist images for streams missing artwork.
 * Uses Last.fm artist.getInfo. Requires LASTFM_API_KEY in .env.
 *
 * Usage: npx tsx scripts/backfill-artists.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { getArtistArt } from "../lib/lastfm";

const MAX_PER_RUN = 100;
const DELAY_MS = 300;

async function main() {
  if (!process.env.LASTFM_API_KEY) {
    console.error("Set LASTFM_API_KEY in .env");
    process.exit(1);
  }

  const missing = await db.stream.groupBy({
    by: ["artistName"],
    where: { artistArt: null },
  });

  if (missing.length === 0) {
    console.log("No artists missing artwork");
    process.exit(0);
  }

  const toProcess = missing.slice(0, MAX_PER_RUN);
  const remaining = missing.length - toProcess.length;
  let updated = 0;

  console.log(`Processing ${toProcess.length} artists (${remaining} remaining)...`);

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

  console.log(`Updated ${updated} streams across ${toProcess.length} artists. ${remaining} remaining.`);
}

main().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});
