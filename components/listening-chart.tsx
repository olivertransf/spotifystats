"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

interface ChartData {
  label: string;
  minutes: number;
  streams: number;
}

interface ListeningChartProps {
  data: ChartData[];
  mode: "weeks" | "months";
}

export function ListeningChart({ data, mode }: ListeningChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => {
            try {
              return mode === "months"
                ? format(parseISO(`${val}-01`), "MMM yy")
                : format(parseISO(val), "MMM d");
            } catch {
              return val;
            }
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}m`}
          width={40}
        />
        <Tooltip
          contentStyle={{ background: "#111", border: "1px solid #262626", borderRadius: 8 }}
          labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: 4 }}
          itemStyle={{ color: "#a1a1aa" }}
          labelFormatter={(val) => {
            try {
              return mode === "months"
                ? format(parseISO(`${val}-01`), "MMMM yyyy")
                : format(parseISO(val), "MMM d, yyyy");
            } catch {
              return val;
            }
          }}
          formatter={(value, name) => [
            name === "minutes" ? `${Number(value)} min` : value,
            name === "minutes" ? "Minutes" : "Streams",
          ]}
        />
        <Bar dataKey="minutes" fill="#1db954" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
