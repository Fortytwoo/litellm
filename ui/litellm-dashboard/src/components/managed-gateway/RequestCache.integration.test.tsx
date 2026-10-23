import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import userEvent from "@testing-library/user-event";
import { chooseSelectOption } from "../../../tests/test-utils";
import { cacheHistoryFixture } from "../../../tests/fixtures/requestCacheHistory";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cacheReportFixture } from "../../../tests/fixtures/requestCache";
import { GatewaySession } from "./Shared";
import { RequestCache } from "./RequestCache";
import { GatewayExtension } from "./Extension";

const response = (value: object, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

function renderCache() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <NuqsTestingAdapter hasMemory>
      <QueryClientProvider client={client}>
        <LanguageProvider initialLocale="zh">
          <GatewaySession.Provider
            value={{
              me: { subject: "synthetic-admin" },
              snapshot: { revision: 1, permissions: ["services.read"] },
              write: async () => ({}),
            }}
          >
            <RequestCache />
          </GatewaySession.Provider>
        </LanguageProvider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
  return { client, view };
}
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders installed policies and filters shared tool mappings without treating unknown counts as zero", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response(cacheReportFixture)));
  renderCache();
  expect(await screen.findByRole("cell", { name: /^品牌日趋势/ })).toBeVisible();
  fireEvent.click(screen.getByText("查看运行进程与配置详情"));
  const runtime = screen.getByRole("region", { name: "飞瓜 / BigDataVoice" });
  expect(screen.getByRole("combobox", { name: "平台" })).toHaveTextContent("全部平台");
  expect(screen.getByRole("combobox", { name: "状态" })).toHaveTextContent("全部状态");
  expect(within(runtime).getByText("75.0%")).toBeVisible();
  expect(within(runtime).getAllByText("未采集").length).toBeGreaterThan(0);
  expect(within(runtime).getByText("未检查")).toBeVisible();
  fireEvent.change(screen.getByRole("searchbox", { name: "搜索规则、工具或 policy ID" }), {
    target: { value: "feigua_brand_daily_gmv" },
  });
  expect(screen.getByRole("cell", { name: /^品牌日趋势/ })).toBeVisible();
  expect(screen.queryByRole("cell", { name: /^商品分析概览/ })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "来源缓存规则: 1 / 3" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));
  expect(screen.getByRole("cell", { name: /^商品分析概览/ })).toBeVisible();
  expect(screen.getByRole("cell", { name: "独立快照期限" })).toBeVisible();
});

it("closes an opened rule on a successful background refresh even when the response is identical", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => response(cacheReportFixture));
  vi.stubGlobal("fetch", fetch);
  const { client } = renderCache();
  fireEvent.click(await screen.findByRole("button", { name: "详情: 品牌日趋势" }));
  expect(screen.getByRole("dialog", { name: "品牌日趋势" })).toBeVisible();
  await act(async () => {
    await client.refetchQueries({ queryKey: ["gateway", "request-cache"] });
  });
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(fetch).toHaveBeenCalledTimes(4);
});

it("hides process totals for restricted scopes even when all catalog tools and unsafe totals are present", async () => {
  const runtime = cacheReportFixture.runtimes[0];
  const metadata = runtime.metadata;
  const restricted = {
    ...cacheReportFixture,
    runtimes: [
      {
        ...runtime,
        metadata: {
          ...metadata,
          metrics: { ...metadata.metrics, scope: "restricted", counters: { ...metadata.metrics.counters, hit: 12345 } },
          memory: {
            scope: "runtime_process",
            entries: 98765,
            bytes: 98765,
            max_entries: 100000,
            max_bytes: 100000,
            inflight: 0,
          },
        },
      },
    ],
  };
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response(restricted)));
  renderCache();
  await screen.findByText("查看运行进程与配置详情");
  fireEvent.click(screen.getByText("查看运行进程与配置详情"));
  expect(await screen.findByText("工具范围受限，运行进程总计与容量已隐藏")).toBeVisible();
  expect(screen.queryByText("12,345")).not.toBeInTheDocument();
  expect(screen.queryByText(/98,765/)).not.toBeInTheDocument();
  expect(screen.getByText("—")).toBeVisible();
});

it("retains old samples on an unavailable gateway and clears them with the open rule on permission rejection", async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(response(cacheReportFixture))
    .mockResolvedValueOnce(response(cacheHistoryFixture))
    .mockResolvedValueOnce(response({ error: "unavailable" }, 503))
    .mockResolvedValueOnce(response({ error: "unavailable" }, 503))
    .mockResolvedValueOnce(response({ error: "permission_denied" }, 403))
    .mockResolvedValueOnce(response({ error: "permission_denied" }, 403));
  vi.stubGlobal("fetch", fetch);
  renderCache();
  fireEvent.click(await screen.findByRole("button", { name: "详情: 品牌日趋势" }));
  fireEvent.click(screen.getByRole("button", { name: /Close|关闭/ }));
  fireEvent.click(screen.getByRole("button", { name: "刷新", exact: true }));
  expect(await screen.findByText("状态读取失败，保留上次成功采样并标为过期")).toBeVisible();
  expect(screen.getByRole("cell", { name: /^品牌日趋势/ })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "刷新", exact: true }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "飞瓜 / BigDataVoice" })).not.toBeInTheDocument());
  expect(screen.queryByRole("cell", { name: /^品牌日趋势/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("renders stored totals, writes the window to the URL and clears all data after a history-only permission rejection", async () => {
  const onUrlUpdate = vi.fn();
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    if (!String(input).includes("history")) return response(cacheReportFixture);
    return response(cacheHistoryFixture);
  });
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
      <QueryClientProvider client={client}>
        <LanguageProvider initialLocale="zh">
          <GatewaySession.Provider
            value={{ me: { subject: "synthetic-admin" }, snapshot: { revision: 1 }, write: async () => ({}) }}
          >
            <RequestCache />
          </GatewaySession.Provider>
        </LanguageProvider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
  expect(await screen.findByRole("heading", { name: "缓存概览" })).toBeVisible();
  expect(within(screen.getByRole("region", { name: "飞瓜 / BigDataVoice 缓存概览" })).getByText("66.7%")).toBeVisible();
  expect(screen.getByRole("combobox", { name: "时间范围" })).toHaveTextContent("最近 24 小时");
  await chooseSelectOption(userEvent.setup(), screen.getByRole("combobox", { name: "时间范围" }), "最近 7 天");
  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining("window=7d"), expect.any(Object)));
  fetch.mockImplementation(async (input) =>
    String(input).includes("history") ? response({ error: "permission_denied" }, 403) : response(cacheReportFixture),
  );
  fireEvent.click(screen.getByRole("button", { name: "刷新", exact: true }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "缓存概览" })).not.toBeInTheDocument());
  expect(screen.queryByRole("cell", { name: /^品牌日趋势/ })).not.toBeInTheDocument();
});

it("denies the native route before reading cache status when the console session lacks services.read", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/me")) return response({ subject: "synthetic-viewer", csrf_token: "synthetic-csrf" });
    return response({ permissions: ["console.read", "tools.read"] });
  });
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LanguageProvider initialLocale="zh">
        <GatewayExtension page="request-cache" />
      </LanguageProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(fetch.mock.calls.map(([url]) => String(url))).toEqual(["/admin/api/me", "/admin/api/snapshot"]);
});
