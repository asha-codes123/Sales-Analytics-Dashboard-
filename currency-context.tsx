"use client"

/**
 * CurrencyContext
 * ─────────────────────────────────────────────────────────────
 * Provides the active currency code to the entire React tree.
 * Components import `useCurrency()` and call the formatters
 * returned from it so charts/KPIs automatically reformat when
 * the user switches currency.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { CurrencyCode } from "@/lib/sales/data-store"

// ── Intl formatter factory ────────────────────────────────────
function buildFmts(currency: CurrencyCode) {
  const locale =
    currency === "INR" ? "en-IN"
    : currency === "JPY" ? "ja-JP"
    : currency === "CNY" ? "zh-CN"
    : "en-US"

  const jpyNoDecimals = currency === "JPY"

  const compact = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: jpyNoDecimals ? 0 : 1,
  })
  const full = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
  const precise = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: jpyNoDecimals ? 0 : 2,
    maximumFractionDigits: jpyNoDecimals ? 0 : 2,
  })

  return {
    formatCurrency:        (n: number) => full.format(n),
    formatCurrencyCompact: (n: number) => compact.format(n),
    formatCurrencyPrecise: (n: number) => precise.format(n),
  }
}

// ── Context shape ─────────────────────────────────────────────
type CurrencyCtx = {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatCurrency: (n: number) => string
  formatCurrencyCompact: (n: number) => string
  formatCurrencyPrecise: (n: number) => string
}

const CurrencyContext = createContext<CurrencyCtx | null>(null)

// ── Provider ──────────────────────────────────────────────────
export function CurrencyProvider({
  initial = "USD",
  children,
}: {
  initial?: CurrencyCode
  children: ReactNode
}) {
  const [currency, setCode] = useState<CurrencyCode>(initial)

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    // optimistic update
    setCode(code)
    // notify the server so API responses (insights text, exports) also use the new currency
    try {
      await fetch("/api/sales/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: code }),
      })
    } catch {
      // non-critical – the server formatter is only used for insight text
    }
  }, [])

  const fmts = useMemo(() => buildFmts(currency), [currency])

  const value = useMemo<CurrencyCtx>(
    () => ({ currency, setCurrency, ...fmts }),
    [currency, setCurrency, fmts],
  )

  return <CurrencyContext value={value}>{children}</CurrencyContext>
}

// ── Hook ──────────────────────────────────────────────────────
export function useCurrency(): CurrencyCtx {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>")
  return ctx
}
