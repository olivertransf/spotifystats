import { NextRequest, NextResponse } from "next/server";
import { getStreamsByWeek, getStreamsByMonth } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "months";

  if (mode === "weeks") {
    const raw = await getStreamsByWeek(26);
    const data = raw.map((d) => ({ label: d.week, minutes: d.minutes, streams: d.streams }));
    return NextResponse.json({ data });
  }

  const raw = await getStreamsByMonth(12);
  const data = raw.map((d) => ({ label: d.month, minutes: d.minutes, streams: d.streams }));
  return NextResponse.json({ data });
}
