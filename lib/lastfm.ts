const API_KEY = process.env.LASTFM_API_KEY!;
const BASE = "https://ws.audioscrobbler.com/2.0/";

interface LastFmTrack {
  artist: { "#text": string };
  name: string;
  album?: { "#text": string };
  date?: { uts: string };
  image?: { "#text": string; size: string }[];
}

interface LastFmResponse {
  recenttracks?: {
    track: LastFmTrack | LastFmTrack[];
    "@attr"?: { totalPages: string };
  };
  error?: number;
  message?: string;
}

export async function getRecentTracks(
  username: string,
  limit = 50,
  fromTimestamp?: number
): Promise<{ artist: string; name: string; album: string; playedAt: Date; image: string | null }[]> {
  const params = new URLSearchParams({
    method: "user.getRecentTracks",
    user: username,
    api_key: API_KEY,
    format: "json",
    limit: String(limit),
  });
  if (fromTimestamp) params.set("from", String(fromTimestamp));

  const res = await fetch(`${BASE}?${params}`);
  const data: LastFmResponse = await res.json();

  if (data.error) {
    throw new Error(data.message ?? `Last.fm API error ${data.error}`);
  }

  const raw = data.recenttracks?.track;
  if (!raw) return [];
  const tracks = Array.isArray(raw) ? raw : [raw];

  return tracks
    .filter((t) => t.date?.uts)
    .map((t) => {
      const imgs = Array.isArray(t.image) ? t.image : [];
      const img = imgs.find((i: { size?: string }) => i?.size === "extralarge" || i?.size === "large") ?? imgs[imgs.length - 1];
      const imgUrl = img && typeof img === "object" && "#text" in img ? (img as { "#text": string })["#text"] : null;
      return {
        artist: (t.artist as { "#text"?: string })?.["#text"] ?? "Unknown",
        name: t.name ?? "Unknown",
        album: (t.album as { "#text"?: string })?.["#text"] ?? "",
        playedAt: new Date(parseInt(t.date!.uts, 10) * 1000),
        image: imgUrl && imgUrl.length > 0 ? imgUrl : null,
      };
    });
}
