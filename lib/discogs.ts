import { safeJson } from "@/lib/safe-json";

const USER_AGENT = "Soundfolio/1.0 (+https://github.com/olivertransf/Soundfolio)";

export async function getArtistArtFromDiscogs(artistName: string): Promise<string | null> {
  if (!artistName?.trim()) return null;
  const searchRes = await fetch(
    `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName.trim())}&type=artist&per_page=5`,
    { headers: { "User-Agent": USER_AGENT } }
  );
  if (!searchRes.ok) return null;
  const searchData = (await safeJson(searchRes)) as {
    results?: { id?: number; type?: string }[];
  } | null;
  if (!searchData) return null;
  const first = searchData.results?.[0];
  if (!first?.id || first.type !== "artist") return null;

  const artistRes = await fetch(`https://api.discogs.com/artists/${first.id}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!artistRes.ok) return null;
  const artistData = (await safeJson(artistRes)) as {
    images?: { uri?: string; resource_url?: string }[];
  } | null;
  if (!artistData) return null;
  const img = artistData.images?.[0];
  return img?.uri ?? img?.resource_url ?? null;
}
