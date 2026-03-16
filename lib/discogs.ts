const USER_AGENT = "SpotifyStats/1.0 +https://github.com/olivertransf/spotifystats";

export async function getArtistArtFromDiscogs(artistName: string): Promise<string | null> {
  if (!artistName?.trim()) return null;
  const searchRes = await fetch(
    `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName.trim())}&type=artist&per_page=5`,
    { headers: { "User-Agent": USER_AGENT } }
  );
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const first = searchData.results?.[0];
  if (!first?.id || first.type !== "artist") return null;

  const artistRes = await fetch(`https://api.discogs.com/artists/${first.id}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!artistRes.ok) return null;
  const artistData = await artistRes.json();
  const img = artistData.images?.[0];
  return img?.uri ?? img?.resource_url ?? null;
}
