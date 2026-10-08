"use client"

import type { ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProductStatus } from "@/lib/sales/analytics"
import { formatSignedPercent } from "@/lib/format"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

export const chartColor = (i: number) => `var(--chart-${(i % 5) + 1})`

export function tooltipFormatter(config: ChartConfig, format: (n: number) => string) {
  return function TooltipRow(
    value: unknown,
    name: unknown,
    item: { color?: string; payload?: { fill?: string } },
  ) {
    const key = String(name)
    return (
      <div className="flex w-full min-w-36 items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.payload?.fill ?? item.color }}
          />
          {config[key]?.label ?? key}
        </span>
        <span className="font-mono font-medium text-foreground tabular-nums">{format(Number(value))}</span>
      </div>
    )
  }
}

type SegmentOption<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 rounded-lg border bg-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-muted-foreground">—</span>
  const flat = Math.abs(value) < 0.005
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        flat ? "text-muted-foreground" : value > 0 ? "text-positive" : "text-negative",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {suffix ? `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}${suffix}` : formatSignedPercent(value)}
    </span>
  )
}

const STATUS_STYLES: Record<ProductStatus, string> = {
  Star: "bg-positive/12 text-positive",
  Steady: "bg-secondary text-secondary-foreground",
  Underperforming: "bg-chart-3/20 text-foreground",
  "Loss-making": "bg-negative/12 text-negative",
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STATUS_STYLES[status])}>
      {status}
    </Badge>
  )
}

export function BarList({
  items,
  format,
}: {
  items: { label: string; value: number; ratio: number; meta?: string; color?: string }[]
  format: (n: number) => string
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item, i) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {format(item.value)}
              {item.meta ? <span className="ml-2">{item.meta}</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(2, item.ratio * 100)}%`, backgroundColor: item.color ?? chartColor(i) }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )
}
