"use client";

import { useEffect, useRef } from "react";

/**
 * On each full document load: Last.fm sync + one batch each of album-art and artist-image backfills.
 * Batches are capped per request; large libraries need repeated refreshes, Import page backfill, or CLI scripts.
 * See README: "Backfill: album and artist images".
 */
export function SyncOnLoad() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = () => {
      void fetch("/api/sync-lastfm", { method: "POST" }).catch(() => {});
      void fetch("/api/backfill-artists", { method: "POST" }).catch(() => {});
      void fetch("/api/backfill-art", { method: "POST" }).catch(() => {});
    };

    run();
  }, []);

  return null;
}
