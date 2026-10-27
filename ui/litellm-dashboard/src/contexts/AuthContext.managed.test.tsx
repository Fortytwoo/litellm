import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/http/client";
import { AuthProvider, useAuth } from "./AuthContext";

const mocked = vi.hoisted(() => ({ gateway: vi.fn(), config: vi.fn(), csrf: vi.fn() }));
vi.mock("@/lib/http/managedGateway", () => ({ gateway: mocked.gateway, str: String, strings: (value: string[]) => value }));
vi.mock("@/lib/http/managedSession", () => ({ COOKIE_SESSION: "managed-cookie-session", setManagedCsrf: mocked.csrf, managedRequest: async (request: Request) => request }));
vi.mock("@/components/networking", () => ({ getUiConfig: mocked.config, setGlobalLitellmHeaderName: vi.fn() }));
vi.mock("./LanguageContext", () => ({ useLanguage: () => ({ t: (key: string) => key }) }));

function Child() {
  const auth = useAuth();
  return <output data-testid="auth">{JSON.stringify({ token: auth.accessToken, role: auth.userRole })}</output>;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_MANAGED_GATEWAY", "1");
  vi.clearAllMocks();
  mocked.gateway.mockReset();
  mocked.config.mockReset().mockResolvedValue({});
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("managed console authentication", () => {
  it("keeps a snapshot denial visible without mounting protected consumers or repeating login", async () => {
    mocked.gateway.mockResolvedValueOnce({ subject: "fixture", csrf_token: "fixture-csrf" })
      .mockRejectedValueOnce(new ApiError("permission_denied", 403, null));
    const view = render(<AuthProvider><Child /></AuthProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent("managedAuth.denied");
    expect(screen.queryByTestId("auth")).not.toBeInTheDocument();
    view.rerender(<AuthProvider><Child /></AuthProvider>);
    expect(mocked.gateway).toHaveBeenCalledTimes(2);
    expect(mocked.config).not.toHaveBeenCalled();
    expect(mocked.csrf).toHaveBeenCalledExactlyOnceWith("fixture-csrf");
  });

  it("retries a denied snapshot only after refresh and preserves the ordinary role", async () => {
    mocked.gateway.mockResolvedValueOnce({ subject: "fixture", csrf_token: "fixture-csrf" })
      .mockRejectedValueOnce(new ApiError("permission_denied", 403, null))
      .mockResolvedValueOnce({ subject: "fixture", csrf_token: "fixture-csrf" })
      .mockResolvedValueOnce({ permissions: ["console.read", "tools.read"] });
    render(<AuthProvider><Child /></AuthProvider>);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "common.refresh" }));
    const output = await screen.findByTestId("auth");
    expect(output).toHaveTextContent('"role":"Internal User"');
    expect(output).toHaveTextContent('"token":"managed-cookie-session"');
    expect(mocked.gateway).toHaveBeenCalledTimes(4);
  });

  it.each([503, 500])("shows an identity service failure (%i) without entering the login route", async (status) => {
    mocked.gateway.mockRejectedValueOnce(new ApiError("unavailable", status, null));
    render(<AuthProvider><Child /></AuthProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent("managedAuth.unavailable");
    expect(screen.queryByTestId("auth")).not.toBeInTheDocument();
    expect(mocked.gateway).toHaveBeenCalledTimes(1);
  });

  it.each(["me", "snapshot", "config"])("exposes an unauthenticated state only for a 401 from %s", async (stage) => {
    mocked.gateway.mockImplementation(async (operation) => {
      if (operation === stage) throw new ApiError("unauthenticated", 401, null);
      return operation === "me" ? { subject: "fixture", csrf_token: "fixture-csrf" } : { permissions: [] };
    });
    if (stage === "config") mocked.config.mockRejectedValueOnce(new ApiError("unauthenticated", 401, null));
    render(<AuthProvider><Child /></AuthProvider>);
    expect(await screen.findByTestId("auth")).toHaveTextContent('"token":null');
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mocked.csrf).toHaveBeenLastCalledWith("");
  });

  it.each([403, 503])("keeps UI configuration failure (%i) visible", async (status) => {
    mocked.gateway.mockResolvedValueOnce({ subject: "fixture", csrf_token: "fixture-csrf" })
      .mockResolvedValueOnce({ permissions: ["models.write"] });
    mocked.config.mockRejectedValueOnce(new ApiError("config_unavailable", status, null));
    render(<AuthProvider><Child /></AuthProvider>);
    expect(await screen.findByRole("alert")).toHaveTextContent(status === 403 ? "managedAuth.denied" : "managedAuth.unavailable");
    expect(screen.queryByTestId("auth")).not.toBeInTheDocument();
    expect(mocked.csrf).toHaveBeenCalledExactlyOnceWith("fixture-csrf");
  });

  it("stops initialization when a pending snapshot finishes after unmount", async () => {
    let finish: (value: { permissions: string[] }) => void = () => { throw new Error("snapshot not requested"); };
    mocked.gateway.mockResolvedValueOnce({ subject: "fixture", csrf_token: "fixture-csrf" })
      .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const view = render(<AuthProvider><Child /></AuthProvider>);
    await waitFor(() => expect(mocked.gateway).toHaveBeenCalledTimes(2));
    view.unmount();
    finish({ permissions: ["models.write"] });
    await Promise.resolve();
    expect(mocked.config).not.toHaveBeenCalled();
  });
});
