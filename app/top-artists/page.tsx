import { Suspense } from "react";
import { getTopArtists, parseTimeRange } from "@/lib/stats";
import { TimeRangeTabs } from "@/components/time-range-tabs";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TopArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const filter = parseTimeRange(params.range, params.from, params.to);
  const artists = await getTopArtists(50, filter);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Top artists"
        description="Ranked by stream count for the selected period."
        periodLabel={filter.label}
      >
        <Suspense>
          <TimeRangeTabs />
        </Suspense>
      </PageHeader>

      <Card className="border-border/80">
        <CardContent className="pt-6">
          {artists.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data for this time range.</p>
          ) : (
            <div className="space-y-1">
              {artists.map((artist, i) => (
                <div
                  key={artist.artistName}
                  className="flex items-center gap-4 px-2 py-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground w-7 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-sm font-bold">
                      {artist.artistName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{artist.artistName}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Headphones className="h-3.5 w-3.5" />
                      {artist.streams.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 w-24 text-right justify-end">
                      <Clock className="h-3.5 w-3.5" />
                      {artist.minutesListened.toLocaleString()} min
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
