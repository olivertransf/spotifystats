/** Client-safe label for URL search params (no DB). */
export function describeTimeRangeFromSearchParams(searchParams: {
  get: (key: string) => string | null;
}): string {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && to) return `${from} → ${to}`;
  const r = searchParams.get("range") ?? "ytd";
  const map: Record<string, string> = {
    "30d": "Last 30 days",
    "3m": "Last 3 months",
    "6m": "Last 6 months",
    "1y": "Last 12 months",
    ytd: "This year",
    all: "All time",
  };
  return map[r] ?? "This year";
}
