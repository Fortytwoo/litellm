import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { gateway } from "@/lib/http/managedGateway";
import { setManagedCsrf } from "@/lib/http/managedSession";
import { GatewaySession } from "./Shared";
import { Tools } from "./Tools";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

afterEach(() => {
  vi.unstubAllGlobals();
  setManagedCsrf("");
});

it("clicking semantic search sends the entered query and renders the returned tools", async () => {
  localStorage.clear();
  setManagedCsrf("fixture-csrf");
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response(JSON.stringify({ tools: [{ name: "account_list", description: "Authorized brand context" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GatewaySession.Provider
        value={{
          me: {},
          snapshot: { tools: [], permissions: ["tools.read"] },
          write: (operation, body) => gateway(operation, { method: "POST", body, csrf: "fixture-csrf" }),
        }}
      >
        <LanguageProvider initialLocale="en">
          <LanguageSwitcher />
          <Tools />
        </LanguageProvider>
      </GatewaySession.Provider>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Search", exact: true }), {
    target: { value: "authorized brands" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Semantic search", exact: true }));
  expect(await screen.findByRole("cell", { name: "account_list", exact: true })).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = fetch.mock.calls[0];
  const request = url instanceof Request ? url.clone() : new Request(new URL(String(url), window.location.origin), options);
  expect(request.url).toContain("/admin/api/tool-search");
  expect(request.method).toBe("POST");
  expect(await request.json()).toEqual({ query: "authorized brands", limit: 20 });
  expect(request.headers.get("x-csrf-token")).toBe("fixture-csrf");
  fireEvent.click(screen.getByRole("button", { name: "中文", exact: true }));
  expect(screen.getByRole("textbox", { name: "搜索", exact: true })).toHaveValue("authorized brands");
  expect(screen.getByRole("button", { name: "语义检索", exact: true })).toBeVisible();
  expect(screen.getByRole("cell", { name: "account_list", exact: true })).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "English", exact: true }));
  expect(screen.getByRole("textbox", { name: "Search", exact: true })).toHaveValue("authorized brands");
  expect(fetch).toHaveBeenCalledTimes(1);
  client.clear();
});
