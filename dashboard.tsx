"use client"

import { useCallback, useRef, useState } from "react"
import { mutate } from "swr"
import {
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  MapPin,
  Package,
  SearchX,
  Upload,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_FILTERS, type Filters } from "@/lib/sales/types"
import { formatDateLabel, formatNumber } from "@/lib/format"
import { useFilters, useDatasetMeta, useSummary } from "@/lib/hooks/use-api"
import { AppHeader } from "./app-header"
import { FilterBar } from "./filter-bar"
import { KpiCards } from "./kpi-cards"
import { OverviewTab } from "./overview-tab"
import { ProductsTab } from "./products-tab"
import { RegionsTab } from "./regions-tab"
import { CustomersTab } from "./customers-tab"
import { SeasonalityTab } from "./seasonality-tab"
import { InsightsTab } from "./insights-tab"

const TABS = [
  { value: "overview",    label: "Overview",    icon: LayoutDashboard },
  { value: "products",    label: "Products",    icon: Package },
  { value: "regions",     label: "Regions",     icon: MapPin },
  { value: "customers",   label: "Customers",   icon: Users },
  { value: "seasonality", label: "Seasonality", icon: CalendarDays },
  { value: "insights",    label: "Insights",    icon: Lightbulb },
]

/** Invalidates every /api/sales/* key so SWR refetches all tabs. */
function revalidateAll() {
  mutate(
    (key: unknown) => typeof key === "string" && key.startsWith("/api/sales/"),
    undefined,
    { revalidate: true },
  )
}

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [tab, setTab]         = useState("overview")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Server state ───────────────────────────────────────────
  const { data: meta, mutate: mutateMeta } = useDatasetMeta()
  const { data: filterDims }               = useFilters()
  const { data: summaryData, isLoading: summaryLoading } = useSummary(filters)

  const hasData = (meta?.count ?? 0) > 0

  // ── Upload handler (used by both empty-state and header) ───
  async function handleFile(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res  = await fetch("/api/sales/dataset/upload", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed")
      mutateMeta()
      revalidateAll()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleUploaded = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    mutateMeta()
    revalidateAll()
  }, [mutateMeta])

  const handleCleared = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    mutateMeta()
    revalidateAll()
  }, [mutateMeta])

  const handleFiltersChange = useCallback((next: Filters) => setFilters(next), [])

  // ── Derived ────────────────────────────────────────────────
  const dimensions = {
    regions:    filterDims?.regions    ?? [],
    categories: filterDims?.categories ?? [],
    channels:   filterDims?.channels   ?? [],
    segments:   filterDims?.segments   ?? [],
  }
  const periodOptions = filterDims?.periodOptions ?? [{ value: "all", label: "All time", range: null }]
  const current  = summaryData?.current  ?? null
  const previous = summaryData?.previous ?? null
  const count    = summaryData?.count    ?? 0
  const period   = periodOptions.find((o) => o.value === filters.period) ?? periodOptions[0]
  const dateRange = period?.range

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        dataset={{
          name:   meta?.name   ?? "",
          source: meta?.source ?? "upload",
          count:  meta?.count  ?? 0,
        }}
        filters={filters}
        onUploaded={handleUploaded}
        onCleared={handleCleared}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">

        {/* ── Empty state: no data uploaded yet ─────────────── */}
        {!hasData ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8">
            {/* Hero */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <FileSpreadsheet className="size-8 text-primary" aria-hidden />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Upload your sales data
              </h1>
              <p className="max-w-md text-base text-muted-foreground text-balance">
                Drop in any CSV file with your transaction records and get instant charts,
                KPIs, regional breakdowns, and AI-powered insights — all in seconds.
              </p>
            </div>

            {/* Drop zone */}
            <label
              htmlFor="empty-upload"
              className="group relative flex w-full max-w-lg cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card px-8 py-12 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
                <Upload className="size-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {uploading ? "Uploading…" : "Click to choose a file"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">CSV files only · any size</p>
              </div>
              {uploading && <Loader2 className="size-5 animate-spin text-primary" />}
              {uploadError && (
                <p className="text-sm text-negative">{uploadError}</p>
              )}
              <input
                id="empty-upload"
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                aria-label="Upload a sales CSV file"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                  if (inputRef.current) inputRef.current.value = ""
                }}
              />
            </label>

            {/* Expected columns hint */}
            <details className="w-full max-w-lg rounded-xl border bg-card px-5 py-4 text-sm">
              <summary className="cursor-pointer select-none font-medium">
                Expected CSV columns
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-muted-foreground">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium text-foreground">Column</th>
                      <th className="pb-2 text-left font-medium text-foreground">Example</th>
                      <th className="pb-2 text-left font-medium text-foreground">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["date",        "2024-03-15",   "Yes"],
                      ["product",     "Laptop Pro",   "Yes"],
                      ["category",    "Electronics",  "Yes"],
                      ["region",      "North",        "Yes"],
                      ["channel",     "Online",       "Yes"],
                      ["segment",     "Enterprise",   "Yes"],
                      ["customer_id", "CUST-001",     "Yes"],
                      ["units",       "3",            "Yes"],
                      ["unit_price",  "1299.99",      "Yes"],
                      ["cost",        "900.00",       "Yes"],
                      ["discount",    "0.10",         "No (0 if missing)"],
                    ].map(([col, ex, req]) => (
                      <tr key={col}>
                        <td className="py-1.5 font-mono">{col}</td>
                        <td className="py-1.5">{ex}</td>
                        <td className="py-1.5">{req}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ) : (
          /* ── Data loaded: show dashboard ──────────────────── */
          <>
            <section className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                Sales analytics &amp; business intelligence
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {count > 0
                  ? `Analysing ${formatNumber(count)} transactions${
                      dateRange
                        ? ` from ${formatDateLabel(dateRange.start)} to ${formatDateLabel(dateRange.end)}`
                        : ""
                    }.`
                  : summaryLoading
                  ? "Loading data…"
                  : "No transactions match the current filters."}
              </p>
            </section>

            <FilterBar
              filters={filters}
              onChange={handleFiltersChange}
              periodOptions={periodOptions}
              dimensions={dimensions}
            />

            {summaryLoading && !current ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading…" />
              </div>
            ) : count === 0 && !summaryLoading ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
                <SearchX className="size-8 text-muted-foreground" aria-hidden />
                <div>
                  <p className="font-medium">No sales match these filters</p>
                  <p className="text-sm text-muted-foreground">Try widening the period or clearing a filter.</p>
                </div>
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Reset filters
                </Button>
              </div>
            ) : current ? (
              <>
                <KpiCards current={current} previous={previous} />

                <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="flex flex-col gap-4">
                  <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                    <TabsList className="w-max">
                      {TABS.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} className="px-3">
                          <t.icon aria-hidden />
                          {t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="overview">    <OverviewTab    filters={filters} /></TabsContent>
                  <TabsContent value="products">    <ProductsTab    filters={filters} /></TabsContent>
                  <TabsContent value="regions">     <RegionsTab     filters={filters} /></TabsContent>
                  <TabsContent value="customers">   <CustomersTab   filters={filters} /></TabsContent>
                  <TabsContent value="seasonality"> <SeasonalityTab filters={filters} /></TabsContent>
                  <TabsContent value="insights">    <InsightsTab    filters={filters} /></TabsContent>
                </Tabs>
              </>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
