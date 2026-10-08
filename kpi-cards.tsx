"use client"

import { CircleDollarSign, Percent, Receipt, ShoppingCart, TrendingUp, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Summary } from "@/lib/sales/analytics"
import { formatNumber, formatPercent } from "@/lib/format"
import { useCurrency } from "@/lib/currency-context"
import { Delta } from "./shared"

type Kpi = { label: string; value: string; delta: number | null; deltaSuffix?: string; icon: LucideIcon; hint: string }

const change = (cur: number, prev: number | undefined) => (prev ? (cur - prev) / Math.abs(prev) : null)

export function KpiCards({ current, previous }: { current: Summary; previous: Summary | null }) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency()
  const kpis: Kpi[] = [
    {
      label: "Total revenue",
      value: formatCurrencyCompact(current.revenue),
      delta: change(current.revenue, previous?.revenue),
      icon: CircleDollarSign,
      hint: formatCurrency(current.revenue),
    },
    {
      label: "Net profit",
      value: formatCurrencyCompact(current.profit),
      delta: change(current.profit, previous?.profit),
      icon: TrendingUp,
      hint: `Cost ${formatCurrencyCompact(current.cost)}`,
    },
    {
      label: "Profit margin",
      value: formatPercent(current.margin),
      delta: previous ? current.margin - previous.margin : null,
      deltaSuffix: " pts",
      icon: Percent,
      hint: `Avg discount ${formatPercent(current.avgDiscount)}`,
    },
    {
      label: "Orders",
      value: formatNumber(current.orders),
      delta: change(current.orders, previous?.orders),
      icon: ShoppingCart,
      hint: `${formatNumber(current.units)} units sold`,
    },
    {
      label: "Avg order value",
      value: formatCurrency(current.aov),
      delta: change(current.aov, previous?.aov),
      icon: Receipt,
      hint: "Revenue per order",
    },
    {
      label: "Customers",
      value: formatNumber(current.customers),
      delta: change(current.customers, previous?.customers),
      icon: Users,
      hint: "Unique buyers",
    },
  ]

  return (
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => (
        <article key={k.label} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">{k.label}</h3>
            <k.icon className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{k.value}</p>
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
            {previous ? (
              <>
                <Delta value={k.delta} suffix={k.deltaSuffix} />
                <span className="text-muted-foreground">vs prev.</span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">{k.hint}</span>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}
