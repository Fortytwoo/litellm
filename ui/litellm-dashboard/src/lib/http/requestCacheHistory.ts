import { z } from "zod";
import { ApiError } from "./client";
import { gateway } from "./managedGateway";
import { readRequestCache, type RequestCacheReport } from "./requestCache";

export const cacheWindows = ["24h", "7d", "30d"] as const;
export type CacheWindow = (typeof cacheWindows)[number];
const timestamp = z.string().datetime({ offset: true });
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable();
const counterFields = { hit: count, miss: count, bypass: count, coalesced: count, error: count };
const counters = z.object(counterFields).readonly();
const ratio = z.number().min(0).max(1).nullable();
const pointFields = {
  timestamp,
  entries: count,
  bytes: count,
  inventory_coverage: z.enum(["complete", "tracked_only", "unavailable"]),
  counters: counters.nullable(),
  hit_ratio: ratio,
};
const point = z.object(pointFields).readonly();
const seriesFields = {
  platform: z.enum(["yuntu", "feigua"]),
  first_sample_at: timestamp.nullable(),
  last_sample_at: timestamp.nullable(),
  observed_seconds: z.number().int().nonnegative(),
  counters: counters.nullable(),
  hit_ratio: ratio,
  points: z.array(point).max(720),
};
const series = z.object(seriesFields).readonly();
const historyFields = {
  schema_version: z.literal(1),
  status: z.enum(["available", "unavailable", "not_configured", "restricted"]),
  scope: z.enum(["runtime_process", "restricted"]),
  window: z.enum(cacheWindows),
  generated_at: timestamp,
  sample_seconds: z.literal(60),
  retention_days: z.literal(30),
  bucket_seconds: z.number().int().min(60).max(3600),
  start_at: timestamp,
  end_at: timestamp,
  series: z.array(series).max(2),
};
export const cacheHistorySchema = z
  .object(historyFields)
  .readonly()
  .refine((value) => new Set(value.series.map((item) => item.platform)).size === value.series.length);
export type CacheHistory = z.infer<typeof cacheHistorySchema>;
export type CacheHistorySeries = z.infer<typeof series>;
export type CacheHistoryPoint = z.infer<typeof point>;
export type CacheView = RequestCacheReport & Readonly<{ history: CacheHistory | null; historyFailed: boolean }>;

function scopedView(view: CacheView): CacheView {
  const restricted =
    view.history?.scope === "restricted" ||
    view.history?.status === "restricted" ||
    view.runtimes.some((runtime) => runtime.metadata?.metrics.scope === "restricted");
  if (!restricted) return view;
  const runtimes = view.runtimes.map((runtime) => ({
    ...runtime,
    metadata: runtime.metadata
      ? {
          ...runtime.metadata,
          policies: runtime.metadata.policies.map((policy) => ({ ...policy, counters: null })),
          metrics: {
            ...runtime.metadata.metrics,
            scope: "restricted",
            counters: null,
            hit_ratio: null,
            source_requests: null,
            tool_calls: null,
          },
          memory: null,
          inventory: null,
        }
      : null,
  }));
  return {
    ...view,
    runtimes,
    history: view.history ? { ...view.history, status: "restricted", scope: "restricted", series: [] } : null,
  };
}

export function cacheHistoryIsStale(history: CacheHistory): boolean {
  return history.series.some(
    (item) =>
      item.last_sample_at !== null &&
      Date.parse(history.generated_at) - Date.parse(item.last_sample_at) > history.sample_seconds * 2000,
  );
}

export async function readCacheHistory(window: CacheWindow, signal?: AbortSignal): Promise<CacheHistory> {
  const value = cacheHistorySchema.parse(await gateway("request-cache-history", { query: { window }, signal }));
  if (value.window !== window) throw new Error("Unexpected cache history window");
  return value;
}

export async function readCacheView(window: CacheWindow, signal?: AbortSignal): Promise<CacheView> {
  const [report, historical] = await Promise.all([
    readRequestCache(signal),
    readCacheHistory(window, signal).then(
      (history) => ({ history, historyFailed: false }),
      (error: unknown) => {
        if (error instanceof ApiError && [401, 403].includes(error.status)) throw error;
        return { history: null, historyFailed: true };
      },
    ),
  ]);
  return scopedView({ ...report, ...historical });
}

export type CacheChartMetric = "entries" | "hit" | "hit_ratio";
export function cacheChartRows(series: readonly CacheHistorySeries[], metric: CacheChartMetric) {
  const maps = new Map(series.map((item) => [item.platform, new Map(item.points.map((row) => [row.timestamp, row]))]));
  const timestamps = [...new Set(series.flatMap((item) => item.points.map((row) => row.timestamp)))].sort();
  const value = (row: CacheHistoryPoint | undefined): number | null => {
    if (!row) return null;
    if (metric === "hit") return row.counters?.hit ?? null;
    if (metric === "hit_ratio") return row.hit_ratio === null ? null : row.hit_ratio * 100;
    return row.inventory_coverage === "unavailable" ? null : row.entries;
  };
  return timestamps.map((at) => ({
    timestamp: Date.parse(at),
    yuntu: value(maps.get("yuntu")?.get(at)),
    feigua: value(maps.get("feigua")?.get(at)),
  }));
}
