"use client"

import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDateLabel, formatNumber, formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { useCustomers } from "@/lib/hooks/use-api"
import { BarList, StatTile, tooltipFormatter } from "./shared"

const cohortConfig = {
  newCustomers:       { label: "New",       color: "var(--chart-3)" },
  returningCustomers: { label: "Returning", color: "var(--chart-1)" },
} satisfies ChartConfig

const frequencyConfig = { customers: { label: "Customers", color: "var(--chart-2)" } } satisfies ChartConfig

export function CustomersTab({ filters }: { filters: Filters }) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const { data, isLoading } = useCustomers(filters)

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4">
        <StatTile label="Active customers" value={formatNumber(data.totalCustomers)} hint="Purchased in period" />
        <StatTile
          label="Repeat purchase rate"
          value={formatPercent(data.repeatRate)}
          hint={`${data.avgOrdersPerCustomer.toFixed(1)} orders per customer`}
        />
        <StatTile label="Revenue per customer" value={formatCurrency(data.avgRevenuePerCustomer)} hint="Average lifetime in period" />
        <StatTile label="Top 10% share" value={formatPercent(data.top10Share)} hint="Revenue from best customers" />
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>New vs returning customers</CardTitle>
          <CardDescription>Unique customers per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cohortConfig} className="aspect-auto h-[280px] w-full">
            <BarChart data={data.monthly} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(cohortConfig, formatNumber)} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="returningCustomers" stackId="a" fill="var(--color-returningCustomers)" />
              <Bar dataKey="newCustomers" stackId="a" fill="var(--color-newCustomers)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer segments</CardTitle>
          <CardDescription>Revenue and margin by segment</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            format={formatCurrencyCompact}
            items={data.segments.map((s: any) => ({
              label: s.key,
              value: s.revenue,
              ratio: s.share,
              meta:  `${formatPercent(s.share, 0)} · ${formatPercent(s.margin, 0)} margin`,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase frequency</CardTitle>
          <CardDescription>Customers by number of orders</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={frequencyConfig} className="aspect-auto h-[240px] w-full">
            <BarChart data={data.frequency} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent formatter={tooltipFormatter(frequencyConfig, formatNumber)} />} />
              <Bar dataKey="customers" fill="var(--color-customers)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Top customers</CardTitle>
          <CardDescription>Highest-value accounts in the period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Last purchase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topCustomers.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.id}</TableCell>
                  <TableCell className="text-muted-foreground">{c.segment}</TableCell>
                  <TableCell className="text-muted-foreground">{c.region}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{c.orders}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatCurrency(c.revenue)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDateLabel(c.lastPurchase)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
