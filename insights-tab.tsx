"use client"

import { Loader2, CircleAlert, CircleCheck, Info, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InsightTone, Recommendation } from "@/lib/sales/insights"
import type { Filters } from "@/lib/sales/types"
import { cn } from "@/lib/utils"
import { useInsights } from "@/lib/hooks/use-api"

const TONE: Record<InsightTone, { icon: typeof Info; className: string; label: string }> = {
  positive: { icon: CircleCheck, className: "text-positive bg-positive/10", label: "Positive" },
  negative: { icon: CircleAlert, className: "text-negative bg-negative/10", label: "Needs attention" },
  neutral:  { icon: Info,        className: "text-primary bg-primary/10",   label: "Observation" },
}

const PRIORITY: Record<Recommendation["priority"], string> = {
  High:   "bg-negative/12 text-negative",
  Medium: "bg-chart-3/20 text-foreground",
  Low:    "bg-secondary text-secondary-foreground",
}

export function InsightsTab({ filters }: { filters: Filters }) {
  const { data, isLoading } = useInsights(filters)

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const insights        = data?.insights        ?? []
  const recommendations = data?.recommendations ?? []

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section aria-labelledby="questions-heading" className="flex flex-col gap-3 lg:col-span-2">
        <div>
          <h2 id="questions-heading" className="text-base font-semibold">Business questions answered</h2>
          <p className="text-sm text-muted-foreground">
            Conclusions are generated from the data and update instantly with your filters.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => {
            const tone = TONE[insight.tone]
            return (
              <article key={insight.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{insight.topic}</Badge>
                  <span className={cn("flex size-7 items-center justify-center rounded-full", tone.className)}>
                    <tone.icon className="size-4" aria-hidden />
                    <span className="sr-only">{tone.label}</span>
                  </span>
                </div>
                <h3 className="text-sm leading-snug font-medium text-muted-foreground">{insight.question}</h3>
                <p className="text-xl font-semibold tracking-tight text-balance">{insight.highlight}</p>
                <p className="text-sm leading-relaxed text-pretty">{insight.answer}</p>
              </article>
            )
          })}
        </div>
      </section>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-chart-3" aria-hidden />
            Recommendations
          </CardTitle>
          <CardDescription>Prioritised actions based on the findings</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length ? (
            <ol className="flex flex-col gap-4">
              {recommendations.map((r, i) => (
                <li key={r.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">{r.title}</h3>
                      <Badge variant="secondary" className={cn("border-transparent", PRIORITY[r.priority])}>
                        {r.priority}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No urgent actions — performance looks healthy.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
