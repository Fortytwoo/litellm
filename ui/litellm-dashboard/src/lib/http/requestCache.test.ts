import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheReportFixture } from "../../../tests/fixtures/requestCache";
import {
  currentCacheSelection,
  filterRequestCachePolicies,
  readRequestCache,
  requestCachePolicies,
  requestCacheReportSchema,
  runtimeIsStale,
} from "./requestCache";

afterEach(() => vi.unstubAllGlobals());

describe("request cache monitoring", () => {
  it("reads the same-origin status API with cookies, no model key or identity override", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify(cacheReportFixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetch);
    const report = await readRequestCache();
    expect(report.runtimes).toHaveLength(cacheReportFixture.runtimes.length);
    const [url, options] = fetch.mock.calls[0];
    expect(String(url)).toBe("/admin/api/request-cache");
    expect(options?.credentials).toBe("same-origin");
    expect(new Headers(options?.headers).has("authorization")).toBe(false);
    expect(options?.body).toBeUndefined();
  });
  it("keeps unknown metrics distinct from zero and strips unrecognized sensitive fields", () => {
    const report = requestCacheReportSchema.parse({
      ...cacheReportFixture,
      redis_url: "not-for-the-browser",
      owner: "hidden-owner",
    });
    expect(report.runtimes[0].metadata?.metrics.source_requests).toBeNull();
    expect(report.runtimes[1].metadata?.metrics.counters?.hit).toBe(0);
    expect(report.runtimes[1].metadata?.metrics.hit_ratio).toBeNull();
    expect(JSON.stringify(report)).not.toContain("not-for-the-browser");
    expect(JSON.stringify(report)).not.toContain("hidden-owner");
  });
  it("uses returned many-to-many tool associations and installed TTLs when filtering", () => {
    const report = requestCacheReportSchema.parse(cacheReportFixture);
    const filtered = filterRequestCachePolicies(report, {
      platform: "feigua",
      query: "feigua_brand_daily_gmv",
      state: "enabled",
    });
    expect(filtered.map((row) => row.policy.id)).toEqual([cacheReportFixture.runtimes[0].metadata.policies[0].id]);
    expect(filtered[0].policy.tools).toHaveLength(cacheReportFixture.runtimes[0].metadata.policies[0].tools.length);
    const goods = filterRequestCachePolicies(report, { platform: "all", query: "商品分析概览", state: "all" });
    expect(goods[0].policy.ttl_seconds).toBe(cacheReportFixture.runtimes[0].metadata.policies[1].ttl_seconds);
  });
  it("marks explicit failures and old successful samples stale without inventing missing timestamps", () => {
    const report = requestCacheReportSchema.parse(cacheReportFixture);
    const runtime = report.runtimes[0];
    const now = Date.parse(report.generated_at);
    expect(runtimeIsStale(runtime, report.stale_after_seconds, false, now)).toBe(false);
    expect(
      runtimeIsStale(runtime, report.stale_after_seconds, false, now + (report.stale_after_seconds + 1) * 1000),
    ).toBe(true);
    expect(runtimeIsStale({ ...runtime, last_success_at: null }, 90, false, now)).toBe(false);
    expect(runtimeIsStale(runtime, 90, true, now)).toBe(true);
  });
  it("closes a rule selection after every new report, changed identity, pending read or failure", () => {
    const report = requestCacheReportSchema.parse(cacheReportFixture);
    const row = requestCachePolicies(report)[0];
    const selection = { report, row, subject: "synthetic-admin" };
    const state = { subject: selection.subject, fetching: false, failed: false };
    expect(currentCacheSelection(selection, report, state)?.policy.id).toBe(row.policy.id);
    expect(currentCacheSelection(selection, requestCacheReportSchema.parse(cacheReportFixture), state)).toBeNull();
    expect(currentCacheSelection(selection, report, { ...state, subject: "another-user" })).toBeNull();
    expect(currentCacheSelection(selection, report, { ...state, fetching: true })).toBeNull();
    expect(currentCacheSelection(selection, report, { ...state, failed: true })).toBeNull();
  });
  it("rejects unverified runtime mixes, unsafe paths and unsupported schemas", () => {
    expect(requestCacheReportSchema.safeParse({ ...cacheReportFixture, schema_version: 2 }).success).toBe(false);
    const runtime = cacheReportFixture.runtimes[0];
    expect(
      requestCacheReportSchema.safeParse({ ...cacheReportFixture, runtimes: [{ ...runtime, platform: "yuntu" }] })
        .success,
    ).toBe(false);
    const policy = runtime.metadata.policies[0];
    const unsafe = {
      ...runtime,
      metadata: { ...runtime.metadata, policies: [{ ...policy, path_template: "/read?token=hidden" }] },
    };
    expect(requestCacheReportSchema.safeParse({ ...cacheReportFixture, runtimes: [unsafe] }).success).toBe(false);
  });
});
