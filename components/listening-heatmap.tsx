"use client";

interface HeatmapProps {
  grid: { day: number; hour: number; count: number }[];
  dayNames: string[];
}

export function ListeningHeatmap({ grid, dayNames }: HeatmapProps) {
  const maxCount = Math.max(...grid.map((g) => g.count), 1);
  const totalStreams = grid.reduce((s, g) => s + g.count, 0);

  const cellStyle = (count: number): { className: string; opacity: number } => {
    if (count === 0) return { className: "bg-secondary", opacity: 1 };
    const t = Math.min(1, count / maxCount);
    return { className: "bg-primary", opacity: 0.2 + t * 0.85 };
  };

  const byDayHour: Record<string, number> = {};
  for (const g of grid) {
    byDayHour[`${g.day}-${g.hour}`] = g.count;
  }

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      <p className="text-xs text-muted-foreground">
        {totalStreams.toLocaleString()} streams in view · peak cell{" "}
        {maxCount.toLocaleString()} plays
      </p>
      <div className="overflow-x-auto max-w-full rounded-xl border border-border/80 bg-card/50 p-3 shadow-inner overscroll-x-contain">
        <div className="min-w-[720px] space-y-1">
          <div className="flex gap-1 text-[10px] text-muted-foreground pl-14">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="w-5 flex-1 text-center font-medium">
                {h % 3 === 0 ? `${h}` : ""}
              </div>
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <div key={day} className="flex items-center gap-1.5">
              <span className="w-12 text-xs text-muted-foreground shrink-0 font-medium">
                {dayNames[day]}
              </span>
              <div className="flex gap-px flex-1 rounded-md overflow-hidden bg-border/60 p-px">
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = byDayHour[`${day}-${hour}`] ?? 0;
                  const st = cellStyle(count);
                  return (
                    <div
                      key={hour}
                      className={`min-w-0 flex-1 h-7 rounded-[2px] transition-opacity hover:ring-1 hover:ring-primary/50 ${st.className}`}
                      style={{ opacity: st.opacity }}
                      title={`${dayNames[day]} · ${hour}:00–${hour}:59 — ${count.toLocaleString()} streams`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground">
        <span>Hour of day (0–23)</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-0.5 rounded border border-border/60 p-0.5 bg-secondary/40">
            {[0, 0.35, 0.55, 0.75, 1].map((op, i) => (
              <div
                key={i}
                className="w-5 h-4 rounded-sm bg-primary"
                style={{ opacity: 0.15 + op * 0.85 }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
