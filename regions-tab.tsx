"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Filters } from "@/lib/sales/types"
import { formatNumber, formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { useRegions } from "@/lib/hooks/use-api"
import { Delta, SegmentedControl, tooltipFormatter } from "./shared"

const regionConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  profit:  { label: "Profit",  color: "var(--chart-2)" },
} satisfies ChartConfig

export function RegionsTab({ filters }: { filters: Filters }) {
  const [heatMetric, setHeatMetric] = useState<"revenue" | "profit">("revenue")
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const { data, isLoading } = useRegions(filters)

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const regions = data?.byRegion ?? []
  // The API returns growth as an array; convert to Map for easy lookup
  const growthMap = new Map((data?.growth ?? []).map((g) => [g.region, g.rate]))
  // Use the products cross-tab for region×category; regions endpoint provides it
  const matrix = data?.crossTab ?? { rows: [], cols: [], values: {}, max: 0 }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Revenue and profit by region</CardTitle>
          <CardDescription>Which markets drive the business</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={regionConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={regions} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatCurrencyCompact(Number(v))} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(regionConfig, formatCurrency)} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              <Bar dataKey="profit"  fill="var(--color-profit)"  radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Region scorecard</CardTitle>
          <CardDescription>Trend: second half vs first half of the period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>
                    <div className="font-medium">{r.key}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrencyCompact(r.revenue)} · {formatNumber(r.orders)} orders
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPercent(r.share)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPercent(r.margin)}</TableCell>
                  <TableCell className="text-right text-xs">
                    <Delta value={growthMap.get(r.key) ?? null} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="lg:col-span-5">
        <CardHeader>
          <CardTitle>Region × category heatmap</CardTitle>
          <CardDescription>Darker cells indicate stronger {heatMetric}</CardDescription>
          <CardAction>
            <SegmentedControl
              label="Heatmap metric"
              value={heatMetric}
              onChange={setHeatMetric}
              options={[
                { value: "revenue", label: "Revenue" },
                { value: "profit",  label: "Profit"  },
              ]}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">Region</th>
                  {matrix.cols.map((c) => (
                    <th key={c} scope="col" className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((r) => (
                  <tr key={r}>
                    <th scope="row" className="px-2 py-1 text-left font-medium">{r}</th>
                    {matrix.cols.map((c) => {
                      const v = matrix.values[r]?.[c] ?? 0
                      const ratio = matrix.max ? Math.abs(v) / matrix.max : 0
                      const base = v < 0 ? "var(--negative)" : "var(--chart-1)"
                      return (
                        <td
                          key={c}
                          className="rounded-md px-2 py-2.5 font-mono text-xs tabular-nums"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${base} ${Math.round(ratio * 80) + 6}%, transparent)`,
                            color: ratio > 0.55 ? "white" : undefined,
                          }}
                        >
                          {formatCurrencyCompact(v)}
                        </td>
                      )
                    })}
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
