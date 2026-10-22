import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Models, Workspace } from "./Models";
import { GatewaySession } from "./Shared";
import { cnyToUsd } from "@/utils/currency";
import type { Locale } from "@/i18n";

afterEach(() => vi.unstubAllGlobals());

function setup(workspace = false, locale: Locale = "en") {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    const path = new URL(input instanceof Request ? input.url : String(input), "http://localhost").pathname;
    if (path.endsWith("/model-config"))
      return Response.json({
        revision: "r1",
        models: [{ id: "chat", label: "Chat" }],
        users: [{ subject: "operator", label: "Operator", max_budget: 100, spend: 0.025, models: ["chat"], enabled: true, rpm_limit: 100 }],
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
        <LanguageProvider initialLocale={locale}>{workspace ? <Workspace /> : <Models kind="users" />}</LanguageProvider>
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
  const input = screen.getByLabelText("Budget (CNY)");
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

it.each([
  { locale: "en", budget: "Budget (CNY)", spend: "Spend (CNY)", edit: "Edit", save: "Save" },
  { locale: "zh", budget: "预算上限（人民币）", spend: "已用金额（人民币）", edit: "编辑", save: "保存" },
] as const)("keeps $locale budget labels and edits consistent with CNY amounts", async ({ locale, budget, spend, edit, save }) => {
  const { write, client } = setup(false, locale);
  expect(await screen.findByRole("button", { name: budget, exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: spend, exact: true })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: edit, exact: true }));
  const input = screen.getByLabelText(budget);
  fireEvent.change(input, { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: save, exact: true }));
  const expected = { max_budget: cnyToUsd(100), models: ["chat"], enabled: true, rpm_limit: 100 };
  await waitFor(() => expect(write).toHaveBeenCalledWith("model-config", expect.objectContaining({
    data: expect.objectContaining(expected),
  }), "PUT"));
  client.clear();
});

it("converts workspace spend and keeps an absent budget distinct from zero", async () => {
  const { client } = setup(true);
  expect(await screen.findByText("¥0.17")).toBeVisible();
  expect(screen.getByText("-")).toBeVisible();
  client.clear();
});
