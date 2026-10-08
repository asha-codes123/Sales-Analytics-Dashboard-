"use client"

import { useId } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PeriodOption } from "@/lib/sales/analytics"
import { DEFAULT_FILTERS, type Filters } from "@/lib/sales/types"

type Option = { value: string; label: string }

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select items={options} value={value} onValueChange={(v) => v !== null && onChange(String(v))}>
        <SelectTrigger className="w-full bg-card" aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const withAll = (values: string[], allLabel: string): Option[] => [
  { value: "all", label: allLabel },
  ...values.map((v) => ({ value: v, label: v })),
]

export function FilterBar({
  filters,
  onChange,
  periodOptions,
  dimensions,
}: {
  filters: Filters
  onChange: (filters: Filters) => void
  periodOptions: PeriodOption[]
  dimensions: { regions: string[]; categories: string[]; channels: string[]; segments: string[] }
}) {
  const set = (key: keyof Filters) => (value: string) => onChange({ ...filters, [key]: value })
  const isDirty = (Object.keys(filters) as (keyof Filters)[]).some((k) => filters[k] !== DEFAULT_FILTERS[k])

  return (
    <section aria-label="Filters" className="grid grid-cols-2 items-end gap-3 md:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
      <FilterSelect
        label="Period"
        value={filters.period}
        onChange={set("period")}
        options={periodOptions.map((p) => ({ value: p.value, label: p.label }))}
      />
      <FilterSelect label="Region" value={filters.region} onChange={set("region")} options={withAll(dimensions.regions, "All regions")} />
      <FilterSelect
        label="Category"
        value={filters.category}
        onChange={set("category")}
        options={withAll(dimensions.categories, "All categories")}
      />
      <FilterSelect label="Channel" value={filters.channel} onChange={set("channel")} options={withAll(dimensions.channels, "All channels")} />
      <FilterSelect label="Segment" value={filters.segment} onChange={set("segment")} options={withAll(dimensions.segments, "All segments")} />
      <Button variant="ghost" onClick={() => onChange(DEFAULT_FILTERS)} disabled={!isDirty} className="h-8">
        <RotateCcw aria-hidden />
        Reset
      </Button>
    </section>
  )
}
