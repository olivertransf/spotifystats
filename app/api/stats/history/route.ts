import { NextRequest, NextResponse } from "next/server";
import { getStreamsByWeek, getStreamsByMonth, parseTimeRange } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "months";
  const range = req.nextUrl.searchParams.get("range") ?? undefined;
  const from = req.nextUrl.searchParams.get("from") ?? undefined;
  const to = req.nextUrl.searchParams.get("to") ?? undefined;
  const filter = parseTimeRange(range, from, to);

  if (mode === "weeks") {
    const raw = await getStreamsByWeek(26, filter);
    const data = raw.map((d) => ({ label: d.week, minutes: d.minutes, streams: d.streams }));
    return NextResponse.json({ data });
  }

  const raw = await getStreamsByMonth(12, filter);
  const data = raw.map((d) => ({ label: d.month, minutes: d.minutes, streams: d.streams }));
  return NextResponse.json({ data });
}
