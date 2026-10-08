"use client"

import { useMemo, useState } from "react"
import { Loader2, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductPerformance } from "@/lib/sales/analytics"
import type { Filters } from "@/lib/sales/types"
import { formatNumber, formatNumberCompact, formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { useProducts } from "@/lib/hooks/use-api"
import { Delta, SegmentedControl, StatusBadge, tooltipFormatter } from "./shared"

type Metric  = "revenue" | "units" | "profit"
type SortKey = "key" | "category" | "revenue" | "units" | "profit" | "margin" | "avgDiscount" | "growth"

const metricConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  units:   { label: "Units",   color: "var(--chart-2)" },
  profit:  { label: "Profit",  color: "var(--chart-5)" },
} satisfies ChartConfig

const marginConfig = { margin: { label: "Margin", color: "var(--chart-1)" } } satisfies ChartConfig

export function ProductsTab({ filters }: { filters: Filters }) {
  const [metric, setMetric] = useState<Metric>("revenue")
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "revenue", dir: "desc" })
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const { data, isLoading } = useProducts(filters)

  const products  = data?.products      ?? []
  const discounts = data?.discountImpact ?? []

  const top = useMemo(() => [...products].sort((a, b) => b[metric] - a[metric]).slice(0, 10), [products, metric])
  const sorted = useMemo(() => {
    const list = [...products]
    list.sort((a, b) => {
      const av = a[sort.key] ?? -Infinity
      const bv = b[sort.key] ?? -Infinity
      const cmp = typeof av === "string" ? av.localeCompare(String(bv)) : (av as number) - (bv as number)
      return sort.dir === "asc" ? cmp : -cmp
    })
    return list
  }, [products, sort])

  const metricFormat = metric === "units" ? formatNumber : formatCurrency
  const statusCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Best-selling products</CardTitle>
          <CardDescription>Top 10 ranked by {metricConfig[metric].label.toLowerCase()}</CardDescription>
          <CardAction>
            <SegmentedControl
              label="Ranking metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "revenue", label: "Revenue" },
                { value: "units",   label: "Units"   },
                { value: "profit",  label: "Profit"  },
              ]}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={metricConfig} className="aspect-auto h-[340px] w-full">
            <BarChart data={top} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => metric === "units" ? formatNumberCompact(Number(v)) : formatCurrencyCompact(Number(v))}
              />
              <YAxis type="category" dataKey="key" tickLine={false} axisLine={false} width={124} interval={0} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(metricConfig, metricFormat)} />} />
              <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={4}>
                {top.map((p) => (
                  <Cell key={p.key} fill={p[metric] < 0 ? "var(--negative)" : `var(--color-${metric})`} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Discount impact on margin</CardTitle>
          <CardDescription>Profit margin by discount level</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChartContainer config={marginConfig} className="aspect-auto h-[220px] w-full">
            <BarChart data={discounts} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatPercent(Number(v), 0)} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(marginConfig, (n) => formatPercent(n))} />} />
              <Bar dataKey="margin" radius={4}>
                {discounts.map((d) => (
                  <Cell key={d.bucket} fill={d.margin < 0 ? "var(--negative)" : "var(--color-margin)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {(["Star", "Steady", "Underperforming", "Loss-making"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <dt><StatusBadge status={s} /></dt>
                <dd className="font-mono font-semibold tabular-nums">{statusCounts[s] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="lg:col-span-5">
        <CardHeader>
          <CardTitle>Product performance</CardTitle>
          <CardDescription>Click a column to sort. Trend compares second half vs first half of the period.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Product"   k="key"         sort={sort} setSort={setSort} />
                <SortHeader label="Category"  k="category"    sort={sort} setSort={setSort} />
                <SortHeader label="Revenue"   k="revenue"     sort={sort} setSort={setSort} numeric />
                <SortHeader label="Units"     k="units"       sort={sort} setSort={setSort} numeric />
                <SortHeader label="Profit"    k="profit"      sort={sort} setSort={setSort} numeric />
                <SortHeader label="Margin"    k="margin"      sort={sort} setSort={setSort} numeric />
                <SortHeader label="Avg disc." k="avgDiscount" sort={sort} setSort={setSort} numeric />
                <SortHeader label="Trend"     k="growth"      sort={sort} setSort={setSort} numeric />
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                <ProductRow key={p.key} product={p} formatCurrency={formatCurrency} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductRow({ product: p, formatCurrency }: { product: ProductPerformance; formatCurrency: (n: number) => string }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{p.key}</TableCell>
      <TableCell className="text-muted-foreground">{p.category}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatCurrency(p.revenue)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatNumber(p.units)}</TableCell>
      <TableCell className={`text-right font-mono tabular-nums ${p.profit < 0 ? "text-negative" : ""}`}>
        {formatCurrency(p.profit)}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatPercent(p.margin)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatPercent(p.avgDiscount)}</TableCell>
      <TableCell className="text-right text-xs"><Delta value={p.growth} /></TableCell>
      <TableCell><StatusBadge status={p.status} /></TableCell>
    </TableRow>
  )
}

function SortHeader({ label, k, sort, setSort, numeric }: {
  label: string; k: SortKey
  sort: { key: SortKey; dir: "asc" | "desc" }
  setSort: (s: { key: SortKey; dir: "asc" | "desc" }) => void
  numeric?: boolean
}) {
  const active = sort.key === k
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={numeric ? "text-right" : undefined} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => setSort({ key: k, dir: active && sort.dir === "desc" ? "asc" : "desc" })}
        className={`inline-flex items-center gap-1 rounded hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon className="size-3" aria-hidden />
      </button>
    </TableHead>
  )
}
