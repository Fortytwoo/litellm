"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";

import type { AutoRouterDeployment } from "@/app/(dashboard)/hooks/models/useModels";
import { useAutoRouters } from "@/app/(dashboard)/hooks/models/useModels";
import AdvancedDatePicker from "@/components/shared/advanced_date_picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/http/client";
import { formatNumberWithCommas } from "@/utils/dataUtils";

import {
  ALL_ROUTERS,
  bucketRows,
  bucketTurnsTotal,
  durationLabel,
  groupKey,
  expiredMissShare,
  groupLabel,
  pctLabel,
  viewFor,
  viewGroup,
  type AutoRouterBenchmarksResponse,
  type AutoRouterCacheStats,
  type BenchmarkView,
  type BucketRow,
} from "./autoRouterBenchmarks";
import { classificationRatePer1kTurns, formatRangeLabel, usd } from "./costOptimizationUtils";
import AutoRouterSummaryTable from "./AutoRouterSummaryTable";
import ShadowEvalSection from "./ShadowEvalSection";
import TierTurnsChart from "./TierTurnsChart";
import { useAutoRouterBenchmarks } from "./useAutoRouterBenchmarks";
import { DailyActivityRange } from "./useDailyActivityRange";

const Message: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
);

const Metric: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <Card size="sm">
    <CardHeader>
      <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-wrap items-baseline gap-2">
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

const SpendRow: React.FC<{ label: string; value: string; hint?: string; subdued?: boolean; tooltip?: string }> = ({
  label,
  value,
  hint,
  subdued,
  tooltip,
}) => (
  <dl className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2">
    <dt className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
      {label}
      {tooltip && <SimpleTooltip content={tooltip} />}
      {hint && <span className="text-xs">{hint}</span>}
    </dt>
    <dd
      className={`min-w-0 break-all tabular-nums ${subdued ? "text-sm font-normal text-muted-foreground" : "text-base font-semibold text-foreground"}`}
    >
      {value}
    </dd>
  </dl>
);

const HeroCard: React.FC<{ view: BenchmarkView }> = ({ view }) => {
  const { t: uiT } = useDashboardLanguage();

  const stats = view.stats;
  const cheaper = stats.saved_pct != null && stats.saved_pct >= 0;
  const classifierCost = stats.baseline_spend == null ? null : stats.savings_estimated_classifier_cost ?? null;
  const comparedAll = stats.savings_estimated_turns === stats.turns;
  return (
    <Card className="overflow-hidden py-0" role="region" aria-label={uiT("ui.2adbb3c2d08d")}>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-2 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {uiT("ui.8c821a8c732be2e4")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="min-w-0 break-all text-center text-4xl font-semibold tracking-tight text-foreground xl:text-6xl">
              {stats.saved_spend == null ? uiT("ui.ca184496974204a0") : usd(stats.saved_spend)}
            </p>
            {stats.saved_pct != null && (
              <Badge
                variant="secondary"
                className={`h-6 px-2.5 text-sm ${cheaper ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
              >
                {stats.saved_pct !== 0 && (cheaper ? "-" : "+")}
                {Math.abs(stats.saved_pct).toFixed(0)}%
              </Badge>
            )}
          </div>
          {stats.baseline_spend != null && !comparedAll && (
            <p className="text-center text-xs text-muted-foreground">
              {uiT("ui.1979cbe28b947352")} {stats.savings_estimated_turns.toLocaleString()} {uiT("ui.28391d3bc64ec15c")}{" "}
              {stats.turns.toLocaleString()} {uiT("ui.e4dfda5cdf3ebc98")}
            </p>
          )}
          {stats.unattributed_saved_spend != null && (
            <p className="text-center text-xs text-muted-foreground">
              {uiT("ui.896a0bba3260ba06")} {usd(Math.abs(stats.unattributed_saved_spend))}
              {uiT("ui.9a910d253bf954c7")}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center border-t p-6 md:border-t-0 md:border-l">
          <SpendRow
            label={uiT("ui.5ed7c1fd4f3b484c")}
            value={stats.baseline_spend == null ? "Unavailable" : usd(stats.savings_estimated_actual_spend)}
            tooltip={uiT("ui.8cd747a1b42943e2")}
          />
          <div className="mb-3 border-l-2 pl-4">
            <SpendRow
              subdued
              label={uiT("ui.6483cbe20cfb9079")}
              value={
                classifierCost == null ? "Unavailable" : usd(stats.savings_estimated_actual_spend - classifierCost)
              }
            />
            <SpendRow
              subdued
              label={uiT("ui.2c7a8ee99452ec97")}
              value={classifierCost == null ? "Unavailable" : usd(classifierCost)}
              hint={
                classifierCost == null
                  ? undefined
                  : classificationRatePer1kTurns(classifierCost, stats.savings_estimated_turns)
              }
            />
          </div>
          {stats.baseline_spend != null && classifierCost == null && (
            <p className="mb-3 text-xs text-muted-foreground">{uiT("ui.76176c5496e8ee6f")}</p>
          )}
          <Separator />
          <SpendRow
            label={uiT("ui.2df9eb381d48272f")}
            value={stats.baseline_spend == null ? "Unavailable" : usd(stats.baseline_spend)}
          />
        </div>
      </div>
    </Card>
  );
};

const StackedTurnBar: React.FC<{ buckets: BucketRow[] }> = ({ buckets }) => {
  const { t: uiT } = useDashboardLanguage();

  const segments = buckets.filter((b) => b.turns > 0);
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sm ${segments.length === 0 ? "bg-muted" : ""}`}
        role="img"
        aria-label={uiT("ui.059ac0cef2ac176b")}
      >
        {segments.map((b) => (
          <div
            key={b.key}
            className={`${b.fill} first:rounded-l-sm last:rounded-r-sm`}
            style={{ width: `${b.sharePct}%` }}
            title={uiT("ui.37c56248b5864275", { v0: String(b.label), v1: String(b.turns.toLocaleString()) })}
          />
        ))}
      </div>
      <div className="flex w-full gap-0.5 text-[11px] text-muted-foreground">
        {segments.map((b) => (
          <span key={b.key} className="whitespace-nowrap" style={{ width: `${b.sharePct}%` }}>
            {b.sharePct}%
          </span>
        ))}
      </div>
    </div>
  );
};

const BucketTable: React.FC<{ buckets: BucketRow[] }> = ({ buckets }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <Table className="border-b">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-[11px] uppercase tracking-wide">{uiT("ui.c83b65791b5b42ce")}</TableHead>
          <TableHead className="text-right text-[11px] uppercase tracking-wide">{uiT("ui.53cf0c9bbf40a04a")}</TableHead>
          <TableHead className="w-1/2" />
          <TableHead className="text-right text-[11px] uppercase tracking-wide">{uiT("ui.8cfb8dd7cd666f74")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buckets.map((b) => (
          <TableRow key={b.key} className="hover:bg-transparent">
            <TableCell className="text-foreground">
              <span className="flex items-center gap-2">
                <span className={`inline-block size-2 shrink-0 rounded-sm ${b.fill}`} aria-hidden />
                <span>
                  {b.label}
                  <span className="block text-xs font-normal text-muted-foreground">{b.sublabel}</span>
                </span>
              </span>
            </TableCell>
            <TableCell className="text-right align-middle tabular-nums text-foreground">
              {b.turns.toLocaleString()}
            </TableCell>
            <TableCell className="align-middle">
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${b.hitRatePct}%` }} aria-hidden />
              </div>
            </TableCell>
            <TableCell className="text-right align-middle font-medium tabular-nums text-foreground">
              {pctLabel(b.hitRatePct)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const CachingCard: React.FC<{ cache: AutoRouterCacheStats }> = ({ cache }) => {
  const { t: uiT } = useDashboardLanguage();

  const buckets = bucketRows(cache);
  const total = bucketTurnsTotal(cache);
  const expiredMissPct = expiredMissShare(cache);
  return (
    <Card className="overflow-hidden py-0">
      <div className="grid lg:grid-cols-[1fr_3fr]">
        <div className="flex flex-col border-b p-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-1 flex-col justify-center gap-3">
            <p className="text-sm text-muted-foreground">{uiT("ui.a394d2c9753144e7")}</p>
            <p className="text-5xl font-semibold tracking-tight text-foreground">{pctLabel(cache.hit_rate_pct)}</p>
          </div>
          {expiredMissPct === null ? null : (
            <TooltipProvider delay={200}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="flex w-full cursor-default items-baseline justify-between gap-2 border-t pt-3 text-left"
                    />
                  }
                >
                  <span className="text-sm text-muted-foreground underline decoration-dotted underline-offset-2">
                    {uiT("ui.3710d369173d5730")}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{pctLabel(expiredMissPct)}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{uiT("ui.ded41fbbb8fb46eb")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex flex-col gap-3 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{uiT("ui.3f804a0849bf68f9")}</p>
            <p className="text-xs text-muted-foreground">
              <span className="text-lg font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span>{" "}
              {uiT("ui.49d9923fcb1abd7a")}
            </p>
          </div>
          <StackedTurnBar buckets={buckets} />
          <BucketTable buckets={buckets} />
          {cache.unordered_turns > 0 && (
            <p className="text-xs text-muted-foreground">
              {cache.unordered_turns.toLocaleString()} {uiT("ui.aaa19f2a9e58f0d2")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

interface BenchmarksBodyProps {
  isPending: boolean;
  error: unknown;
  data: AutoRouterBenchmarksResponse | undefined;
  selectedKey: string;
  autoRouters: readonly AutoRouterDeployment[];
}

const BenchmarksBody: React.FC<BenchmarksBodyProps> = ({ isPending, error, data, selectedKey, autoRouters }) => {
  const { t: uiT } = useDashboardLanguage();

  if (isPending) return <Message>{uiT("ui.5d4a4e2856667de5")}</Message>;
  if (error instanceof ApiError && error.status === 403) {
    return <Message>{uiT("ui.b35dc250b7a358f7")}</Message>;
  }
  if (error || !data) return <Message>{uiT("ui.47c6dbbce2a7d0b0")}</Message>;

  const view = viewFor(data, selectedKey);
  const stats = view.stats;
  return (
    <>
      <HeroCard view={view} />

      <TierTurnsChart view={view} autoRouters={autoRouters} />

      <p className="text-xs text-muted-foreground">{uiT("ui.a73db77f0798caa3")}</p>

      <p className="text-xs text-muted-foreground">{uiT("ui.2489e6110c83f0af")}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric
          label={uiT("ui.4be42ba527d2db56")}
          value={stats.avg_turns_per_session == null ? "Unavailable" : stats.avg_turns_per_session.toFixed(1)}
          hint={uiT("ui.acb9d2709dd020d9", { v0: String(stats.sessions.toLocaleString()) })}
        />
        <Metric
          label={uiT("ui.9efbfe48a9c826f7")}
          value={stats.avg_session_seconds == null ? "Unavailable" : durationLabel(stats.avg_session_seconds)}
        />
        <Metric
          label={uiT("ui.754a4483a2e5a2d4")}
          value={
            stats.avg_tokens_per_session == null
              ? "Unavailable"
              : formatNumberWithCommas(stats.avg_tokens_per_session, 1, true)
          }
        />
      </div>

      <AutoRouterSummaryTable groups={data.groups} selectedGroup={viewGroup(view)} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-lg font-semibold text-foreground">{uiT("ui.2f68121b46f419fa")}</h3>
          <p className="text-xs text-muted-foreground">{uiT("ui.f5d5438c6ffc23ce")}</p>
        </div>
        <CachingCard cache={stats.cache} />
      </div>
    </>
  );
};

interface AutoRouterBenchmarksTabProps {
  accessToken: string | null;
  activity: Pick<DailyActivityRange, "dateValue" | "onDateChange">;
  apiKey?: string;
  userId?: string;
}

export const AutoRouterUsageView: React.FC<AutoRouterBenchmarksTabProps> = ({
  accessToken,
  activity,
  apiKey,
  userId,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const { dateValue, onDateChange } = activity;
  const { data, isPending, error } = useAutoRouterBenchmarks(accessToken, dateValue, apiKey, userId);
  const [selectedKey, setSelectedKey] = useState<string>(ALL_ROUTERS);
  const { data: autoRouters } = useAutoRouters();

  const groups = data?.groups ?? [];
  const selectedLabel = data ? viewFor(data, selectedKey).label : "All auto-routers";
  const rangeLabel = formatRangeLabel(dateValue.from, dateValue.to);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{uiT("ui.88d5aa106c3e")}</h2>
          {rangeLabel && (
            <p className="mt-1 text-sm text-muted-foreground">
              {rangeLabel} {uiT("ui.ad7185ef7762590b")}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <AdvancedDatePicker value={dateValue} onValueChange={onDateChange} />
          <div className="w-full sm:w-64">
            <Select value={selectedKey} onValueChange={(value: string | null) => setSelectedKey(value ?? ALL_ROUTERS)}>
              <SelectTrigger className="w-full">
                <SelectValue>{translateText(selectedLabel)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROUTERS}>{uiT("ui.3570a7a7e8bcd291")}</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={groupKey(g)} value={groupKey(g)}>
                    {groupLabel(g, groups)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {userId && <p className="text-sm text-muted-foreground">{uiT("ui.39b6026a039bb2f8")}</p>}
      <BenchmarksBody
        isPending={isPending}
        error={error}
        data={data}
        selectedKey={selectedKey}
        autoRouters={autoRouters ?? []}
      />
    </div>
  );
};

const AutoRouterBenchmarksTab: React.FC<AutoRouterBenchmarksTabProps> = ({ accessToken, activity }) => {
  const { t: uiT } = useDashboardLanguage();

  const [visitedTabs, setVisitedTabs] = useState<readonly string[]>(["usage"]);

  const handleTabChange = (value: unknown) => {
    if (typeof value !== "string") {
      return;
    }

    setVisitedTabs((currentTabs) => (currentTabs.includes(value) ? currentTabs : [...currentTabs, value]));
  };

  return (
    <Tabs defaultValue="usage" onValueChange={handleTabChange} className="w-full gap-4">
      <TabsList>
        <TabsTrigger value="usage" className="px-3">
          {uiT("ui.8d59829c1e15")}
        </TabsTrigger>
        <TabsTrigger value="shadow-evals" className="px-3">
          {uiT("ui.2cb05e21b328d11b")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="usage" keepMounted={visitedTabs.includes("usage")}>
        <AutoRouterUsageView accessToken={accessToken} activity={activity} />
      </TabsContent>
      <TabsContent value="shadow-evals" keepMounted={visitedTabs.includes("shadow-evals")}>
        <ShadowEvalSection />
      </TabsContent>
    </Tabs>
  );
};

export default AutoRouterBenchmarksTab;
