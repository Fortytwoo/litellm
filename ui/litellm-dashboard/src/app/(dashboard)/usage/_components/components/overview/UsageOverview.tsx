"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

/**
 * Usage overview: a stat strip, the Model Leaderboard's stacked chart and
 * tooltip applied to the usage aggregate, then a ranked share list in
 * matching colors.
 */

import { type ReactNode, useMemo, useState } from "react";
import type { DailyData } from "@/components/UsagePage/types";
import { KeyRound } from "lucide-react";
import { StackedUsageChart, type StackedUsageScale } from "@/components/shared/charts";
import {
  bucketSeries,
  bucketTotals,
  labelForDate,
  formatMetricValue,
  type Granularity,
  type OverviewTotals,
  type UsageMetric,
} from "./overviewData";
import { BreakdownControls, Leaderboard, useBreakdown, type BreakdownState } from "./BreakdownChart";
import { cn } from "@/lib/cva.config";
import { ChartSkeleton, Panel, PANEL_INSET_X, Segmented } from "./Primitives";
import UsageStatStrip from "./UsageStatStrip";

interface UsageOverviewProps {
  results: readonly DailyData[];
  totals: OverviewTotals;
  loading: boolean;
  requestCountsPending: boolean;
  budget: number | null;
  topKeys: ReactNode;
  gatewayByEndpoint: ReactNode;
  topAgents: ReactNode;
  providerBreakdown: ReactNode;
}

const METRIC_NOUN: Record<UsageMetric, string> = { spend: "spend", tokens: "tokens", requests: "requests" };
const GRANULARITY_OPTIONS = [
  {
    value: "day",
    get label() {
      return translateUi("ui.b36c2611dcdf");
    },
  },
  {
    value: "week",
    get label() {
      return translateUi("ui.2975132481a7");
    },
  },
] as const satisfies readonly { value: Granularity; label: string }[];
const SCALE_OPTIONS = [
  {
    value: "linear",
    get label() {
      return translateUi("ui.e6950b45d25c2027");
    },
  },
  {
    value: "log",
    get label() {
      return translateUi("ui.21e49eb2b299c9f7");
    },
  },
] as const satisfies readonly { value: StackedUsageScale; label: string }[];

export default function UsageOverview({
  results,
  totals,
  loading,
  requestCountsPending,
  topKeys,
  gatewayByEndpoint,
  topAgents,
  providerBreakdown,
  budget,
}: UsageOverviewProps) {
  const { t: uiT } = useDashboardLanguage();

  const [state, setState] = useState<BreakdownState>({ metric: "spend", dimension: "model_groups" });
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [scale, setScale] = useState<StackedUsageScale>("linear");
  const { series: dailySeries, ranking } = useBreakdown(results, state, 8);
  const series = useMemo(() => bucketSeries(dailySeries, granularity), [dailySeries, granularity]);
  const totalsByBucket = useMemo(() => bucketTotals(series), [series]);
  const format = (value: number) => formatMetricValue(value, state.metric);

  return (
    <div className="grid gap-3">
      <UsageStatStrip
        results={results}
        totals={totals}
        loading={loading}
        requestCountsPending={requestCountsPending}
        budget={budget}
      />

      <Panel
        title={uiT("ui.79489561d9efe32b")}
        subtitle={uiT("ui.0f4a5bf810b445fd", {
          v0: String(granularity === "day" ? uiT("ui.b36c2611dcdf") : uiT("ui.2975132481a7")),
          v1: String(METRIC_NOUN[state.metric]),
        })}
        action={
          <>
            <BreakdownControls state={state} onChange={setState} showDimension={false} />
            <Segmented
              label={uiT("ui.663b1cb2b6b696ff")}
              value={granularity}
              options={GRANULARITY_OPTIONS}
              onChange={setGranularity}
            />
            <Segmented label={uiT("ui.f102986b39effb31")} value={scale} options={SCALE_OPTIONS} onChange={setScale} />
          </>
        }
        bodyClassName="px-0 pt-4 pb-0"
      >
        <div className="px-2 pb-2">
          {loading ? (
            <ChartSkeleton className="mx-3 h-[380px] w-auto" />
          ) : (
            <StackedUsageChart
              data={series.data}
              series={series.keys}
              labels={series.labels}
              colors={series.colors}
              xKey="date"
              xLabel={(date) => labelForDate(series, date)}
              scale={scale}
              format={format}
              totalFor={(date) => totalsByBucket.get(date)}
            />
          )}
        </div>
        <div className={cn("border-t py-2", PANEL_INSET_X)}>
          <Leaderboard
            ranking={ranking}
            series={dailySeries}
            metric={state.metric}
            dimension={state.dimension}
            columns={2}
            limit={10}
          />
        </div>
      </Panel>

      {topAgents}
      {providerBreakdown}

      <Panel icon={KeyRound} title={uiT("ui.4ed9e11cbdc764dc")}>
        {topKeys}
      </Panel>
      {gatewayByEndpoint}
    </div>
  );
}
