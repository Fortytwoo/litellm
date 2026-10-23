import { z } from "zod";
import { gateway } from "./managedGateway";

const count = z.number().int().nonnegative().nullable().optional().default(null);
const timestamp = z.string().datetime({ offset: true });
const platform = z.enum(["yuntu", "feigua"]);
const toolName = z.string().regex(/^[a-z][a-z0-9_]{0,159}$/);
const counterFields = { hit: count, miss: count, bypass: count, coalesced: count, error: count };
const counters = z.object(counterFields).readonly();
const policyFields = {
  id: z.string().regex(/^[a-z][a-z0-9_.]{0,95}$/),
  label: z.string().max(120),
  tools: z.array(toolName).max(32),
  path_template: z
    .string()
    .regex(/^\/[A-Za-z0-9_/.{}-]+$/)
    .max(240),
  version: z.string().regex(/^[A-Za-z0-9_.-]{1,48}$/),
  ttl_seconds: z.number().int().nonnegative(),
  enabled: z.boolean(),
  conditions: z.array(z.string().max(400)).max(8),
  exclusions: z.array(z.string().max(400)).max(8),
  counters: counters.nullable().optional().default(null),
};
export const requestCachePolicySchema = z.object(policyFields).readonly();
const toolRuleFields = {
  tool: toolName,
  aliases: z.array(toolName).max(32).optional().default([]),
  kind: z.enum(["http_request", "local_dictionary", "saved_snapshot", "not_cached"]),
  policies: z.array(z.string()).max(32).optional().default([]),
  description: z.string().max(400),
  ttl_seconds: count,
  enabled: z.boolean().nullable().optional().default(null),
};
const toolRule = z.object(toolRuleFields).readonly();
const metricFields = {
  scope: z.string().max(64),
  window: z.string().max(64),
  started_at: timestamp.nullable().optional().default(null),
  reset_at: timestamp.nullable().optional().default(null),
  counters: counters.nullable(),
  source_requests: count,
  tool_calls: count,
  hit_ratio: z.number().min(0).max(1).nullable().optional().default(null),
  hit_ratio_denominator: z.string().max(64),
};
const memoryFields = {
  scope: z.string().max(64),
  entries: count,
  bytes: count,
  max_entries: count,
  max_bytes: count,
  inflight: count,
};
const metadataFields = {
  schema_version: z.literal(1),
  platform,
  instance_id: z.string().max(64),
  sampled_at: timestamp,
  release: z
    .object({
      release_version: z.string().max(64),
      source_commit: z
        .string()
        .regex(/^[a-f0-9]{40}$/)
        .nullable()
        .optional()
        .default(null),
    })
    .readonly(),
  enabled: z.boolean(),
  backend: z.enum(["memory", "redis", "unsupported"]),
  backend_configured: z.boolean(),
  identity_isolation_configured: z.boolean(),
  effective_state: z.enum(["disabled", "misconfigured", "configured"]),
  backend_health: z.string().max(64),
  policies: z.array(requestCachePolicySchema).max(32),
  tool_rules: z.array(toolRule).max(32),
  metrics: z.object(metricFields).readonly(),
  memory: z.object(memoryFields).nullable().optional().default(null),
  entry_metadata_available: z.boolean().optional().default(false),
};
const metadata = z.object(metadataFields).readonly();
const runtimeFields = {
  platform,
  availability: z.enum(["available", "unavailable", "not_configured", "ambiguous", "unsupported"]),
  reason: z.string().max(96).nullable().optional().default(null),
  runtime_ready: z.boolean().nullable().optional().default(null),
  observed_at: timestamp,
  last_success_at: timestamp.nullable(),
  stale: z.boolean(),
  metadata: metadata.nullable(),
};
const runtime = z
  .object(runtimeFields)
  .readonly()
  .refine((value) => value.metadata === null || value.metadata.platform === value.platform);
const reportFields = {
  schema_version: z.literal(1),
  generated_at: timestamp,
  status: z.enum(["available", "partial", "unavailable"]),
  poll_seconds: z.number().int().min(30).max(60),
  stale_after_seconds: z.number().int().min(30).max(600),
  runtimes: z.array(runtime).max(2),
};
export const requestCacheReportSchema = z.object(reportFields).readonly();
export type RequestCacheReport = z.infer<typeof requestCacheReportSchema>;
export type RequestCacheRuntime = RequestCacheReport["runtimes"][number];
export type RequestCachePolicy = z.infer<typeof requestCachePolicySchema>;
export type RequestCacheToolRule = z.infer<typeof toolRule>;
export type RequestCachePolicyRow = Readonly<{ runtime: RequestCacheRuntime; policy: RequestCachePolicy }>;
export type RequestCacheSelection = Readonly<{
  row: RequestCachePolicyRow;
  report: RequestCacheReport;
  subject: string;
}>;

export async function readRequestCache(signal?: AbortSignal): Promise<RequestCacheReport> {
  return requestCacheReportSchema.parse(await gateway("request-cache", { signal }));
}
export function runtimeIsStale(
  value: RequestCacheRuntime,
  threshold: number,
  failed = false,
  now = Date.now(),
): boolean {
  if (failed || value.stale) return true;
  if (value.last_success_at === null) return false;
  return now - Date.parse(value.last_success_at) > threshold * 1000;
}
export function requestCachePolicies(report: RequestCacheReport | undefined): RequestCachePolicyRow[] {
  return (
    report?.runtimes.flatMap((value) => value.metadata?.policies.map((policy) => ({ runtime: value, policy })) ?? []) ??
    []
  );
}
function matchesState(
  row: RequestCachePolicyRow,
  state: string,
  report: RequestCacheReport | undefined,
  failed: boolean,
): boolean {
  switch (state) {
    case "all":
      return true;
    case "enabled":
      return row.policy.enabled;
    case "disabled":
      return !row.policy.enabled;
    case "stale":
      return runtimeIsStale(row.runtime, report?.stale_after_seconds ?? 90, failed);
    default:
      return false;
  }
}
export function filterRequestCachePolicies(
  report: RequestCacheReport | undefined,
  filters: Readonly<{ platform: string; query: string; state: string }>,
  failed = false,
): RequestCachePolicyRow[] {
  const query = filters.query.trim().toLowerCase();
  return requestCachePolicies(report).filter((row) => {
    const platformMatches = filters.platform === "all" || row.runtime.platform === filters.platform;
    const textMatches =
      !query || [row.policy.id, row.policy.label, ...row.policy.tools].join(" ").toLowerCase().includes(query);
    return platformMatches && textMatches && matchesState(row, filters.state, report, failed);
  });
}
export function currentCacheSelection(
  selection: RequestCacheSelection | null,
  report: RequestCacheReport | undefined,
  state: Readonly<{ subject: string; fetching: boolean; failed: boolean }>,
): RequestCachePolicyRow | null {
  if (!selection || state.fetching || state.failed) return null;
  if (selection.report !== report || selection.subject !== state.subject) return null;
  return (
    requestCachePolicies(report).find(
      (row) => row.policy.id === selection.row.policy.id && row.runtime.platform === selection.row.runtime.platform,
    ) ?? null
  );
}
