import { t as translateUi } from "@/i18n";
import type { components } from "@/lib/http/schema";

export type AutoRouterBenchmarksResponse = components["schemas"]["AutoRouterBenchmarksResponse"];
export type AutoRouterBenchmarkTotals = components["schemas"]["AutoRouterBenchmarkTotals"];
export type AutoRouterBenchmarkGroup = components["schemas"]["AutoRouterBenchmarkGroup"];
export type AutoRouterCacheStats = components["schemas"]["AutoRouterCacheStats"];

export const ALL_ROUTERS = "__all__";

export interface BenchmarkView {
  label: string;
  stats: AutoRouterBenchmarkTotals | AutoRouterBenchmarkGroup;
}

export const viewGroup = (view: BenchmarkView): AutoRouterBenchmarkGroup | null =>
  "router_name" in view.stats ? view.stats : null;

export const groupKey = (group: AutoRouterBenchmarkGroup): string => `${group.router_name} ${group.router_type}`;

export const groupLabel = (group: AutoRouterBenchmarkGroup, groups: readonly AutoRouterBenchmarkGroup[]): string => {
  const duplicated = groups.some((g) => g !== group && g.router_name === group.router_name);
  return duplicated ? `${group.router_name} (${group.router_type})` : group.router_name;
};

export const viewFor = (data: AutoRouterBenchmarksResponse, selectedKey: string): BenchmarkView => {
  const group = data.groups.find((g) => groupKey(g) === selectedKey);
  if (selectedKey === ALL_ROUTERS || !group) {
    return {
      get label() {
        return translateUi("ui.3570a7a7e8bcd291");
      },
      stats: data.totals,
    };
  }
  return { label: groupLabel(group, data.groups), stats: group };
};

export interface BucketRow {
  key: "same_model" | "first_visit" | "return_to_tier";
  label: string;
  sublabel: string;
  turns: number;
  sharePct: number;
  hitRatePct: number;
  fill: string;
}

export const bucketTurnsTotal = (cache: AutoRouterCacheStats): number =>
  cache.same_model.turns + cache.first_visit.turns + cache.return_to_tier.turns;

const sharePctOf = (turns: number, total: number): number => (total > 0 ? Math.round((100 * turns) / total) : 0);

export const bucketRows = (cache: AutoRouterCacheStats): BucketRow[] => {
  const total = bucketTurnsTotal(cache);
  return [
    {
      key: "same_model",
      get label() {
        return translateUi("ui.d1e70998e906fe2b");
      },
      sublabel: "previous turn → same tier",
      turns: cache.same_model.turns,
      sharePct: sharePctOf(cache.same_model.turns, total),
      hitRatePct: cache.same_model.hit_rate_pct,
      fill: "bg-foreground",
    },
    {
      key: "first_visit",
      get label() {
        return translateUi("ui.f9bf3d594a6be9cd");
      },
      sublabel: "previous turn → a tier not used yet",
      turns: cache.first_visit.turns,
      sharePct: sharePctOf(cache.first_visit.turns, total),
      hitRatePct: cache.first_visit.hit_rate_pct,
      fill: "bg-foreground/30",
    },
    {
      key: "return_to_tier",
      get label() {
        return translateUi("ui.0c63b52178e28f73");
      },
      sublabel: "previous turn → a tier used earlier",
      turns: cache.return_to_tier.turns,
      sharePct: sharePctOf(cache.return_to_tier.turns, total),
      hitRatePct: cache.return_to_tier.hit_rate_pct,
      fill: "bg-foreground/60",
    },
  ];
};

export const expiredMissShare = (cache: AutoRouterCacheStats): number | null => {
  const total = bucketTurnsTotal(cache);
  if (total <= 0) return null;
  return (100 * cache.return_misses_expired) / total;
};

export const pctLabel = (value: number, digits: number = 1): string => `${value.toFixed(digits)}%`;

export const durationLabel = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
};
