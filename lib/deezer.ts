import { safeJson } from "@/lib/safe-json";

export async function getArtistArtFromDeezer(artistName: string): Promise<string | null> {
  if (!artistName?.trim()) return null;
  const res = await fetch(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName.trim())}&limit=1`
  );
  if (!res.ok) return null;
  const data = (await safeJson(res)) as { data?: { picture_medium?: string; picture_big?: string; picture?: string }[] } | null;
  if (!data) return null;
  const artist = data.data?.[0];
  return artist?.picture_medium ?? artist?.picture_big ?? artist?.picture ?? null;
}
