"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import type { CoAttainment, PoAttainment } from "@/lib/types";
import { getAttainmentColor } from "@/lib/attainment";
import { formatPercent } from "@/lib/utils";

interface CoChartProps {
  data: CoAttainment[];
}

export function CoAttainmentBarChart({ data }: CoChartProps) {
  const chartData = data.map((d) => ({
    name: d.co_number,
    attainment: Math.round(d.attainment * 100),
    target: Math.round(d.target * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 20% 20%)" />
        <XAxis dataKey="name" stroke="hsl(260 10% 60%)" fontSize={12} />
        <YAxis stroke="hsl(260 10% 60%)" fontSize={12} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: "hsl(260 28% 10%)",
            border: "1px solid hsl(260 20% 20%)",
            borderRadius: "8px",
          }}
          formatter={(value) => [`${value ?? 0}%`, ""]}
        />
        <Legend />
        <Bar dataKey="attainment" name="Attainment %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" name="Target %" fill="#6d28d9" radius={[4, 4, 0, 0]} opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PoChartProps {
  data: PoAttainment[];
}

export function PoAttainmentLineChart({ data }: PoChartProps) {
  const chartData = data.map((d) => ({
    name: d.po_number,
    attainment: Math.round(d.attainment * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 20% 20%)" />
        <XAxis dataKey="name" stroke="hsl(260 10% 60%)" fontSize={11} />
        <YAxis stroke="hsl(260 10% 60%)" domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: "hsl(260 28% 10%)",
            border: "1px solid hsl(260 20% 20%)",
            borderRadius: "8px",
          }}
        />
        <Line
          type="monotone"
          dataKey="attainment"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6", r: 4 }}
          name="PO Attainment %"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CoRadialProps {
  data: CoAttainment[];
}

export function CoRadialChart({ data }: CoRadialProps) {
  const chartData = data.map((d) => ({
    name: d.co_number,
    value: Math.round(d.attainment * 100),
    fill: getAttainmentColor(d.attainment),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="20%"
        outerRadius="90%"
        data={chartData}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar background dataKey="value" cornerRadius={4} />
        <Tooltip
          formatter={(value) => [`${value ?? 0}%`, "Attainment"]}
          contentStyle={{
            background: "hsl(260 28% 10%)",
            border: "1px solid hsl(260 20% 20%)",
            borderRadius: "8px",
          }}
        />
        <Legend />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

export function AttainmentSummaryCards({ data }: CoChartProps) {
  const met = data.filter((d) => d.met).length;
  const avg =
    data.length > 0
      ? data.reduce((s, d) => s + d.attainment, 0) / data.length
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border/60 bg-card/60 p-4">
        <p className="text-xs text-muted-foreground">Avg CO Attainment</p>
        <p className="text-2xl font-bold text-primary">{formatPercent(avg)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-card/60 p-4">
        <p className="text-xs text-muted-foreground">COs Met</p>
        <p className="text-2xl font-bold text-green-400">
          {met}/{data.length}
        </p>
      </div>
      <div className="col-span-2 rounded-lg border border-border/60 bg-card/60 p-4 sm:col-span-1">
        <p className="text-xs text-muted-foreground">Status</p>
        <p className="text-lg font-semibold">
          {met === data.length && data.length > 0 ? "All targets met" : "Review needed"}
        </p>
      </div>
    </div>
  );
}
