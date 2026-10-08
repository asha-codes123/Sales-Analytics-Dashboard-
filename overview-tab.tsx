"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Granularity } from "@/lib/sales/analytics"
import type { Filters } from "@/lib/sales/types"
import { formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { useOverview } from "@/lib/hooks/use-api"
import { BarList, SegmentedControl, chartColor, tooltipFormatter } from "./shared"

const trendConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  profit:  { label: "Profit",  color: "var(--chart-2)" },
} satisfies ChartConfig

const emptyConfig = {} satisfies ChartConfig

export function OverviewTab({ filters }: { filters: Filters }) {
  const [granularity, setGranularity] = useState<Granularity>("month")
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const { data, isLoading } = useOverview(filters, granularity)

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const trend      = data?.timeSeries ?? []
  const categories = (data?.byCategory ?? []).map((c, i) => ({ ...c, fill: chartColor(i) }))
  const channels   = data?.byChannel  ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales trend</CardTitle>
          <CardDescription>Revenue and profit over time</CardDescription>
          <CardAction>
            <SegmentedControl
              label="Trend granularity"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: "week",  label: "Weekly"  },
                { value: "month", label: "Monthly" },
              ]}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="aspect-auto h-[300px] w-full">
            <AreaChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-profit)" stopOpacity={0.3}  />
                  <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => formatCurrencyCompact(Number(v))}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dot" formatter={tooltipFormatter(trendConfig, formatCurrency)} />}
              />
              <Area dataKey="revenue" type="monotone" stroke="var(--color-revenue)" fill="url(#fillRevenue)" strokeWidth={2} />
              <Area dataKey="profit"  type="monotone" stroke="var(--color-profit)"  fill="url(#fillProfit)"  strokeWidth={2} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by category</CardTitle>
          <CardDescription>Share of total sales</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={emptyConfig} className="mx-auto aspect-square h-[180px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel formatter={tooltipFormatter(emptyConfig, formatCurrency)} />} />
              <Pie data={categories} dataKey="revenue" nameKey="key" innerRadius={52} outerRadius={84} paddingAngle={2} strokeWidth={2} />
            </PieChart>
          </ChartContainer>
          <ul className="flex flex-col gap-2 text-sm">
            {categories.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: c.fill }} />
                  <span className="truncate">{c.key}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {formatPercent(c.share)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional performance</CardTitle>
          <CardDescription>Revenue vs profit by region</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="aspect-auto h-[240px] w-full">
            <BarChart data={data?.byCategory ?? []} layout="vertical" margin={{ left: 0, right: 8 }} barGap={2}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="key" tickLine={false} axisLine={false} width={64} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(trendConfig, formatCurrency)} />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="profit"  fill="var(--color-profit)"  radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales channels</CardTitle>
          <CardDescription>Revenue and margin by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            format={formatCurrencyCompact}
            items={channels.map((c) => ({
              label: c.key,
              value: c.revenue,
              ratio: c.revenue / (channels[0]?.revenue || 1),
              meta:  `${formatPercent(c.margin)} margin`,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
