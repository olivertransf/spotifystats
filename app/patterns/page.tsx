import { Suspense } from "react";
import {
  getStreamsByHour,
  getStreamsByDayOfWeek,
  getListeningHeatmap,
  parseTimeRange,
} from "@/lib/stats";
import { TimeRangeTabs } from "@/components/time-range-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListeningChart } from "@/components/listening-chart";
import { ListeningHeatmap } from "@/components/listening-heatmap";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const filter = parseTimeRange(params.range, params.from, params.to);

  const [byHour, byDay, heatmap] = await Promise.all([
    getStreamsByHour(filter),
    getStreamsByDayOfWeek(filter),
    getListeningHeatmap(filter),
  ]);

  const hourChartData = byHour.map((h) => ({
    label: h.label,
    minutes: h.minutes,
    streams: h.streams,
  }));

  const dayChartData = byDay.map((d) => ({
    label: d.label,
    minutes: d.minutes,
    streams: d.streams,
  }));

  const peakHour =
    byHour.length > 0
      ? byHour.reduce((a, b) => (a.minutes >= b.minutes ? a : b))
      : null;
  const peakDay =
    byDay.length > 0
      ? byDay.reduce((a, b) => (a.minutes >= b.minutes ? a : b))
      : null;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Listening patterns"
        description="Rhythm of your listening: time of day, day of week, and a full week×hour heatmap."
        periodLabel={filter.label}
      >
        <Suspense>
          <TimeRangeTabs />
        </Suspense>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Busiest hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {peakHour ? peakHour.label : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {peakHour
                ? `${peakHour.minutes.toLocaleString()} min · ${peakHour.streams.toLocaleString()} streams`
                : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Busiest weekday
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{peakDay ? peakDay.label : "—"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {peakDay
                ? `${peakDay.minutes.toLocaleString()} min · ${peakDay.streams.toLocaleString()} streams`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/80 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">By hour of day</CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Total minutes and streams for each clock hour (local time).
            </p>
          </CardHeader>
          <CardContent>
            <ListeningChart
              data={hourChartData}
              xAxis="hour"
              metric="both"
              height={280}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">By day of week</CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              How listening stacks across weekdays.
            </p>
          </CardHeader>
          <CardContent>
            <ListeningChart
              data={dayChartData}
              xAxis="weekday"
              metric="both"
              height={280}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Week × hour heatmap</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Where your plays cluster — hover a cell for counts.
          </p>
        </CardHeader>
        <CardContent>
          <ListeningHeatmap grid={heatmap.grid} dayNames={heatmap.dayNames} />
        </CardContent>
      </Card>
    </div>
  );
}
