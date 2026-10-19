"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useMemo } from "react";
import type { DailyData } from "@/components/UsagePage/types";
import { cn } from "@/lib/cva.config";
import { dailyTotals, formatCompact, formatLatency, formatUsd, type OverviewTotals } from "./overviewData";
import { PANEL_INSET_X, Sparkline, Stat } from "./Primitives";

const BRAND = "#2b3fd6";

interface UsageStatStripProps {
  results: readonly DailyData[];
  totals: OverviewTotals;
  loading: boolean;
  requestCountsPending: boolean;
  budget: number | null;
}

/** Spend, requests, tokens and averages for a range, each with a daily sparkline. */
export default function UsageStatStrip({
  results,
  totals,
  loading,
  requestCountsPending,
  budget,
}: UsageStatStripProps) {
  const { t: uiT } = useDashboardLanguage();

  const daily = useMemo(() => dailyTotals(results), [results]);
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl border bg-card sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
      <StatCell trend={<Sparkline data={daily} dataKey="spend" color={BRAND} className="h-14" />}>
        <Stat
          label={uiT("ui.85f3d558db12")}
          value={formatUsd(totals.spend)}
          pending={loading}
          hint={budget ? uiT("ui.e8edc4e854cb6331", { v0: String(formatUsd(budget)) }) : uiT("ui.cc4c45f5d01ec1d9")}
        />
      </StatCell>
      <StatCell trend={<Sparkline data={daily} dataKey="requests" color={BRAND} className="h-14" />}>
        <Stat label={uiT("ui.37e751d178cb")} value={totals.requests.toLocaleString()} pending={requestCountsPending} />
        {!requestCountsPending && (
          <div className="mt-0.5 flex gap-3 text-xs leading-4 text-muted-foreground">
            <span>
              <span className="text-success tabular-nums">{totals.successful.toLocaleString()}</span> ok
            </span>
            <span>
              <span className={totals.failed > 0 ? "text-destructive tabular-nums" : "tabular-nums"}>
                {totals.failed.toLocaleString()}
              </span>{" "}
              {uiT("ui.5d28a90f4498a814")}
            </span>
          </div>
        )}
      </StatCell>
      <StatCell trend={<Sparkline data={daily} dataKey="tokens" color={BRAND} className="h-14" />}>
        <Stat
          label={uiT("ui.cd41bf0d3e9a")}
          value={loading ? null : formatCompact(totals.tokens)}
          exact={`${totals.tokens.toLocaleString()} tokens`}
          pending={loading}
          hint={loading ? undefined : uiT("ui.2dcc56c476170e54", { v0: String(formatCompact(totals.cacheReadTokens)) })}
        />
      </StatCell>
      <StatCell>
        <div className="grid gap-3">
          <Stat label={uiT("ui.1bb3d5ae09fcc35e")} value={formatUsd(totals.avgCostPerRequest, 4)} pending={loading} />
          <Stat
            label={uiT("ui.a6ec096b853f735f")}
            value={totals.avgLatencyMs === null ? "—" : formatLatency(totals.avgLatencyMs)}
            pending={loading}
            hint={
              totals.successRate === null
                ? undefined
                : uiT("ui.fdf4d7162f129ebc", { v0: String(totals.successRate.toFixed(1)) })
            }
          />
        </div>
      </StatCell>
    </div>
  );
}

function StatCell({ children, trend }: { children: React.ReactNode; trend?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-between gap-3 border-b py-4 last:border-b-0 lg:border-b-0",
        PANEL_INSET_X,
      )}
    >
      <div className="min-w-0">{children}</div>
      {trend}
    </div>
  );
}
