#!/usr/bin/env bash
# Removes the bundled /demo preview and reverts nav, header, root page, next config,
# and listening-activity to /me-only. Run from repo root:
#   bash scripts/remove-demo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "package.json" ]]; then
  echo "Run this script from the Soundfolio repo root (package.json not found)." >&2
  exit 1
fi

echo "Removing demo files…"
rm -rf app/demo app/api/demo
rm -f lib/demo-seed.ts lib/demo-artwork.ts scripts/seed-demo.ts

echo "Rewriting lib/nav-links.ts…"
cat > lib/nav-links.ts << 'EOF'
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Music,
  Mic2,
  History,
  Clock,
  Upload,
  Disc,
  Activity,
} from "lucide-react";

const range = "range=ytd";

export interface NavLinkItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

/** Primary destinations — always in the top bar (desktop). */
export const NAV_LINKS_MAIN: NavLinkItem[] = [
  { href: `/me?${range}`, label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: `/me/top-tracks?${range}`, label: "Top Tracks", shortLabel: "Tracks", icon: Music },
  { href: `/me/top-artists?${range}`, label: "Top Artists", shortLabel: "Artists", icon: Mic2 },
  { href: `/me/top-albums?${range}`, label: "Top Albums", shortLabel: "Albums", icon: Disc },
  { href: `/me/patterns?${range}`, label: "Patterns", shortLabel: "Patterns", icon: Activity },
  { href: `/me/history?${range}`, label: "History", shortLabel: "History", icon: History },
];

/** Secondary — under “More” on desktop to keep the bar scannable; still listed in the mobile drawer. */
export const NAV_LINKS_MORE: NavLinkItem[] = [
  { href: "/me/recent", label: "Recent", shortLabel: "Recent", icon: Clock },
  { href: "/me/import", label: "Import", shortLabel: "Import", icon: Upload },
];

export const NAV_LINKS: NavLinkItem[] = [...NAV_LINKS_MAIN, ...NAV_LINKS_MORE];
EOF

echo "Rewriting components/app-header.tsx…"
cat > components/app-header.tsx << 'EOF'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NAV_LINKS, NAV_LINKS_MAIN, NAV_LINKS_MORE } from "@/lib/nav-links";

function pathMatches(pathname: string, href: string) {
  return pathname === href.split("?")[0];
}

const navLinkClass = (active: boolean) =>
  cn(
    "box-border inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium leading-none transition-colors sm:px-3 sm:text-[13px]",
    active
      ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  );

export function AppHeader({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = NAV_LINKS_MORE.some((l) => pathMatches(pathname, l.href));

  return (
    <>
      <header className="sticky top-0 z-50 overflow-visible border-b border-border/50 bg-background pt-[env(safe-area-inset-top,0px)]">
        <div className="app-container grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 overflow-visible py-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link
            href="/me?range=ytd"
            className="min-w-0 shrink-0 font-display text-lg font-semibold tracking-tight"
            onClick={() => onMobileOpenChange(false)}
          >
            <span className="text-primary">Sound</span>
            <span className="text-foreground">folio</span>
          </Link>

          <nav
            className="hidden min-w-0 w-full max-w-full justify-self-center overflow-visible md:col-span-1 md:col-start-2 md:row-start-1 md:flex md:justify-center"
            aria-label="Main"
          >
            <div className="flex min-w-0 max-w-full justify-center overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x py-2">
              <div className="flex w-max flex-nowrap items-center gap-0.5 sm:gap-1">
                {NAV_LINKS_MAIN.map(({ href, label, shortLabel, icon: Icon }) => {
                  const active = pathMatches(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={navLinkClass(active)}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-80" aria-hidden />
                      <span className="hidden xl:inline">{label}</span>
                      <span className="xl:hidden">{shortLabel}</span>
                    </Link>
                  );
                })}
                <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                  <PopoverTrigger
                    type="button"
                    className={cn(navLinkClass(moreActive), "gap-1.5")}
                    aria-expanded={moreOpen}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    <span>More</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1" align="center" sideOffset={6}>
                    <div className="flex flex-col gap-0.5">
                      {NAV_LINKS_MORE.map(({ href, label, icon: Icon }) => {
                        const active = pathMatches(pathname, href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary/12 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </nav>

          <div className="justify-self-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer-nav"
              onClick={() => onMobileOpenChange(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
            </Button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close menu"
          onClick={() => onMobileOpenChange(false)}
        />
      ) : null}

      <aside
        id="mobile-drawer-nav"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(18rem,92vw)] flex-col border-l border-border/60 bg-card pb-[env(safe-area-inset-bottom,0px)] pl-3 pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))] shadow-2xl transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="mb-4 flex items-center justify-between pl-1">
          <span className="font-display text-lg font-semibold">
            <span className="text-primary">Sound</span>
            <span className="text-foreground">folio</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onMobileOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto pl-1" aria-label="Mobile">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathMatches(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => onMobileOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
EOF

echo "Rewriting app/page.tsx…"
cat > app/page.tsx << 'EOF'
export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Nothing to see here.</p>
    </div>
  );
}
EOF

echo "Stripping demo-only image host from next.config.ts…"
perl -i -ne 'print unless /cdn-images\.dzcdn\.net/' next.config.ts

echo "Rewriting components/listening-activity.tsx (drop historyApiPath)…"
cat > components/listening-activity.tsx << 'EOF'
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

export function ListeningActivity({ periodLabel }: { periodLabel: string }) {
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
EOF

echo ""
echo "Done. Run: npm run build"
echo "Then remove this script and the \"remove-demo\" npm script if you no longer need them."
