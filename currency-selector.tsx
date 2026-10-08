"use client"

import { DollarSign } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/lib/currency-context"
import { CURRENCY_OPTIONS } from "@/lib/sales/data-store"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <Select
      value={currency}
      onValueChange={(v) => v && setCurrency(v as typeof currency)}
      items={CURRENCY_OPTIONS.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))}
    >
      <SelectTrigger
        className="h-8 w-auto gap-1.5 border-border/60 bg-background px-2.5 text-xs font-medium"
        aria-label="Select display currency"
      >
        <DollarSign className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_OPTIONS.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-mono text-xs font-semibold text-muted-foreground w-7 inline-block">{c.symbol}</span>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
