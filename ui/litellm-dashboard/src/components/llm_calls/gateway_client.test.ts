import { afterEach, expect, it, vi } from "vitest";
import { registerAuthHeaderNameGetter } from "@/lib/http/runtime";
import { createGatewayClient } from "./gateway_client";

vi.mock("@/components/networking", () => ({ getProxyBaseUrl: () => "https://management.example/root" }));
afterEach(() => {
  registerAuthHeaderNameGetter(() => "Authorization");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each(["Authorization", "x-session-key"])(
  "uses the gateway's %s header and retains root paths and caller headers",
  async (header) => {
    registerAuthHeaderNameGetter(() => header);
    const fetchImpl = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } }),
    );
    const client = createGatewayClient({
      accessToken: "session",
      defaultHeaders: { "x-litellm-tags": "playground", "x-custom": "custom" },
      fetch: fetchImpl,
    });
    await client.models.list();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://management.example/root/models");
    const headers = new Headers(init?.headers);
    expect(headers.get(header)).toBe("Bearer session");
    expect(headers.get("x-litellm-tags")).toBe("playground");
    expect(headers.get("x-custom")).toBe("custom");
    if (header !== "Authorization") expect(headers.has("Authorization")).toBe(false);
  },
);

it("retains explicit SDK options and an intentionally supplied Playground authorization header", async () => {
  const fetchImpl = vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } }),
  );
  const options = {
    accessToken: "session",
    baseURL: "https://models.example/v1",
    defaultHeaders: { Authorization: "Bearer explicit-playground-token" },
    fetch: fetchImpl,
    maxRetries: 0,
    timeout: 1000,
  };
  const client = createGatewayClient(options);
  await client.models.list();
  expect(fetchImpl.mock.calls[0][0]).toBe("https://models.example/v1/models");
  expect(new Headers(fetchImpl.mock.calls[0][1]?.headers).get("Authorization")).toBe(
    "Bearer explicit-playground-token",
  );
});

it("uses the cookie transport without SDK retries in the managed console", async () => {
  vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "1");
  vi.stubGlobal("location", { origin: "https://management.example" });
  const nativeFetch = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", nativeFetch);
  const client = createGatewayClient({ accessToken: "managed-cookie-session" });
  await client.models.list();
  expect(client.maxRetries).toBe(0);
  const request = nativeFetch.mock.calls[0][0] as Request;
  expect(request.url).toBe("https://management.example/admin/native/root/models");
  expect(request.headers.has("authorization")).toBe(false);
  expect(request.credentials).toBe("same-origin");
});
