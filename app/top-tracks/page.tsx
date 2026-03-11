import { Suspense } from "react";
import { getTopTracks, getTimeRangeDate } from "@/lib/stats";
import { TimeRangeTabs } from "@/components/time-range-tabs";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Clock, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

type Range = "4w" | "6m" | "1y" | "all";

export default async function TopTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "all" } = await searchParams;
  const since = getTimeRangeDate(range as Range);
  const tracks = await getTopTracks(50, since);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Top Tracks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ranked by stream count
          </p>
        </div>
        <Suspense>
          <TimeRangeTabs />
        </Suspense>
      </div>

      <Card>
        <CardContent className="pt-6">
          {tracks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data for this time range.</p>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, i) => (
                <div
                  key={`${track.trackId}-${i}`}
                  className="flex items-center gap-4 px-2 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground w-7 text-right shrink-0">
                    {i + 1}
                  </span>
                  {track.albumArt ? (
                    <Image
                      src={track.albumArt}
                      alt={track.albumName}
                      width={44}
                      height={44}
                      className="rounded shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.trackName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artistName} · {track.albumName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Headphones className="h-3.5 w-3.5" />
                      {track.streams.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 w-24 text-right justify-end">
                      <Clock className="h-3.5 w-3.5" />
                      {track.minutesListened.toLocaleString()} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
