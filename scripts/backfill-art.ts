/**
 * Backfill album art for streams missing artwork.
 * Tries Spotify first; on 403, falls back to Last.fm.
 * Uses local .env (DATABASE_URL, SPOTIFY_*, LASTFM_API_KEY).
 *
 * Usage: npx tsx scripts/backfill-art.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { getTracks } from "../lib/spotify";
import { getTrackArt } from "../lib/lastfm";

const MAX_PER_RUN = 500;
const BATCH_SIZE = 50;
const DELAY_MS = 150;
const LASTFM_DELAY_MS = 300;
const SPOTIFY_ID_REGEX = /^[a-zA-Z0-9]{22}$/;

async function main() {
  const missing = await db.stream.groupBy({
    by: ["trackId", "trackName", "artistName"],
    where: { albumArt: null },
  });

  const spotifyTracks = missing.filter(
    (m) => !m.trackId.startsWith("lfm-") && SPOTIFY_ID_REGEX.test(m.trackId)
  );

  if (spotifyTracks.length === 0) {
    console.log("No Spotify tracks missing artwork (Last.fm tracks are skipped)");
    process.exit(0);
  }

  const toProcess = spotifyTracks.slice(0, MAX_PER_RUN);
  const remaining = spotifyTracks.length - toProcess.length;
  let updated = 0;
  let usedLastFm = false;

  console.log(`Processing ${toProcess.length} tracks (${remaining} remaining)...`);

  try {
    const ids = toProcess.map((t) => t.trackId);
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
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
      if (i + BATCH_SIZE < ids.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
  } catch (err) {
    const is403 = err instanceof Error && err.message.includes("403");
    if (!is403) throw err;
    if (!process.env.LASTFM_API_KEY) {
      throw new Error("Spotify returned 403. Add LASTFM_API_KEY to .env to use Last.fm fallback.");
    }
    usedLastFm = true;
    console.log("Spotify returned 403, falling back to Last.fm...");
    for (const m of toProcess) {
      const art = await getTrackArt(m.artistName, m.trackName);
      if (art) {
        const result = await db.stream.updateMany({
          where: { trackId: m.trackId, albumArt: null },
          data: { albumArt: art },
        });
        updated += result.count;
      }
      await new Promise((r) => setTimeout(r, LASTFM_DELAY_MS));
    }
  }

  console.log(`Updated ${updated} streams via ${usedLastFm ? "Last.fm" : "Spotify"}. ${remaining} remaining.`);
}

main().catch((err) => {
  console.error("Backfill error:", err);
  process.exit(1);
});
