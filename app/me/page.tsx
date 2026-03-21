import { Suspense } from "react";
import {
  Clock,
  Headphones,
  Music,
  Disc3,
  Users,
  CalendarDays,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListeningActivity } from "@/components/listening-activity";
import { PageHeader } from "@/components/page-header";
import {
  getTotalStats,
  getTopTracks,
  getTopArtists,
  getLatestPlayAt,
  parseTimeRange,
  getListeningDiversity,
  getListeningSpan,
  calendarDaysInFilter,
} from "@/lib/stats";
import { formatDistanceToNow } from "date-fns";
import { AlbumArt } from "@/components/album-art";
import { ArtistArt } from "@/components/artist-art";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const filter = parseTimeRange(params.range, params.from, params.to);

  const [
    stats,
    topTracks,
    topArtists,
    latestPlayAt,
    diversity,
    span,
  ] = await Promise.all([
    getTotalStats(filter),
    getTopTracks(5, filter),
    getTopArtists(5, filter),
    getLatestPlayAt(),
    getListeningDiversity(filter),
    getListeningSpan(filter),
  ]);

  const days = calendarDaysInFilter(filter, span);
  const avgMinPerDay = Math.round(stats.totalMinutes / days);
  const avgStreamsPerDay = Math.round(stats.totalStreams / days);

  const hasData = stats.totalStreams > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">No data yet</h1>
        <p className="text-muted-foreground max-w-sm">
          Import your Spotify data export to see your full listening history and stats.
        </p>
        <a
          href="/me/import"
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Import Data
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Overview"
        description="Listening volume, diversity, and trends for the selected period. Charts default to year-to-date; change the range to compare."
        periodLabel={filter.label}
      />

      {latestPlayAt && (
        <p className="text-muted-foreground text-xs -mt-4">
          Latest play {formatDistanceToNow(latestPlayAt, { addSuffix: true })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total minutes"
          value={stats.totalMinutes.toLocaleString()}
          sub={`${stats.totalHours.toLocaleString()} h total`}
          icon={Clock}
        />
        <StatCard
          label="Total streams"
          value={stats.totalStreams.toLocaleString()}
          icon={Headphones}
        />
        <StatCard
          label="Unique tracks"
          value={diversity.uniqueTracks.toLocaleString()}
          sub="Distinct songs played"
          icon={Disc3}
        />
        <StatCard
          label="Unique artists"
          value={diversity.uniqueArtists.toLocaleString()}
          sub="Distinct artists"
          icon={Users}
        />
        <StatCard
          label="Avg min / day"
          value={avgMinPerDay.toLocaleString()}
          sub={`~${days.toLocaleString()} day window`}
          icon={CalendarDays}
        />
        <StatCard
          label="Avg streams / day"
          value={avgStreamsPerDay.toLocaleString()}
          icon={Activity}
        />
      </div>

      <Suspense
        fallback={
          <Card className="border-border/50 bg-card/60 ring-1 ring-border/40">
            <CardContent className="h-[360px] flex items-center justify-center text-muted-foreground text-sm">
              Loading chart…
            </CardContent>
          </Card>
        }
      >
        <ListeningActivity periodLabel={filter.label} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/60 ring-1 ring-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top tracks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topTracks.map((track, i) => (
              <div
                key={track.trackId}
                className="flex items-center gap-3 py-1.5 rounded-md hover:bg-secondary/40 px-1 -mx-1 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-5 shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <AlbumArt
                  src={track.albumArt}
                  alt={track.albumName}
                  width={40}
                  height={40}
                  className="rounded-md shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.trackName}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {track.streams} plays
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 ring-1 ring-border/40">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top artists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topArtists.map((artist, i) => (
              <div
                key={artist.artistName}
                className="flex items-center gap-3 py-1.5 rounded-md hover:bg-secondary/40 px-1 -mx-1 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-5 shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <ArtistArt
                  src={artist.artistArt}
                  alt={artist.artistName}
                  width={36}
                  height={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{artist.artistName}</p>
                  <p className="text-xs text-muted-foreground">
                    {artist.minutesListened.toLocaleString()} min
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {artist.streams.toLocaleString()} plays
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
