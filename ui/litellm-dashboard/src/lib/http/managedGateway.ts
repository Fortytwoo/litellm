import { z } from "zod";
import { createApiClient, type HttpMethod, type QueryParams } from "./client";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type Row = { [key: string]: Json };
const json: z.ZodType<Json> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(json), z.record(z.string(), json)]),
);
export const record = z.record(z.string(), json);
const client = createApiClient({ getBaseUrl: () => "/admin/api" });

/** Cookie authentication only. Model keys are delivered by a separate Host API. */
export async function gateway(
  operation: string,
  options: { method?: HttpMethod; body?: unknown; csrf?: string; query?: QueryParams; signal?: AbortSignal } = {},
): Promise<Row> {
  const value = await client.request<unknown>(options.method ?? "GET", `/${operation}`, {
    body: options.body,
    query: options.query,
    signal: options.signal,
    credentials: "same-origin",
    redirect: "error",
    headers: options.csrf ? { "x-csrf-token": options.csrf } : {},
  });
  return record.parse(value);
}

export function obj(value: Json | undefined): Row {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
export function rows(value: Json | undefined): Row[] {
  return Array.isArray(value)
    ? value.filter((v): v is Row => v !== null && typeof v === "object" && !Array.isArray(v))
    : [];
}
export function strings(value: Json | undefined): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
export function str(value: Json | undefined): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}
export function num(value: Json | undefined): number {
  return typeof value === "number" ? value : 0;
}

/** Display audit timestamps consistently in the application's Beijing timezone. */
export function auditTime(value: Json | undefined): string {
  const raw = str(value);
  const parsed = new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? raw.replace(" ", "T") + "Z" : raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
}
