"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
  { year: "2019", yield: 3.2, predicted: 3.2 },
  { year: "2020", yield: 3.4, predicted: 3.3 },
  { year: "2021", yield: 3.1, predicted: 3.5 },
  { year: "2022", yield: 3.8, predicted: 3.6 },
  { year: "2023", yield: 3.9, predicted: 3.8 },
  { year: "2024 (E)", yield: null, predicted: 4.2 },
];

const chartConfig = {
  yield: {
    label: "Historical Yield",
    color: "hsl(var(--primary))",
  },
  predicted: {
    label: "AI Prediction",
    color: "hsl(var(--accent))",
  },
};

export function YieldOverviewChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="year" 
            axisLine={false} 
            tickLine={false} 
            tickMargin={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `${value}t`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="yield"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorYield)"
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorPredicted)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
