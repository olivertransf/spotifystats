import { safeJson } from "@/lib/safe-json";

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
  const text = await res.text();
  let data: LastFmResponse;
  try {
    data = JSON.parse(text) as LastFmResponse;
  } catch {
    throw new Error(
      `Last.fm returned non-JSON (HTTP ${res.status}). Check network or API status.`
    );
  }

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

export async function getTrackArt(artist: string, track: string): Promise<string | null> {
  if (!API_KEY) return null;
  const params = new URLSearchParams({
    method: "track.getInfo",
    artist,
    track,
    api_key: API_KEY,
    format: "json",
  });
  const res = await fetch(`${BASE}?${params}`);
  const data = (await safeJson(res)) as {
    error?: number;
    track?: { album?: { image?: { size?: string; "#text"?: string }[] } };
  } | null;
  if (!data || data.error) return null;
  const album = data.track?.album;
  const imgs = Array.isArray(album?.image) ? album.image : [];
  const img =
    imgs.find((i) => i?.size === "extralarge" || i?.size === "large") ?? imgs[imgs.length - 1];
  const url = img?.["#text"];
  if (!url || url.length === 0 || isPlaceholderUrl(url)) return null;
  return url;
}

const PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

function isPlaceholderUrl(url: string): boolean {
  return url.includes(PLACEHOLDER_HASH);
}

export async function getArtistArt(artist: string): Promise<string | null> {
  if (!API_KEY) return null;
  const params = new URLSearchParams({
    method: "artist.getInfo",
    artist,
    api_key: API_KEY,
    format: "json",
  });
  const res = await fetch(`${BASE}?${params}`);
  const data = (await safeJson(res)) as {
    error?: number;
    artist?: { image?: { size?: string; "#text"?: string }[] };
  } | null;
  if (!data || data.error) return null;
  const imgs = Array.isArray(data.artist?.image) ? data.artist.image : [];
  const img =
    imgs.find((i) => i?.size === "extralarge" || i?.size === "large") ?? imgs[imgs.length - 1];
  const url = img?.["#text"];
  if (!url || url.length === 0 || isPlaceholderUrl(url)) return null;
  return url;
}
