import { afterEach, expect, it, vi } from "vitest";
import { cacheHistoryFixture } from "../../../tests/fixtures/requestCacheHistory";
import { cacheReportFixture } from "../../../tests/fixtures/requestCache";
import {
  cacheChartRows,
  cacheHistoryIsStale,
  cacheHistorySchema,
  readCacheHistory,
  readCacheView,
} from "./requestCacheHistory";

const response = (value: object, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
afterEach(() => vi.unstubAllGlobals());

it("reads a bounded window through the authenticated same-origin API", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response({ ...cacheHistoryFixture, window: "7d" }));
  vi.stubGlobal("fetch", fetch);
  expect((await readCacheHistory("7d")).window).toBe("7d");
  const [url, options] = fetch.mock.calls[0];
  expect(String(url)).toBe("/admin/api/request-cache-history?window=7d");
  expect(options?.credentials).toBe("same-origin");
  expect(new Headers(options?.headers).has("authorization")).toBe(false);
});

it("preserves missing points and ratio units without joining gaps or turning them into zero", () => {
  const history = cacheHistorySchema.parse(cacheHistoryFixture);
  const inventory = cacheChartRows(history.series, "entries");
  const hits = cacheChartRows(history.series, "hit");
  const ratios = cacheChartRows(history.series, "hit_ratio");
  expect(inventory.map((point) => point.feigua)).toEqual([14, null]);
  expect(hits.map((point) => point.feigua)).toEqual([10, null]);
  expect(ratios[0].feigua).toBe((10 / 15) * 100);
  expect(ratios[1].feigua).toBeNull();
  expect(inventory.every((point) => point.yuntu === null)).toBe(true);
  expect(cacheHistoryIsStale(history)).toBe(false);
  expect(
    cacheHistoryIsStale({
      ...history,
      generated_at: new Date(Date.parse(history.generated_at) + 180000).toISOString(),
    }),
  ).toBe(true);
});

it("rejects duplicate runtimes, oversized histories and mismatched windows", async () => {
  expect(
    cacheHistorySchema.safeParse({
      ...cacheHistoryFixture,
      series: [...cacheHistoryFixture.series, ...cacheHistoryFixture.series],
    }).success,
  ).toBe(false);
  expect(
    cacheHistorySchema.safeParse({
      ...cacheHistoryFixture,
      series: [
        {
          ...cacheHistoryFixture.series[0],
          points: Array.from({ length: 721 }, () => cacheHistoryFixture.series[0].points[0]),
        },
      ],
    }).success,
  ).toBe(false);
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response(cacheHistoryFixture)));
  await expect(readCacheHistory("7d")).rejects.toThrow("Unexpected cache history window");
});

it("keeps current status when history is unavailable and rejects the whole view after history authorization fails", async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(async (input) =>
      String(input).includes("history") ? response({ error: "unavailable" }, 503) : response(cacheReportFixture),
    );
  vi.stubGlobal("fetch", fetch);
  const view = await readCacheView("24h");
  expect(view.runtimes).toHaveLength(cacheReportFixture.runtimes.length);
  expect(view.historyFailed).toBe(true);
  fetch.mockImplementation(async (input) =>
    String(input).includes("history") ? response({ error: "permission_denied" }, 403) : response(cacheReportFixture),
  );
  await expect(readCacheView("24h")).rejects.toMatchObject({ status: 403 });
});

it("applies the stricter scope when permissions change between the current and history responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        String(input).includes("history")
          ? response({ ...cacheHistoryFixture, status: "restricted", scope: "restricted" })
          : response(cacheReportFixture),
      ),
  );
  const view = await readCacheView("24h");
  expect(view.history?.series).toHaveLength(0);
  expect(view.runtimes.every((runtime) => runtime.metadata?.metrics.counters === null)).toBe(true);
  expect(view.runtimes.every((runtime) => runtime.metadata?.inventory === null)).toBe(true);
});
