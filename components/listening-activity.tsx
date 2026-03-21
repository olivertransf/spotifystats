"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListeningChart, type ChartXAxis } from "@/components/listening-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupBySelect } from "@/components/group-by-select";
import { TimeRangeTabs } from "@/components/time-range-tabs";

interface Point {
  label: string;
  minutes: number;
  streams: number;
}

const granularityConfig: Record<
  "months" | "weeks" | "days",
  { apiMode: string; title: string; xAxis: ChartXAxis }
> = {
  months: { apiMode: "months", title: "Monthly", xAxis: "month" },
  weeks: { apiMode: "weeks", title: "Weekly", xAxis: "week" },
  days: { apiMode: "days", title: "Daily", xAxis: "day" },
};

export function ListeningActivity({
  periodLabel,
}: {
  periodLabel: string;
}) {
  const searchParams = useSearchParams();
  const [granularity, setGranularity] = useState<"months" | "weeks" | "days">(
    "weeks"
  );
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  const range = searchParams.get("range") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      mode: granularityConfig[granularity].apiMode,
    });
    if (range) params.set("range", range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/stats/history?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [granularity, range, from, to]);

  const cfg = granularityConfig[granularity];

  const filterRow = (
    <div className="grid w-full gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="min-w-0 space-y-1.5 overflow-visible">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Period
        </p>
        <TimeRangeTabs />
      </div>
      <div className="min-w-0 space-y-1.5 overflow-visible">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Group by
        </p>
        <GroupBySelect value={granularity} onValueChange={setGranularity} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {filterRow}

      <Card className="overflow-hidden border-border/50 bg-card/60 ring-1 ring-border/40 shadow-none">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Minutes listened · {cfg.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {periodLabel}. Use the streams line toggle to compare play counts.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex h-[280px] items-center justify-center rounded-xl bg-secondary/20 text-sm text-muted-foreground">
              Loading chart…
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center rounded-xl bg-secondary/20 text-sm text-muted-foreground">
              No plays in this period.
            </div>
          ) : (
            <ListeningChart
              data={data}
              xAxis={cfg.xAxis}
              metric="minutes"
              height={300}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
