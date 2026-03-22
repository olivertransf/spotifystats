import { Card, CardContent } from "@/components/ui/card";
import { AlbumArt } from "@/components/album-art";
import { LocalDateTime } from "@/components/local-datetime";
import { PageHeader } from "@/components/page-header";
import { getRecentStreams } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function DemoRecentPage() {
  const streams = await getRecentStreams(100, "demo");

  return (
    <div className="space-y-10">
      <PageHeader
        title="Recent plays"
        description={`Last ${streams.length} tracks in the demo dataset.`}
      />

      <Card className="border-border/50 bg-card/60 ring-1 ring-border/40">
        <CardContent className="pt-6">
          {streams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No demo streams yet. Run <code className="rounded bg-secondary px-1 text-xs">npm run db:seed-demo</code>.
            </p>
          ) : (
            <div className="space-y-1">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className="group flex flex-col gap-1.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <AlbumArt
                      src={stream.albumArt}
                      alt={stream.albumName}
                      width={40}
                      height={40}
                      className="shrink-0 rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{stream.trackName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {stream.artistName} · {stream.albumName}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end text-xs tabular-nums text-muted-foreground sm:text-right">
                    <p>
                      <LocalDateTime date={stream.playedAt} pattern="MMM d, yyyy" />
                    </p>
                    <p>
                      <LocalDateTime date={stream.playedAt} pattern="h:mm a" />
                    </p>
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
