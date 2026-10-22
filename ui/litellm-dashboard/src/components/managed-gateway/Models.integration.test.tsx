import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Models, Workspace } from "./Models";
import { GatewaySession } from "./Shared";

afterEach(() => vi.unstubAllGlobals());

function setup(workspace = false) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    const path = new URL(input instanceof Request ? input.url : String(input), "http://localhost").pathname;
    if (path.endsWith("/model-config"))
      return Response.json({
        revision: "r1",
        models: [],
        users: [{ subject: "operator", label: "Operator", max_budget: 100, spend: 0.025, models: [], enabled: true }],
      });
    if (path.endsWith("/model-members"))
      return Response.json({ members: [{ subject: "operator", label: "Operator" }] });
    if (path.endsWith("/model-self")) return Response.json({ models: [], max_budget: null, spend: 0.025 });
    if (path.endsWith("/personal-account")) return Response.json({ accounts: [] });
    return Response.json({ error: "unexpected_request" }, { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
  const write = vi.fn().mockResolvedValue({});
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GatewaySession.Provider value={{ me: {}, snapshot: { permissions: ["models.write"] }, write }}>
        <LanguageProvider initialLocale="en">{workspace ? <Workspace /> : <Models kind="users" />}</LanguageProvider>
      </GatewaySession.Provider>
    </QueryClientProvider>,
  );
  return { write, client };
}

it("shows CNY grants and saves a typed CNY budget as USD", async () => {
  const { write, client } = setup();
  expect(await screen.findByText("¥680.00")).toBeVisible();
  expect(screen.getByText("¥0.17")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  const input = screen.getByLabelText(/¥/);
  expect(input).toHaveValue("680");
  fireEvent.change(input, { target: { value: "" } });
  await userEvent.setup().type(input, "0.068");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(write).toHaveBeenCalledWith(
      "model-config",
      expect.objectContaining({
        kind: "users",
        id: "operator",
        data: expect.objectContaining({ max_budget: 0.01 }),
      }),
      "PUT",
    ),
  );
  client.clear();
});

it("converts workspace spend and keeps an absent budget distinct from zero", async () => {
  const { client } = setup(true);
  expect(await screen.findByText("¥0.17")).toBeVisible();
  expect(screen.getByText("-")).toBeVisible();
  client.clear();
});
