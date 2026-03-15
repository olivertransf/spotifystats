"use client";

interface HeatmapProps {
  grid: { day: number; hour: number; count: number }[];
  dayNames: string[];
}

export function ListeningHeatmap({ grid, dayNames }: HeatmapProps) {
  const maxCount = Math.max(...grid.map((g) => g.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-secondary";
    const intensity = Math.min(1, count / maxCount);
    if (intensity < 0.25) return "bg-primary/25";
    if (intensity < 0.5) return "bg-primary/50";
    if (intensity < 0.75) return "bg-primary/75";
    return "bg-primary";
  };

  const byDayHour: Record<string, number> = {};
  for (const g of grid) {
    byDayHour[`${g.day}-${g.hour}`] = g.count;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] space-y-1">
        <div className="flex gap-1 text-[10px] text-muted-foreground pl-12">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="w-4 text-center truncate">
              {h % 4 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <div key={day} className="flex items-center gap-1">
            <span className="w-10 text-xs text-muted-foreground shrink-0">
              {dayNames[day]}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className={`w-4 h-4 rounded-sm ${getColor(byDayHour[`${day}-${hour}`] ?? 0)}`}
                  title={`${dayNames[day]} ${hour}:00 – ${(byDayHour[`${day}-${hour}`] ?? 0)} streams`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {["bg-secondary", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"].map((c, i) => (
            <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
