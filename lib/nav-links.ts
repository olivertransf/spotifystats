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
