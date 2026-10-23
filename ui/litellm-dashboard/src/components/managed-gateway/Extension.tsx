"use client";

import { Models, Workspace } from "./Models";
import { Access, Accounts } from "./Access";
import { Tools } from "./Tools";
import { GatewaySession, Notice, useGatewayQuery, useWriter } from "./Shared";
import { str, strings } from "@/lib/http/managedGateway";
import { useCopy } from "./locale";
import { Audit } from "./Audit";
import { RequestCache } from "./RequestCache";

export type ExtensionPage =
  | "services"
  | "request-cache"
  | "tools"
  | "members"
  | "departments"
  | "accounts"
  | "audit"
  | "grants"
  | "apis"
  | "overview"
  | "usage";
const permissions = {
  services: "services.read",
  "request-cache": "services.read",
  tools: "tools.read",
  members: "policy.write",
  departments: "policy.write",
  accounts: "console.read",
  audit: "audit.read",
  grants: "models.write",
  apis: "models.write",
  overview: "console.read",
  usage: "console.read",
} as const;

/** Business pages render inside the existing LiteLLM dashboard layout. */
export function GatewayExtension({ page }: { page: ExtensionPage }) {
  const t = useCopy();
  const me = useGatewayQuery("me");
  const snapshot = useGatewayQuery("snapshot", undefined, !!me.data);
  const write = useWriter(str(me.data?.csrf_token));
  if (me.isPending || snapshot.isPending) return <p className="p-6">{t("loading")}</p>;
  if (me.error || snapshot.error) return <Notice error={me.error || snapshot.error} />;
  if (!strings(snapshot.data?.permissions).includes(permissions[page])) return <Notice error={t("noAccess")} />;
  const views = {
    services: <Tools services />,
    "request-cache": <RequestCache />,
    tools: <Tools />,
    members: <Access />,
    departments: <Access departments />,
    accounts: <Accounts />,
    audit: <Audit />,
    grants: <Models kind="users" />,
    apis: <Models kind="apis" />,
    overview: <Workspace />,
    usage: <Workspace usage />,
  };
  return (
    <GatewaySession.Provider value={{ me: me.data ?? {}, snapshot: snapshot.data ?? {}, write }}>
      <section className="mx-auto max-w-7xl space-y-5 p-6">
        <h1 className="text-2xl font-semibold">{t(page)}</h1>
        {views[page]}
      </section>
    </GatewaySession.Provider>
  );
}
