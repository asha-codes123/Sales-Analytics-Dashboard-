"use client"

import { useRef, useState } from "react"
import { ChartColumn, Download, FileSpreadsheet, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Filters } from "@/lib/sales/types"
import { CurrencySelector } from "./currency-selector"

type Notice = { tone: "error" | "success"; message: string } | null

type DatasetInfo = {
  name:   string
  source: "sample" | "upload"
  count:  number
}

export function AppHeader({
  dataset,
  filters,
  onUploaded,
  onCleared,
}: {
  dataset:    DatasetInfo
  filters:    Filters
  onUploaded: () => void   // after a successful CSV upload
  onCleared:  () => void   // after dataset is cleared
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [loading, setLoading] = useState(false)

  const hasData = dataset.count > 0

  // ── Upload CSV via API ─────────────────────────────────────
  async function handleFile(file: File) {
    setLoading(true)
    setNotice(null)
    try {
      const form = new FormData()
      form.append("file", file)

      const res  = await fetch("/api/sales/dataset/upload", { method: "POST", body: form })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? "Upload failed")

      const { count, skipped } = json.data as { count: number; skipped: number }
      setNotice({
        tone: "success",
        message: `Loaded ${count.toLocaleString()} rows from "${file.name}"${skipped ? ` (${skipped} invalid rows skipped)` : ""}.`,
      })
      onUploaded()
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "Could not read this file." })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  // ── Clear dataset via API ──────────────────────────────────
  async function handleClear() {
    try {
      await fetch("/api/sales/dataset/reset", { method: "POST" })
      setNotice(null)
      onCleared()
    } catch {
      setNotice({ tone: "error", message: "Could not clear the dataset." })
    }
  }

  // ── Export filtered CSV via API ────────────────────────────
  function handleExport() {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(filters)) {
      if (v && v !== "all") p.set(k, String(v))
    }
    const qs = p.toString() ? `?${p.toString()}` : ""
    window.location.href = `/api/sales/export${qs}`
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">

        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChartColumn className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold">Salescope</p>
            {hasData && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{dataset.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Currency — only visible when data is loaded */}
          {hasData && <CurrencySelector />}

          {/* Clear — only when data is loaded */}
          {hasData && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-negative">
              <Trash2 aria-hidden />
              <span className="hidden sm:inline">Clear data</span>
            </Button>
          )}

          {/* Export — only when data is loaded */}
          {hasData && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download aria-hidden />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}

          {/* Upload — always visible */}
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
            <Upload aria-hidden />
            <span className="hidden sm:inline">{loading ? "Uploading…" : "Upload dataset"}</span>
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Upload a sales CSV file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      </div>

      {/* Notice banner */}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "border-t bg-negative/10 text-negative"
              : "border-t bg-positive/10 text-positive"
          }
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-sm md:px-6">
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded p-1 hover:bg-foreground/5"
              aria-label="Dismiss message"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
