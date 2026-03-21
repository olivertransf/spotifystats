import { safeJson } from "@/lib/safe-json";

const USER_AGENT = "Soundfolio/1.0 (+https://github.com/olivertransf/Soundfolio)";

export async function getAlbumArtFromCoverArtArchive(
  artistName: string,
  albumName: string
): Promise<string | null> {
  if (!artistName?.trim() || !albumName?.trim()) return null;
  const query = `artist:${artistName.trim()} AND release:${albumName.trim()}`;
  const searchRes = await fetch(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`,
    { headers: { "User-Agent": USER_AGENT } }
  );
  if (!searchRes.ok) return null;
  const searchData = (await safeJson(searchRes)) as { releases?: { id?: string; title?: string }[] } | null;
  if (!searchData) return null;
  const releases = searchData.releases ?? [];
  const albumLower = albumName.trim().toLowerCase();
  const release =
    releases.find((r: { title?: string }) =>
      r.title?.toLowerCase() === albumLower
    ) ??
    releases.find((r: { title?: string }) =>
      r.title?.toLowerCase().includes(albumLower)
    ) ??
    releases[0];
  if (!release?.id) return null;

  const caaRes = await fetch(
    `https://coverartarchive.org/release/${release.id}`,
    { headers: { Accept: "application/json" } }
  );
  if (!caaRes.ok) return null;
  const caaData = (await safeJson(caaRes)) as {
    images?: { front?: boolean; thumbnails?: Record<string, string>; image?: string }[];
  } | null;
  if (!caaData) return null;
  const front = caaData.images?.find((img: { front?: boolean }) => img.front);
  if (!front) return null;
  return (
    front.thumbnails?.["500"] ??
    front.thumbnails?.["250"] ??
    front.image ??
    null
  );
}
