import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, sub, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-none ring-1 ring-border/40 transition-colors hover:ring-border/70">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="font-display mt-1.5 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {value}
            </p>
            {sub ? (
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            ) : null}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
