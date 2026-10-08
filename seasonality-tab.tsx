"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { Filters } from "@/lib/sales/types"
import { formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { useSeasonality } from "@/lib/hooks/use-api"
import { StatTile, chartColor, tooltipFormatter } from "./shared"

const weekdayConfig = {
  avgDailyRevenue: { label: "Avg daily revenue", color: "var(--chart-2)" },
} satisfies ChartConfig

export function SeasonalityTab({ filters }: { filters: Filters }) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const { data, isLoading } = useSeasonality(filters)

  const yearConfig = useMemo(
    () =>
      Object.fromEntries(
        (data?.years ?? []).map((y: string, i: number) => [`y${y}`, { label: y, color: chartColor(i) }]),
      ) satisfies ChartConfig,
    [data?.years],
  )

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const quarterMax = Math.max(1, ...data.quarters.flatMap((q: any) => q.values))
  const bestWeekday = data.weekdays.reduce((a: any, b: any) => (b.avgDailyRevenue > a.avgDailyRevenue ? b : a))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4">
        <StatTile label="Peak month"    value={data.peak.month}   hint={`${formatPercent(data.peakLift)} above average`} />
        <StatTile label="Slowest month" value={data.trough.month} hint={`Avg ${formatCurrencyCompact(data.trough.average)}`} />
        <StatTile label="Best weekday"  value={bestWeekday.day}   hint={`${formatCurrency(bestWeekday.avgDailyRevenue)} per day`} />
        <StatTile label="Years covered" value={String(data.years.length)} hint={data.years.join(", ")} />
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly revenue, year over year</CardTitle>
          <CardDescription>Compare the same month across years to spot seasonal cycles</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={yearConfig} className="aspect-auto h-[300px] w-full">
            <LineChart data={data.monthByYear} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatCurrencyCompact(Number(v))} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(yearConfig, formatCurrency)} />} />
              <ChartLegend content={<ChartLegendContent />} />
              {data.years.map((y: string) => (
                <Line
                  key={y}
                  dataKey={`y${y}`}
                  type="monotone"
                  stroke={`var(--color-y${y})`}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day-of-week pattern</CardTitle>
          <CardDescription>Average revenue per trading day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={weekdayConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={data.weekdays} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => formatCurrencyCompact(Number(v))} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(weekdayConfig, formatCurrency)} />} />
              <Bar dataKey="avgDailyRevenue" fill="var(--color-avgDailyRevenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quarterly revenue</CardTitle>
          <CardDescription>Quarter-by-quarter totals for each year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Year</th>
                  {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                    <th key={q} scope="col" className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">{q}</th>
                  ))}
                  <th scope="col" className="px-2 py-1 text-right text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.quarters.map((q: any) => (
                  <tr key={q.year}>
                    <th scope="row" className="px-2 py-1 text-left font-medium">{q.year}</th>
                    {q.values.map((v: number, i: number) => {
                      const ratio = v / quarterMax
                      return (
                        <td
                          key={i}
                          className="rounded-md px-2 py-2.5 font-mono text-xs tabular-nums"
                          style={{
                            backgroundColor: `color-mix(in oklch, var(--chart-2) ${Math.round(ratio * 75) + 5}%, transparent)`,
                            color: ratio > 0.6 ? "white" : undefined,
                          }}
                        >
                          {v ? formatCurrencyCompact(v) : "—"}
                        </td>
                      )
                    })}
                    <td className="px-2 py-2.5 text-right font-mono text-xs font-semibold tabular-nums">
                      {formatCurrencyCompact(q.values.reduce((s: number, v: number) => s + v, 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
