/**
 * Clears Last.fm placeholder (white star) URLs from the database.
 * Run after backfill to remove bad images so the letter fallback shows.
 *
 * Usage: npx tsx scripts/clear-placeholder-art.ts
 */

import "dotenv/config";
import { db } from "../lib/db";

const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

async function main() {
  const artistResult = await db.stream.updateMany({
    where: { artistArt: { contains: PLACEHOLDER_HASH } },
    data: { artistArt: null },
  });
  const albumResult = await db.stream.updateMany({
    where: { albumArt: { contains: PLACEHOLDER_HASH } },
    data: { albumArt: null },
  });
  console.log(`Cleared ${artistResult.count} artist placeholders, ${albumResult.count} album placeholders.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
