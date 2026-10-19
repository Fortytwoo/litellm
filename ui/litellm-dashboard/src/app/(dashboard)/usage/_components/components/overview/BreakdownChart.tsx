"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import React, { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ProviderLogo } from "@/components/molecules/models/ProviderLogo";
import type { DailyData } from "@/components/UsagePage/types";
import { cn } from "@/lib/cva.config";
import {
  formatMetricValue,
  leaderboard,
  OTHER_COLOR,
  rankValue,
  seriesBy,
  type BreakdownDimension,
  type LeaderRow,
  type Series,
  type UsageMetric,
} from "./overviewData";
import { Segmented } from "./Primitives";
import { providerForModel } from "./modelProvider";

const METRIC_OPTIONS = [
  {
    value: "spend",
    get label() {
      return translateUi("ui.85f3d558db12");
    },
  },
  {
    value: "tokens",
    get label() {
      return translateUi("ui.a039dfb9628b");
    },
  },
  {
    value: "requests",
    get label() {
      return translateUi("ui.ada27592c957");
    },
  },
] as const satisfies readonly { value: UsageMetric; label: string }[];

const DIMENSION_OPTIONS = [
  {
    value: "model_groups",
    get label() {
      return translateUi("ui.5e2c614c23f0");
    },
  },
  {
    value: "models",
    get label() {
      return translateUi("ui.870a8ffd98f4f2bd");
    },
  },
  {
    value: "providers",
    get label() {
      return translateUi("ui.472590ae974d");
    },
  },
] as const satisfies readonly { value: BreakdownDimension; label: string }[];

export interface BreakdownState {
  metric: UsageMetric;
  dimension: BreakdownDimension;
}

export const useBreakdown = (results: readonly DailyData[], { metric, dimension }: BreakdownState, top = 6) => {
  const series = useMemo(() => seriesBy(results, dimension, metric, top), [results, dimension, metric, top]);
  const ranking = useMemo(() => leaderboard(results, dimension, metric), [results, dimension, metric]);
  return { series, ranking };
};

export function BreakdownControls({
  state,
  onChange,
  showDimension = true,
}: {
  state: BreakdownState;
  onChange: (next: BreakdownState) => void;
  showDimension?: boolean;
}) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        label={uiT("ui.2d275a74912cca2e")}
        value={state.metric}
        options={METRIC_OPTIONS}
        onChange={(metric) => onChange({ ...state, metric })}
      />
      {showDimension && (
        <Segmented
          label={uiT("ui.956a51f6b098a41b")}
          value={state.dimension}
          options={DIMENSION_OPTIONS}
          onChange={(dimension) => onChange({ ...state, dimension })}
        />
      )}
    </div>
  );
}

/** Provider logo on a soft tile with a series-colored dot, so mixed logo styles still read as a set. */
function ModelMark({ model, color }: { model: string; color: string }) {
  const provider = providerForModel(model);
  return (
    <span className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
      {provider ? (
        <ProviderLogo provider={provider} className="size-4 rounded-[3px]" />
      ) : (
        <span className="text-[11px] font-semibold uppercase text-muted-foreground">{model.charAt(0)}</span>
      )}
      <span
        aria-hidden="true"
        className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-card"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

const DELTA_FLOOR = 0.05;

function Delta({ value }: { value: number | null }) {
  if (value === null || Math.abs(value) < DELTA_FLOOR) {
    return <span className="text-xs tabular-nums text-muted-foreground">—</span>;
  }
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center justify-end gap-0.5 text-xs tabular-nums text-muted-foreground">
      <Icon aria-hidden="true" className="size-3" />
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

/** Ranked share of the selected metric, with the same swatch as the chart segment. */
export function Leaderboard({
  ranking,
  series,
  metric,
  dimension,
  limit = 10,
  columns = 1,
  dense = false,
}: {
  ranking: readonly LeaderRow[];
  series: Series;
  metric: UsageMetric;
  dimension: BreakdownDimension;
  limit?: number;
  columns?: 1 | 2;
  dense?: boolean;
}) {
  const { t: uiT } = useDashboardLanguage();

  const colorOf = (name: string) => {
    const index = series.labels.indexOf(name);
    return index === -1 ? OTHER_COLOR : series.colors[index];
  };
  const value = (row: LeaderRow) => rankValue(row, metric);
  const rows = ranking.slice(0, limit);
  if (rows.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">{uiT("ui.e9366364ec9c0178")}</p>;
  }
  const half = columns === 2 ? Math.ceil(rows.length / 2) : rows.length;
  const groups = columns === 2 ? [rows.slice(0, half), rows.slice(half)] : [rows];
  return (
    <div className={cn("grid gap-x-10", columns === 2 && "md:grid-cols-2")}>
      {groups.map((group, groupIndex) => (
        <ol key={groupIndex} className="divide-y divide-border/60">
          {group.map((row, i) => (
            <li
              key={row.key}
              className={cn(
                "grid grid-cols-[1.25rem_minmax(0,1fr)_auto_3rem] items-center gap-3",
                dense ? "py-1.5" : "py-2.5",
              )}
            >
              <span className="text-xs tabular-nums text-muted-foreground">{groupIndex * half + i + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                {dimension === "providers" ? (
                  <ProviderLogo provider={row.key} className="size-4 shrink-0" />
                ) : (
                  <ModelMark model={row.key} color={colorOf(row.key)} />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{row.key}</span>
                  {providerForModel(row.key) && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {uiT("ui.a7e2d26e8d15814d")} {providerForModel(row.key)}
                    </span>
                  )}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm tabular-nums text-foreground">{row.share.toFixed(1)}%</span>
                {!dense && (
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    {formatMetricValue(value(row), metric)}
                  </span>
                )}
              </span>
              <Delta value={row.delta} />
            </li>
          ))}
        </ol>
      ))}
    </div>
  );
}
