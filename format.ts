import type { CurrencyCode } from "./sales/data-store"

// ── Dynamic currency formatters ───────────────────────────────
// Formatters are rebuilt whenever the active currency changes.
// Call makeCurrencyFormatters(code) from the API route or the
// setCurrency() API endpoint; then re-export the helpers below.

let _currency: CurrencyCode = "USD"
let _compact:  Intl.NumberFormat
let _full:     Intl.NumberFormat
let _precise:  Intl.NumberFormat

function buildFormatters(currency: CurrencyCode) {
  _currency = currency
  const locale = currency === "INR" ? "en-IN"
              : currency === "JPY" ? "ja-JP"
              : currency === "CNY" ? "zh-CN"
              : "en-US"

  _compact = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: currency === "JPY" ? 0 : 1,
  })
  _full = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 0,
  })
  _precise = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  })
}

// Seed with default on module load
buildFormatters("USD")

/** Call this whenever the user switches currency (e.g. from the API route). */
export function makeCurrencyFormatters(currency: CurrencyCode) {
  buildFormatters(currency)
}

export function getActiveCurrency(): CurrencyCode {
  return _currency
}

// ── Currency formatters ───────────────────────────────────────
export const formatCurrency        = (n: number) => _full.format(n)
export const formatCurrencyCompact = (n: number) => _compact.format(n)
export const formatCurrencyPrecise = (n: number) => _precise.format(n)

// ── Non-currency formatters (unchanged) ───────────────────────
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
const integer       = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export const formatNumber        = (n: number) => integer.format(n)
export const formatNumberCompact = (n: number) => compactNumber.format(n)
export const formatPercent       = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`
export const formatSignedPercent = (n: number, digits = 1) =>
  `${n > 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}
