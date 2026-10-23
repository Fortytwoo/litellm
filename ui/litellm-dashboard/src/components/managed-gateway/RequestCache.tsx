"use client";

import { useState, type ReactNode } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/http/client";
import { auditTime, str } from "@/lib/http/managedGateway";
import {
  filterRequestCachePolicies,
  currentCacheSelection,
  readRequestCache,
  requestCachePolicies,
  runtimeIsStale,
  type RequestCacheSelection,
  type RequestCacheReport,
  type RequestCacheRuntime,
  type RequestCacheToolRule,
} from "@/lib/http/requestCache";
import { Modal, Notice, useGateway } from "./Shared";
import { useCopy, type CopyKey } from "./locale";

type Copy = ReturnType<typeof useCopy>;
type PlatformFilter = "all" | "yuntu" | "feigua";
type StateFilter = "all" | "enabled" | "disabled" | "stale";
const metrics = [
  ["hit", "cacheHit"],
  ["miss", "cacheMiss"],
  ["bypass", "cacheBypass"],
  ["coalesced", "cacheCoalesced"],
  ["error", "cacheErrors"],
] as const;
const reasonLabels: Readonly<Record<string, CopyKey>> = {
  timeout: "cacheTimeout",
  unreachable: "cacheUnreachable",
  status_not_supported: "cacheUnsupported",
  unsupported_transport: "cacheUnsupported",
  runtime_not_configured: "cacheNotConfigured",
  ambiguous_runtime: "cacheAmbiguous",
};
const kindLabels: Readonly<Record<RequestCacheToolRule["kind"], CopyKey>> = {
  http_request: "cacheHttp",
  local_dictionary: "cacheDictionary",
  saved_snapshot: "cacheSnapshot",
  not_cached: "cacheNoRaw",
};

const numberText = (value: number | null | undefined, t: Copy) =>
  value == null ? t("cacheNotCollected") : value.toLocaleString();
const timeText = (value: string | null | undefined, t: Copy) => (value ? auditTime(value) : t("cacheUnknown"));
function ttlText(value: number | null, t: Copy): string {
  if (value === null) return t("cacheUnknown");
  if (value % 3600 === 0) return `${value / 3600} ${t("cacheHours")}`;
  return `${value} ${t("cacheSeconds")}`;
}
const platformText = (value: "yuntu" | "feigua", t: Copy) => t(value === "yuntu" ? "yuntu" : "cacheFeigua");
function runtimeBadge(runtime: RequestCacheRuntime, stale: boolean): CopyKey {
  if (stale) return "cacheStale";
  return runtime.availability === "available" ? "cacheReadable" : "cacheUnavailable";
}
function backendText(backend: string, t: Copy): string {
  if (backend === "redis") return "Redis";
  if (backend === "memory") return "Memory";
  return t("cacheUnknown");
}
function readyText(ready: boolean | null, t: Copy): string {
  if (ready === null) return t("cacheUnknown");
  return t(ready ? "cacheReady" : "cacheNotReady");
}
const configurationLabels = {
  configured: "cacheConfigReady",
  disabled: "cacheConfigDisabled",
  misconfigured: "cacheConfigMissing",
} as const;
function permissionFailure(error: Error | null): boolean {
  return error instanceof ApiError && [401, 403].includes(error.status);
}
function reportStale(report: RequestCacheReport | undefined, failed: boolean): boolean {
  if (failed) return true;
  return report?.runtimes.some((runtime) => runtimeIsStale(runtime, report.stale_after_seconds)) ?? false;
}
function reportNotice(report: RequestCacheReport | undefined, failed: boolean, stale: boolean): CopyKey {
  if (failed) return report ? "cacheRetained" : "cacheUnavailable";
  if (report?.status !== "available" || stale) return "cachePartial";
  return "cacheReadable";
}
function ruleLifetime(rule: RequestCacheToolRule, t: Copy): string {
  switch (rule.kind) {
    case "local_dictionary": {
      if (rule.enabled === null) return `${ttlText(rule.ttl_seconds, t)} · ${t("cacheUnknown")}`;
      return `${ttlText(rule.ttl_seconds, t)} · ${t(rule.enabled ? "cacheConfigEnabled" : "cacheConfigDisabled")}`;
    }
    case "saved_snapshot":
      return t("cacheIndependentExpiry");
    case "not_cached":
      return t("cacheNoRaw");
    default:
      return t("cacheRules");
  }
}

function Value({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function RuntimeCard({ runtime, stale }: { runtime: RequestCacheRuntime; stale: boolean }) {
  const t = useCopy();
  const data = runtime.metadata;
  const fullScope = data?.metrics.scope === "runtime_process";
  const counters = fullScope ? data.metrics.counters : null;
  const memory = fullScope ? data?.memory : null;
  const state = runtimeBadge(runtime, stale);
  return (
    <Card role="region" aria-label={platformText(runtime.platform, t)}>
      <CardHeader>
        <CardTitle>{platformText(runtime.platform, t)}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{t(state)}</Badge>
        </CardAction>
        <CardDescription>
          {runtime.reason ? t(reasonLabels[runtime.reason] ?? "cacheUnavailable") : t("cacheProcessWindow")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!data ? (
          <p>{t("cacheNoData")}</p>
        ) : (
          <>
            <dl className="grid grid-cols-[minmax(100px,0.8fr)_minmax(0,1.4fr)] gap-x-4 gap-y-2 text-sm">
              <Value label={t("cacheConfiguration")}>
                {t(data.enabled ? "cacheConfigEnabled" : "cacheConfigDisabled")}
              </Value>
              <Value label={t("status")}>{t(configurationLabels[data.effective_state])}</Value>
              <Value label={t("cacheBackend")}>{backendText(data.backend, t)}</Value>
              <Value label={t("cacheHealth")}>
                {t(data.backend_health === "not_checked" ? "cacheNotChecked" : "cacheUnknown")}
              </Value>
              <Value label={t("cacheRuntimeReady")}>{readyText(runtime.runtime_ready, t)}</Value>
              <Value label={t("cacheRelease")}>
                {data.release.release_version}
                {data.release.source_commit
                  ? ` · ${data.release.source_commit.slice(0, 12)}`
                  : ` · SHA ${t("cacheUnknown")}`}
              </Value>
              <Value label={t("cacheActiveRules")}>
                {data.policies.filter((policy) => policy.enabled).length} / {data.policies.length}
              </Value>
              <Value label={t("cacheSampledAt")}>{timeText(data.sampled_at, t)}</Value>
              <Value label={t("cacheLastSuccess")}>{timeText(runtime.last_success_at, t)}</Value>
              <Value label={t("cacheWindowStart")}>{timeText(data.metrics.started_at, t)}</Value>
            </dl>
            <dl className="grid grid-cols-3 gap-4 border-t pt-4 text-sm">
              {metrics.map(([key, label]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-muted-foreground">{t(label)}</dt>
                  <dd className="break-words text-xl font-semibold tabular-nums">{numberText(counters?.[key], t)}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground">{t("cacheHitRatio")}</dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {fullScope && data.metrics.hit_ratio !== null ? `${(data.metrics.hit_ratio * 100).toFixed(1)}%` : "—"}
                </dd>
              </div>
            </dl>
            <dl className="grid grid-cols-[minmax(100px,0.8fr)_minmax(0,1.4fr)] gap-x-4 gap-y-2 text-sm">
              <Value label={t("cacheOriginRequests")}>
                {numberText(fullScope ? data.metrics.source_requests : null, t)}
              </Value>
              <Value label={t("cacheToolCalls")}>{numberText(fullScope ? data.metrics.tool_calls : null, t)}</Value>
              {memory && (
                <Value label={t("cacheMemory")}>
                  {numberText(memory.entries, t)} / {numberText(memory.max_entries, t)}; {numberText(memory.bytes, t)} /{" "}
                  {numberText(memory.max_bytes, t)} bytes
                </Value>
              )}
              {data.backend === "redis" && <Value label={t("cacheRedisMetrics")}>{t("cacheNotCollected")}</Value>}
            </dl>
          </>
        )}
      </CardContent>
      {data && !fullScope && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">{t("cacheScopeHelp")}</p>
        </CardFooter>
      )}
    </Card>
  );
}

export function RequestCache() {
  const t = useCopy();
  const { me, snapshot } = useGateway();
  const subject = str(me.subject);
  const options: UseQueryOptions<RequestCacheReport> = {
    queryKey: ["gateway", "request-cache", subject, str(snapshot.revision)],
    queryFn: ({ signal }) => readRequestCache(signal),
    enabled: Boolean(subject),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    structuralSharing: false,
    refetchInterval: (state) =>
      state.state.error instanceof ApiError && [401, 403].includes(state.state.error.status)
        ? false
        : (state.state.data?.poll_seconds ?? 45) * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  };
  const query = useQuery(options);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const platforms = [
    { value: "all", label: t("cacheAllPlatforms") },
    { value: "yuntu", label: t("yuntu") },
    { value: "feigua", label: t("cacheFeigua") },
  ];
  const states = [
    { value: "all", label: t("cacheAllStates") },
    { value: "enabled", label: t("cacheConfigEnabled") },
    { value: "disabled", label: t("cacheConfigDisabled") },
    { value: "stale", label: t("cacheStale") },
  ];
  const [selection, setSelection] = useState<RequestCacheSelection | null>(null);
  const denied = permissionFailure(query.error);
  const report = denied ? undefined : query.data;
  const failed = query.isError;
  const policies = requestCachePolicies(report);
  const filtered = filterRequestCachePolicies(report, { platform, query: search, state }, failed);
  const selected = currentCacheSelection(selection, report, { subject, fetching: query.isFetching, failed });
  const rules = report?.runtimes.flatMap((runtime) => runtime.metadata?.tool_rules ?? []) ?? [];
  const hasCatalog = report?.runtimes.some((runtime) => runtime.metadata !== null);
  const stale = reportStale(report, failed);
  function clearFilters() {
    setSearch("");
    setPlatform("all");
    setState("all");
  }
  const errorLabel = query.error instanceof ApiError && query.error.status === 401 ? "cacheLoginExpired" : "noAccess";
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-muted-foreground">{t("cacheDescription")}</p>
        <Button
          variant="outline"
          disabled={query.isFetching || !subject}
          onClick={() => {
            setSelection(null);
            void query.refetch();
          }}
        >
          {t("refresh")}
        </Button>
      </div>
      {denied || !subject ? (
        <Notice error={t(errorLabel)} />
      ) : (
        <>
          {query.isPending ? (
            <p role="status">{t("loading")}</p>
          ) : (
            <Alert role="status">
              <AlertDescription>
                {t(reportNotice(report, failed, stale))}
                {report && (
                  <p>
                    {t("cacheSampledAt")}: {timeText(report.generated_at, t)}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
          {report && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-2">
              {report.runtimes.map((runtime) => (
                <RuntimeCard
                  key={runtime.platform}
                  runtime={runtime}
                  stale={runtimeIsStale(runtime, report.stale_after_seconds, failed)}
                />
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t("cacheMetricHelp")}</p>
          <section aria-labelledby="cache-rules-title" className="flex min-w-0 flex-col gap-4">
            <h2 id="cache-rules-title" className="text-lg font-semibold">
              {t("cacheRules")}: {hasCatalog ? `${filtered.length} / ${policies.length}` : t("cacheNotCollected")}
            </h2>
            <FieldGroup className="grid gap-4 md:grid-cols-4">
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="cache-rule-search">{t("cacheSearch")}</FieldLabel>
                <Input
                  id="cache-rule-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cache-platform-filter">{t("cachePlatform")}</FieldLabel>
                <Select
                  items={platforms}
                  value={platform}
                  onValueChange={(value) => setPlatform(value === "yuntu" || value === "feigua" ? value : "all")}
                >
                  <SelectTrigger id="cache-platform-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">{t("cacheAllPlatforms")}</SelectItem>
                      <SelectItem value="yuntu">{t("yuntu")}</SelectItem>
                      <SelectItem value="feigua">{t("cacheFeigua")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cache-state-filter">{t("status")}</FieldLabel>
                <Select
                  items={states}
                  value={state}
                  onValueChange={(value) =>
                    setState(value === "enabled" || value === "disabled" || value === "stale" ? value : "all")
                  }
                >
                  <SelectTrigger id="cache-state-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(
                        [
                          ["all", "cacheAllStates"],
                          ["enabled", "cacheConfigEnabled"],
                          ["disabled", "cacheConfigDisabled"],
                          ["stale", "cacheStale"],
                        ] as const
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {t(label)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                {t("cacheClearFilters")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {["cacheRules", "cachePlatform", "cacheTTL", "status", "cachePolicyMetrics", "detail"].map(
                    (label) => (
                      <TableHead key={label}>{t(label as CopyKey)}</TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={`${row.runtime.platform}:${row.policy.id}`}>
                    <TableCell className="max-w-md whitespace-normal">
                      <span>{row.policy.label}</span>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{row.policy.tools.join("、")}</p>
                    </TableCell>
                    <TableCell>{platformText(row.runtime.platform, t)}</TableCell>
                    <TableCell>{ttlText(row.policy.ttl_seconds, t)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(row.policy.enabled ? "cacheConfigEnabled" : "cacheConfigDisabled")}
                      </Badge>
                      {runtimeIsStale(row.runtime, report?.stale_after_seconds ?? 90, failed) && (
                        <p className="mt-1 text-xs">{t("cacheStale")}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.policy.counters && row.runtime.metadata?.metrics.scope === "runtime_process"
                        ? `${numberText(row.policy.counters.hit, t)} / ${numberText(row.policy.counters.miss, t)}`
                        : t("cacheNotCollected")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`${t("detail")}: ${row.policy.label}`}
                        onClick={() => {
                          if (report) setSelection({ row, report, subject });
                        }}
                      >
                        {t("detail")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={6}>{t(policies.length ? "cacheRulesEmpty" : "cacheNoData")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
          <section className="flex min-w-0 flex-col gap-3" aria-labelledby="cache-tool-scope-title">
            <h2 id="cache-tool-scope-title" className="text-lg font-semibold">
              {t("cacheToolScope")}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  {["cacheTools", "cacheKind", "cacheTTL", "description"].map((label) => (
                    <TableHead key={label}>{t(label as CopyKey)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.tool}>
                    <TableCell className="max-w-xs whitespace-normal break-words">
                      {rule.tool}
                      {rule.aliases.length > 0 && (
                        <p className="text-xs text-muted-foreground">{rule.aliases.join("、")}</p>
                      )}
                    </TableCell>
                    <TableCell>{t(kindLabels[rule.kind])}</TableCell>
                    <TableCell>{ruleLifetime(rule, t)}</TableCell>
                    <TableCell className="max-w-md whitespace-normal">{rule.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">{t("cacheScopeNote")}</p>
          </section>
          <p className="text-sm text-muted-foreground">{t("cacheNoEntryIndex")}</p>
        </>
      )}
      {selected && (
        <Modal title={selected.policy.label} open onClose={() => setSelection(null)}>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-sm">
            <Value label="Policy ID">{selected.policy.id}</Value>
            <Value label={t("cacheTools")}>{selected.policy.tools.join("、")}</Value>
            <Value label={t("cacheSourcePath")}>{selected.policy.path_template}</Value>
            <Value label={t("cacheRuleVersion")}>{selected.policy.version}</Value>
            <Value label={t("cacheTTL")}>{ttlText(selected.policy.ttl_seconds, t)}</Value>
            <Value label={t("cacheSampledAt")}>{timeText(selected.runtime.metadata?.sampled_at, t)}</Value>
          </dl>
          <h3 className="font-medium">{t("cacheConditions")}</h3>
          {selected.policy.conditions.map((condition) => (
            <p key={condition} className="text-sm">
              {condition}
            </p>
          ))}
          <h3 className="font-medium">{t("cacheExclusions")}</h3>
          {selected.policy.exclusions.map((condition) => (
            <p key={condition} className="text-sm">
              {condition}
            </p>
          ))}
          <DialogDescription>{t("cacheFixedExpiry")}</DialogDescription>
        </Modal>
      )}
    </div>
  );
}
