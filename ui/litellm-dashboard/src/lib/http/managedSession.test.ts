import { afterEach, describe, expect, it, vi } from "vitest";
import { COOKIE_SESSION, managedFetch, managedRequest, setManagedCsrf } from "./managedSession";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  setManagedCsrf("");
});

describe("central cookie transport", () => {
  it.each(["/v1/access_group", "/config/cost_discount_config", "/v1/workflows/runs?limit=100"])(
    "dispatches internal fetches to the BFF: %s",
    async (path) => {
      vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "1");
      vi.stubGlobal("location", { origin: "https://gateway.example.test" });
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("{}"));
      vi.stubGlobal("fetch", fetch);
      await managedFetch(path, { headers: { authorization: "Bearer fixture" } });
      const request = fetch.mock.calls[0][0] as Request;
      expect(request.url).toBe("https://gateway.example.test/admin/native" + path);
      expect(request.headers.has("authorization")).toBe(false);
      expect(request.credentials).toBe("same-origin");
    },
  );

  it("removes bearer credentials and binds native writes to the same-origin BFF and CSRF token", async () => {
    vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "1");
    vi.stubGlobal("location", { origin: "https://gateway.example.test" });
    setManagedCsrf("fixture-csrf");
    const request = await managedRequest(
      new Request("https://gateway.example.test/model/new", {
        method: "POST",
        headers: { authorization: `Bearer ${COOKIE_SESSION}` },
        body: JSON.stringify({ model_name: "chat" }),
      }),
    );
    expect(request.url).toBe("https://gateway.example.test/admin/native/model/new");
    expect(request.headers.has("authorization")).toBe(false);
    expect(request.headers.get("x-csrf-token")).toBe("fixture-csrf");
    expect(request.credentials).toBe("same-origin");
    expect(request.redirect).toBe("error");
    expect(await request.json()).toEqual({ model_name: "chat" });
  });

  it("preserves owned business routes and refuses cross-origin worker configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "1");
    vi.stubGlobal("location", { origin: "https://gateway.example.test" });
    const request = await managedRequest(new Request("https://gateway.example.test/admin/api/me"));
    expect(new URL(request.url).pathname).toBe("/admin/api/me");
    await expect(managedRequest(new Request("https://other.example.test/model/info"))).rejects.toThrow("page origin");
  });

  it("leaves the native deployment transport unchanged", async () => {
    vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "0");
    const request = new Request("https://native.example.test/model/info");
    expect(await managedRequest(request)).toBe(request);
  });
});
