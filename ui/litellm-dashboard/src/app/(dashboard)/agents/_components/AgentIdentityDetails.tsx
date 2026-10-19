"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import type { components } from "@/lib/http/schema";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/networking";
import { Button } from "@/components/ui/button";
import { readAgentIdentity } from "./agent_identity";

const authenticationMessage = (error: boolean, lastAuthenticated?: string | null): string => {
  if (error) return "Could not load authentication evidence";
  if (lastAuthenticated) return `Last authenticated identity match: ${new Date(lastAuthenticated).toLocaleString()}`;
  return "Configured, awaiting an authenticated request";
};

export const AgentIdentityDetails = ({
  agentId,
  identity: value,
  accessToken,
  isAdmin,
}: {
  agentId: string;
  identity: unknown;
  accessToken: string | null;
  isAdmin: boolean;
}) => {
  const { t: uiT } = useDashboardLanguage();

  const identity = readAgentIdentity(value);
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["agent-identity", agentId, identity],
    queryFn: () =>
      apiClient.get<components["schemas"]["ManagedAgentIdentityStatus"]>(
        `/v1/agents/${encodeURIComponent(agentId)}/identity`,
        {
          accessToken: accessToken ?? "",
        },
      ),
    enabled: Boolean(isAdmin && accessToken && identity),
  });

  if (!identity || !isAdmin) return null;
  const executionLabel = data?.enabled ? "Enabled" : "Disabled";
  return (
    <section aria-label={uiT("ui.7a23ac9bb939a97e")} className="mb-6 space-y-2 rounded-lg border border-border p-4">
      <h3 className="font-medium">{uiT("ui.cee7a52717a81598")}</h3>
      <p className="text-sm">
        {uiT("ui.4bfda820af2a8501")} <span className="font-mono">{identity.tenant_id}</span>
      </p>
      <>
        <p className="text-sm">
          {uiT("ui.b4969a9e043fed0e")} <span className="font-mono">{identity.client_id}</span>
        </p>
        <p className="text-sm">
          {uiT("ui.c34f773650a1bd73")} {identity.service_principal_id || uiT("ui.dd1841d295024256")}
        </p>
      </>
      <p className="text-sm">
        {uiT("ui.639fd433f6dc9987")} {data ? executionLabel : uiT("ui.dc380888c4e2")} {uiT("ui.81aea8d1a31a438f")}{" "}
        {data?.execution_mode ?? uiT("ui.dc380888c4e2")}
      </p>
      <p className="text-sm">
        {data?.identity?.active === false
          ? uiT("ui.744ab66488329a13")
          : authenticationMessage(isError, data?.last_authenticated_at)}
      </p>
      <p className="text-xs text-muted-foreground">{uiT("ui.1e408ca7faa2f91b")}</p>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          {uiT("ui.8cde430800f5d0f1")}
        </Button>
        <a className="text-sm underline" href="/ui/logs/">
          {uiT("ui.6d5544f8243ebac3")}
        </a>
      </div>
    </section>
  );
};
