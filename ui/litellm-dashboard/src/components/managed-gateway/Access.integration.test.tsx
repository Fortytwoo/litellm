import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { gateway } from "@/lib/http/managedGateway";
import { Accounts } from "./Access";
import { GatewaySession } from "./Shared";

afterEach(() => vi.unstubAllGlobals());

function renderAccounts({ administrator = true, directoryFails = false, missingBindings = false } = {}) {
  localStorage.clear();
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    const path = new URL(input instanceof Request ? input.url : String(input), "http://localhost").pathname;
    if (path.endsWith("/personal-account")) return Response.json({ accounts: [] });
    if (path.endsWith("/directory")) {
      return directoryFails
        ? Response.json({ error: "directory_unavailable" }, { status: 503 })
        : Response.json({
            members: [
              { subject: "alice", label: "Alice" },
              { subject: "bob", label: "Bob" },
              { subject: "carol", label: "Carol" },
            ],
          });
    }
    if (path.endsWith("/yuntu-account-catalog"))
      return Response.json({
        accounts: [],
        ...(missingBindings
          ? {}
          : {
              bindings: [
                {
                  subject: "alice",
                  label: "Shared account",
                  source: "admin_grant",
                  grant_enabled: true,
                  account_enabled: true,
                  is_default: true,
                },
                {
                  subject: "bob",
                  label: "Shared account",
                  source: "admin_grant",
                  grant_enabled: false,
                  account_enabled: true,
                  is_default: false,
                },
                {
                  subject: "alice",
                  label: "Personal account",
                  source: "self_login",
                  grant_enabled: true,
                  account_enabled: false,
                  is_default: false,
                },
              ],
            }),
      });
    return Response.json({ error: "unexpected_request" }, { status: 404 });
  });
  vi.stubGlobal("fetch", fetch);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GatewaySession.Provider
        value={{
          me: {},
          snapshot: { permissions: administrator ? ["policy.write"] : [] },
          write: (operation, body) => gateway(operation, { method: "POST", body }),
        }}
      >
        <LanguageProvider initialLocale="en">
          <Accounts />
        </LanguageProvider>
      </GatewaySession.Provider>
    </QueryClientProvider>,
  );
  return { fetch, client };
}

it("shows member names, shared accounts, ownership, revoked access, disabled accounts and saved defaults", async () => {
  const { fetch, client } = renderAccounts();
  const overview = screen.getByRole("region", { name: "User account bindings" });
  expect(
    await within(overview).findByRole("row", {
      name: "Alice Shared account Administrator grant Enabled Default",
    }),
  ).toBeVisible();
  expect(
    within(overview).getByRole("row", {
      name: "Bob Shared account Administrator grant Grant revoked Not default",
    }),
  ).toBeVisible();
  expect(
    within(overview).getByRole("row", {
      name: "Alice Personal account Personal login Account disabled Not default",
    }),
  ).toBeVisible();
  expect(within(overview).getByRole("row", { name: "Carol Not bound Not bound" })).toBeVisible();
  fireEvent.change(within(overview).getByRole("textbox"), { target: { value: "Shared account" } });
  expect(within(overview).getAllByRole("row")).toHaveLength(3);
  expect(within(overview).queryByRole("cell", { name: "Carol" })).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(3);
  client.clear();
});

it.each([{ directoryFails: true }, { missingBindings: true }])(
  "shows a failed-read state instead of claiming users are unbound: %o",
  async (options) => {
    const { client } = renderAccounts(options);
    const overview = screen.getByRole("region", { name: "User account bindings" });
    expect(await within(overview).findByRole("alert")).toHaveTextContent("Could not load account bindings");
    expect(within(overview).getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(within(overview).queryByRole("table")).not.toBeInTheDocument();
    client.clear();
  },
);

it("keeps cross-user bindings and directory reads out of the ordinary member view", async () => {
  const { fetch, client } = renderAccounts({ administrator: false });
  expect(await screen.findByText("No records")).toBeVisible();
  expect(screen.queryByRole("region", { name: "User account bindings" })).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  client.clear();
});
