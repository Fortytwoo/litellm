"use client";

import dynamic from "next/dynamic";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditTime } from "@/lib/http/managedGateway";
import { cacheHistoryIsStale, type CacheView, type CacheWindow } from "@/lib/http/requestCacheHistory";
import { useCopy, type CopyKey } from "./locale";

const Charts = dynamic(() => import("./RequestCacheCharts"), { ssr: false });
const platforms = ["all", "yuntu", "feigua"] as const;
const platformParser = parseAsStringLiteral(platforms).withDefault("all");
const keys = [
  ["hit", "cacheRecordedHits"],
  ["miss", "cacheMiss"],
  ["bypass", "cacheBypass"],
  ["coalesced", "cacheCoalesced"],
  ["error", "cacheErrors"],
] as const;

function historyNotice(history: CacheView["history"], failed: boolean, stale: boolean): CopyKey | null {
  if (failed || history?.status === "unavailable") return "cacheHistoryFailure";
  if (history?.status === "not_configured") return "cacheHistoryNotConfigured";
  if (stale || (history && cacheHistoryIsStale(history))) return "cacheHistoryStale";
  return null;
}

export function RequestCacheOverview({
  report,
  window,
  onWindow,
  stale,
}: {
  report: CacheView;
  window: CacheWindow;
  onWindow: (window: CacheWindow) => void;
  stale: boolean;
}) {
  const t = useCopy();
  const [platform, setPlatform] = useQueryState("cachePlatform", platformParser);
  const history = report.history;
  const restricted =
    history?.scope === "restricted" ||
    history?.status === "restricted" ||
    report.runtimes.some((runtime) => runtime.metadata?.metrics.scope === "restricted");
  if (restricted) return <p className="text-sm text-muted-foreground">{t("cacheHistoryRestricted")}</p>;
  const visible = report.runtimes.filter((runtime) => platform === "all" || runtime.platform === platform);
  const series =
    history?.status === "available" && history.scope === "runtime_process"
      ? history.series.filter((item) => visible.some((runtime) => runtime.platform === item.platform))
      : [];
  const windows = [
    { value: "24h", label: t("cacheWindow24h") },
    { value: "7d", label: t("cacheWindow7d") },
    { value: "30d", label: t("cacheWindow30d") },
  ];
  const choices = [
    { value: "all", label: t("cacheAllPlatforms") },
    { value: "yuntu", label: t("yuntu") },
    { value: "feigua", label: t("cacheFeigua") },
  ];
  const number = (value: number | null | undefined) => (value == null ? t("cacheUnknown") : value.toLocaleString());
  const percent = (value: number | null | undefined) =>
    value == null ? t("cacheUnknown") : `${(value * 100).toFixed(1)}%`;
  const size = (value: number | null | undefined) => {
    if (value == null) return t("cacheUnknown");
    if (value < 1024) return `${value} B`;
    const exponent = Math.min(Math.floor(Math.log2(value) / 10), 3);
    return `${(value / 1024 ** exponent).toFixed(1)} ${["B", "KiB", "MiB", "GiB"][exponent]}`;
  };
  const notice = historyNotice(history, report.historyFailed, stale);
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="cache-overview-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="cache-overview-title" className="text-lg font-semibold">
            {t("cacheOverview")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cacheHistoryCadence")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Field className="w-40">
            <FieldLabel htmlFor="cache-trend-platform">{t("cacheTrendPlatform")}</FieldLabel>
            <Select
              items={choices}
              value={platform}
              onValueChange={(value) => {
                void setPlatform(value === "yuntu" || value === "feigua" ? value : "all");
              }}
            >
              <SelectTrigger id="cache-trend-platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {choices.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-40">
            <FieldLabel htmlFor="cache-trend-window">{t("cacheTrendWindow")}</FieldLabel>
            <Select
              items={windows}
              value={window}
              onValueChange={(value) => onWindow(value === "7d" || value === "30d" ? value : "24h")}
            >
              <SelectTrigger id="cache-trend-window" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {windows.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      {notice && (
        <Alert role="status">
          <AlertDescription>{t(notice)}</AlertDescription>
        </Alert>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {visible.map((runtime) => {
          const summary = series.find((item) => item.platform === runtime.platform);
          const inventory = runtime.metadata?.inventory;
          const current = inventory?.coverage === "unavailable" ? null : inventory;
          return (
            <Card
              key={runtime.platform}
              className="min-w-0"
              role="region"
              aria-label={`${t(runtime.platform === "yuntu" ? "yuntu" : "cacheFeigua")} ${t("cacheOverview")}`}
            >
              <CardHeader>
                <CardTitle className="text-base">{t(runtime.platform === "yuntu" ? "yuntu" : "cacheFeigua")}</CardTitle>
                <CardDescription>
                  {t("cacheLastHistorySample")}:{" "}
                  {summary?.last_sample_at ? auditTime(summary.last_sample_at) : t("cacheNotCollected")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">{t("cacheActiveEntries")}</dt>
                    <dd className="text-2xl font-semibold tabular-nums">{number(current?.entries)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t("cacheStoredBytes")}</dt>
                    <dd className="text-2xl font-semibold tabular-nums">{size(current?.bytes)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{t("cacheSampledRatio")}</dt>
                    <dd className="text-2xl font-semibold tabular-nums">{percent(summary?.hit_ratio)}</dd>
                  </div>
                  {keys.map(([key, label]) => (
                    <div key={key}>
                      <dt className="text-sm text-muted-foreground">{t(label)}</dt>
                      <dd className="text-xl font-semibold tabular-nums">{number(summary?.counters?.[key])}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-sm text-muted-foreground">{t("cacheObservedMinutes")}</dt>
                    <dd className="text-xl font-semibold tabular-nums">
                      {summary ? number(summary.observed_seconds / 60) : t("cacheUnknown")}
                    </dd>
                  </div>
                </dl>
                {current?.coverage === "tracked_only" && (
                  <Badge variant="secondary" className="mt-4">
                    {t("cacheTrackedOnly")}
                  </Badge>
                )}
                <p className="mt-3 text-xs text-muted-foreground">{t("cacheInventoryHelp")}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {series.some((item) => item.last_sample_at !== null) ? (
        <>
          <Charts series={series} bucketSeconds={history?.bucket_seconds ?? 300} />
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">{t("cacheRecentSamples")}</summary>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {(
                      ["cachePlatform", "time", "cacheActiveEntries", "cacheHit", "cacheMiss", "cacheHitRatio"] as const
                    ).map((key) => (
                      <TableHead key={key}>{t(key)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {series.flatMap((item) =>
                    item.points.slice(-12).map((point) => (
                      <TableRow key={`${item.platform}-${point.timestamp}`}>
                        <TableCell>{t(item.platform === "yuntu" ? "yuntu" : "cacheFeigua")}</TableCell>
                        <TableCell className="whitespace-nowrap">{auditTime(point.timestamp)}</TableCell>
                        <TableCell>
                          {number(point.inventory_coverage === "unavailable" ? null : point.entries)}
                        </TableCell>
                        <TableCell>{number(point.counters?.hit)}</TableCell>
                        <TableCell>{number(point.counters?.miss)}</TableCell>
                        <TableCell>{percent(point.hit_ratio)}</TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </div>
          </details>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("cacheHistoryEmpty")}</p>
      )}
      <p className="text-xs text-muted-foreground">{t("cacheTrendHelp")}</p>
    </section>
  );
}
