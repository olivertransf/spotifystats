"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListeningChart } from "@/components/listening-chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "weeks" | "months";

interface ChartPoint {
  label: string;
  minutes: number;
  streams: number;
}

export default function HistoryPage() {
  const [mode, setMode] = useState<Mode>("months");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/history?mode=${mode}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data ?? []);
        setLoading(false);
      });
  }, [mode]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Listening History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Minutes listened over time
          </p>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="weeks" className="text-xs">By Week</TabsTrigger>
            <TabsTrigger value="months" className="text-xs">By Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "months" ? "Last 12 months" : "Last 26 weeks"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No data yet. Import your Spotify history first.
            </div>
          ) : (
            <ListeningChart data={data} mode={mode} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
