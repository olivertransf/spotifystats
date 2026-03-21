import { safeJson } from "@/lib/safe-json";

export async function getAlbumArtFromItunes(
  artistName: string,
  albumName: string
): Promise<string | null> {
  if (!artistName?.trim() || !albumName?.trim()) return null;
  const term = `${artistName.trim()} ${albumName.trim()}`;
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=album&limit=3`
  );
  if (!res.ok) return null;
  const data = (await safeJson(res)) as {
    results?: {
      artistName?: string;
      collectionName?: string;
      artworkUrl600?: string;
      artworkUrl100?: string;
      artworkUrl60?: string;
    }[];
  } | null;
  if (!data) return null;
  const results = data.results ?? [];
  const artistLower = artistName.trim().toLowerCase();
  const albumLower = albumName.trim().toLowerCase();
  const match = results.find(
    (r) =>
      r.artistName?.toLowerCase().includes(artistLower) &&
      r.collectionName?.toLowerCase().includes(albumLower)
  ) ?? results[0];
  if (!match) return null;
  return (
    match.artworkUrl600 ??
    match.artworkUrl100 ??
    match.artworkUrl60 ??
    null
  );
}
