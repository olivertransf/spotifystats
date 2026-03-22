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

export type NavBase = "/me" | "/demo";

export function createNavLinks(base: NavBase) {
  const main: NavLinkItem[] = [
    { href: `${base}?${range}`, label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
    { href: `${base}/top-tracks?${range}`, label: "Top Tracks", shortLabel: "Tracks", icon: Music },
    { href: `${base}/top-artists?${range}`, label: "Top Artists", shortLabel: "Artists", icon: Mic2 },
    { href: `${base}/top-albums?${range}`, label: "Top Albums", shortLabel: "Albums", icon: Disc },
    { href: `${base}/patterns?${range}`, label: "Patterns", shortLabel: "Patterns", icon: Activity },
    { href: `${base}/history?${range}`, label: "History", shortLabel: "History", icon: History },
  ];
  const more: NavLinkItem[] =
    base === "/demo"
      ? [{ href: `${base}/recent`, label: "Recent", shortLabel: "Recent", icon: Clock }]
      : [
          { href: `${base}/recent`, label: "Recent", shortLabel: "Recent", icon: Clock },
          { href: `${base}/import`, label: "Import", shortLabel: "Import", icon: Upload },
        ];
  return { main, more, all: [...main, ...more] };
}

/** Primary destinations — always in the top bar (desktop). */
export const NAV_LINKS_MAIN: NavLinkItem[] = createNavLinks("/me").main;

/** Secondary — under “More” on desktop to keep the bar scannable; still listed in the mobile drawer. */
export const NAV_LINKS_MORE: NavLinkItem[] = createNavLinks("/me").more;

export const NAV_LINKS: NavLinkItem[] = createNavLinks("/me").all;
