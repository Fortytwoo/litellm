"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import VectorStorePermissions from "./permissions/VectorStorePermissions";
import MCPServerPermissions from "./permissions/MCPServerPermissions";
import AgentPermissions from "./permissions/AgentPermissions";
import type { ObjectPermission } from "./object_permission_types";
import type { InheritedGrant } from "./permissions/inheritedGrants";

interface ObjectPermissionsViewProps {
  objectPermission?: ObjectPermission | null;
  inheritedMcpServers?: InheritedGrant[];
  inheritedAgents?: InheritedGrant[];
  variant?: "card" | "inline";
  className?: string;
  accessToken?: string | null;
}

export function ObjectPermissionsView({
  objectPermission,
  inheritedMcpServers = [],
  inheritedAgents = [],
  variant = "card",
  className = "",
  accessToken,
}: ObjectPermissionsViewProps) {
  const { t: uiT } = useDashboardLanguage();

  const vectorStores = objectPermission?.vector_stores || [];
  const mcpServers = objectPermission?.mcp_servers || [];
  const mcpAccessGroups = objectPermission?.mcp_access_groups || [];
  const mcpToolPermissions = objectPermission?.mcp_tool_permissions || {};
  const mcpToolsets = objectPermission?.mcp_toolsets || [];
  const agents = objectPermission?.agents || [];
  const agentAccessGroups = objectPermission?.agent_access_groups || [];
  const searchTools = objectPermission?.search_tools || [];
  const skills = objectPermission?.skills || [];

  const content = (
    <div className={variant === "card" ? "grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-6" : "space-y-4"}>
      <VectorStorePermissions vectorStores={vectorStores} accessToken={accessToken} />
      <MCPServerPermissions
        mcpServers={mcpServers}
        mcpAccessGroups={mcpAccessGroups}
        mcpToolPermissions={mcpToolPermissions}
        mcpToolsets={mcpToolsets}
        inheritedMcpServers={inheritedMcpServers}
        accessToken={accessToken}
      />
      <AgentPermissions
        agents={agents}
        agentAccessGroups={agentAccessGroups}
        inheritedAgents={inheritedAgents}
        accessToken={accessToken}
      />
      <div className="min-w-0 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">{uiT("ui.fbd165231fa1ce0d")}</p>
        {searchTools.length === 0 ? (
          <p className="mt-1 block text-xs text-muted-foreground">{uiT("ui.7e623a84ed20131c")}</p>
        ) : (
          <p className="mt-1 block text-xs break-words text-foreground">{searchTools.join(", ")}</p>
        )}
      </div>
      <div className="min-w-0 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">{uiT("ui.66d0f523a379")}</p>
        {skills.length === 0 ? (
          <p className="mt-1 block text-xs text-muted-foreground">{uiT("ui.919d6edea1e5c702")}</p>
        ) : (
          <p className="mt-1 block text-xs break-words text-foreground">{skills.join(", ")}</p>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <div className={`@container bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-6">
          <div>
            <p className="font-semibold text-foreground">{uiT("ui.d614e6a34961d24b")}</p>
            <p className="text-xs text-muted-foreground">{uiT("ui.4d04d8c7d2dbb3d7")}</p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <p className="font-medium text-foreground mb-3">{uiT("ui.d614e6a34961d24b")}</p>
      {content}
    </div>
  );
}

export default ObjectPermissionsView;
