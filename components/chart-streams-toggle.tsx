"use client";

import { cn } from "@/lib/utils";

export function ChartStreamsToggle({
  checked,
  onCheckedChange,
  label = "Streams line",
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/60 px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          checked ? "justify-end bg-primary/25" : "justify-start bg-secondary/60"
        )}
      >
        <span className="pointer-events-none size-4 rounded-full bg-background shadow-sm ring-1 ring-border/40" />
      </button>
    </div>
  );
}
