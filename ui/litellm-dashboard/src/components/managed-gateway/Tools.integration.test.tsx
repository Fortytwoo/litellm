import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { gateway } from "@/lib/http/managedGateway";
import { GatewaySession } from "./Shared";
import { Tools } from "./Tools";

afterEach(() => vi.unstubAllGlobals());

it("clicking semantic search sends the entered query and renders the returned tools", async () => {
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
        <Tools />
      </GatewaySession.Provider>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Search", exact: true }), { target: { value: "authorized brands" } });
  fireEvent.click(screen.getByRole("button", { name: "Semantic search", exact: true }));
  expect(await screen.findByRole("cell", { name: "account_list", exact: true })).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, options] = fetch.mock.calls[0];
  expect(String(url)).toContain("/admin/api/tool-search");
  expect(options?.method).toBe("POST");
  expect(JSON.parse(String(options?.body))).toEqual({ query: "authorized brands", limit: 20 });
  expect(new Headers(options?.headers).get("x-csrf-token")).toBe("fixture-csrf");
  client.clear();
});
