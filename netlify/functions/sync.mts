import type { Config } from "@netlify/functions";

export default async function handler() {
  const baseUrl = process.env.URL ?? "http://localhost:3000";
  const results: Record<string, unknown> = {};

  const spotifyRes = await fetch(`${baseUrl}/api/sync`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  results.spotify = await spotifyRes.json();

  if (process.env.LASTFM_API_KEY && process.env.LASTFM_USER) {
    const lastfmRes = await fetch(`${baseUrl}/api/sync-lastfm`, { method: "POST" });
    results.lastfm = await lastfmRes.json();
  }

  console.log("Sync results:", results);
  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  schedule: "0 * * * *",
};
