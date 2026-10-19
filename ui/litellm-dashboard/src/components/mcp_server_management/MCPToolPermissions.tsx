"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { listMCPTools } from "../networking";
import { MCPTool } from "../mcp_tools/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useMCPServers } from "../../app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useMCPAccessGroups } from "../../app/(dashboard)/hooks/mcpServers/useMCPAccessGroups";
import { useMCPToolsets } from "../../app/(dashboard)/hooks/mcpServers/useMCPToolsets";
import McpCrudPermissionPanel from "../mcp_tools/McpCrudPermissionPanel";
import { classifyToolOp } from "../../utils/mcpToolCrudClassification";
import { MCP_ALL_TOOLS_WILDCARD, NO_MCP_SERVERS_SENTINEL } from "../mcp_tools/constants";
import {
  EffectiveMcpServer,
  McpGrantSource,
  applyToolPermissionWrite,
  emptyMcpAccessGroups,
  mcpAllowedToolsFor,
  mcpGrantsAllTools,
  resolveEffectiveMcpServers,
} from "./effectiveMcpServers";

interface MCPToolPermissionsProps {
  accessToken: string;
  selectedServers: readonly string[];
  selectedAccessGroups?: readonly string[];
  selectedToolsets?: readonly string[];
  toolPermissions: Record<string, string[]>;
  onChange: (toolPermissions: Record<string, string[]>) => void;
  disabled?: boolean;
}

const NO_SELECTION: readonly string[] = [];

interface InheritedBadge {
  readonly label: string;
  readonly className: string;
}

const inheritedBadgeFor = (source: McpGrantSource): InheritedBadge | null => {
  switch (source.kind) {
    case "direct":
      return null;
    case "accessGroup":
      return {
        get label() {
          return translateUi("ui.2bc003b3ab4f77e9", undefined, { v0: String(source.name) });
        },
        className: "text-green-700 bg-green-50 border-green-200",
      };
    case "toolset":
      return {
        get label() {
          return translateUi("ui.82bf9eb27a906018", undefined, { v0: String(source.name) });
        },
        className: "text-purple-700 bg-purple-50 border-purple-200",
      };
    case "toolPermission":
      return {
        get label() {
          return translateUi("ui.8470fde446efba1a");
        },
        className: "text-amber-700 bg-amber-50 border-amber-200",
      };
  }
};

const MCPToolPermissions: React.FC<MCPToolPermissionsProps> = ({
  accessToken,
  selectedServers,
  selectedAccessGroups = NO_SELECTION,
  selectedToolsets = NO_SELECTION,
  toolPermissions,
  onChange,
  disabled = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const {
    data: allServers = [],
    isError: serversFailed,
    isLoading: serversLoading,
    isSuccess: serversLoaded,
  } = useMCPServers();
  const { data: populatedAccessGroups = [], isSuccess: accessGroupsLoaded } = useMCPAccessGroups();
  const { data: toolsets = [], isError: toolsetsFailed, isLoading: toolsetsLoading } = useMCPToolsets();
  const [serverTools, setServerTools] = useState<Record<string, MCPTool[]>>({});
  const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({});
  const [toolErrors, setToolErrors] = useState<Record<string, string>>({});
  const [viewModes, setViewModes] = useState<Record<string, "crud" | "flat">>({});

  // Keep a ref to the latest toolPermissions so async fetch callbacks always
  // read the current value and do not overwrite sibling servers' results when
  // multiple fetches complete out-of-order (stale-closure race condition).
  const toolPermissionsRef = useRef(toolPermissions);
  useEffect(() => {
    toolPermissionsRef.current = toolPermissions;
  }, [toolPermissions]);

  // Every server this permission level reaches, not just the directly selected ones: a server
  // reached through an access group or a toolset needs its allowlist visible and editable too.
  const effectiveMcpInput = {
    allServers,
    selectedServers,
    selectedAccessGroups,
    selectedToolsets,
    toolsets,
    toolPermissions,
  };
  const servers = useMemo(
    () => resolveEffectiveMcpServers(effectiveMcpInput),
    [allServers, selectedServers, selectedAccessGroups, selectedToolsets, toolsets, toolPermissions],
  );

  // Fetch tools for a specific server; applies delete-blocked-by-default for new servers.
  // `token` is passed explicitly so the closure never captures a stale accessToken.
  const fetchToolsForServer = async (entry: EffectiveMcpServer, token: string) => {
    const serverId = entry.server.server_id;
    setLoadingTools((prev) => ({ ...prev, [serverId]: true }));
    setToolErrors((prev) => ({ ...prev, [serverId]: "" }));

    try {
      const response = await listMCPTools(token, serverId);

      if (response.error) {
        setToolErrors((prev) => ({ ...prev, [serverId]: response.message || "Failed to fetch tools" }));
        setServerTools((prev) => ({ ...prev, [serverId]: [] }));
      } else {
        const fetchedTools: MCPTool[] = response.tools || [];
        setServerTools((prev) => ({ ...prev, [serverId]: fetchedTools }));

        // Default only unrestricted direct servers to non-delete tools.
        // Read latest permissions from the ref to avoid clobbering concurrent results.
        const latestPermissions = toolPermissionsRef.current;
        const isDirect = entry.source.kind === "direct";
        const unrestricted =
          mcpAllowedToolsFor(entry.server, latestPermissions, allServers) === undefined &&
          entry.toolsetTools === undefined;
        if (isDirect && unrestricted && (selectedToolsets.length === 0 || !toolsetsFailed) && fetchedTools.length > 0) {
          const nonDeleteTools = fetchedTools
            .filter((t) => classifyToolOp(t.name, t.description || "") !== "delete")
            .map((t) => t.name);
          onChange(applyToolPermissionWrite({ toolPermissions: latestPermissions, entry, allowed: nonDeleteTools }));
        }
      }
    } catch (err) {
      console.error(`Error fetching tools for server ${serverId}:`, err);
      setToolErrors((prev) => ({ ...prev, [serverId]: "Failed to fetch tools" }));
      setServerTools((prev) => ({ ...prev, [serverId]: [] }));
    } finally {
      setLoadingTools((prev) => ({ ...prev, [serverId]: false }));
    }
  };

  // Auto-fetch tools when servers or accessToken change
  useEffect(() => {
    if (toolsetsLoading) return;
    servers.forEach((entry) => {
      const serverId = entry.server.server_id;
      if (!serverTools[serverId] && !loadingTools[serverId]) {
        fetchToolsForServer(entry, accessToken);
      }
    });
    // fetchToolsForServer is defined in this render scope but receives `accessToken`
    // as an explicit argument, so it is safe to omit from deps here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, accessToken, toolsetsLoading]);

  // Every write goes through here so an edit is authoritative for the SERVER, not for one of the
  // equivalent keys that may name it.
  const writeAllowedTools = (entry: EffectiveMcpServer, allowed: string[]) => {
    const names = (serverTools[entry.server.server_id] ?? []).map((t) => t.name);
    const next =
      entry.source.kind !== "toolset" && names.length > 0 && names.every((n) => allowed.includes(n))
        ? [MCP_ALL_TOOLS_WILDCARD]
        : allowed;
    onChange(applyToolPermissionWrite({ toolPermissions, entry, allowed: next }));
  };

  const handleSelectAll = (entry: EffectiveMcpServer) => {
    const tools = serverTools[entry.server.server_id] || [];
    writeAllowedTools(
      entry,
      tools.map((t) => t.name),
    );
  };

  // The opt-out sentinel short-circuits the backend resolver to zero servers, so nothing stored
  // here is in force and showing a tool matrix would claim otherwise.
  if (selectedServers.includes(NO_MCP_SERVERS_SENTINEL)) {
    return null;
  }

  const selectionSizes = [
    selectedServers.length,
    selectedAccessGroups.length,
    selectedToolsets.length,
    Object.keys(toolPermissions).length,
  ];
  if (!selectionSizes.some((size) => size > 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {serversFailed && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">{uiT("ui.0330523d28c6a5d2")}</p>
          <p className="text-sm text-yellow-700 mt-1">{uiT("ui.6d4e8c5874a5b74e")}</p>
        </div>
      )}

      {serversLoaded &&
        accessGroupsLoaded &&
        emptyMcpAccessGroups(allServers, populatedAccessGroups, selectedAccessGroups).map((group) => (
          <div key={group} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              {uiT("ui.559faa2c8d7d8362")}
              {group}
              {uiT("ui.dc97a508047865e1")}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {uiT("ui.d963bcc49b8257bf")} <code>access_groups</code> {uiT("ui.418cef757698ab23")}{" "}
              <code>mcp_access_groups</code> {uiT("ui.a85aa64d64ad0795")}
            </p>
          </div>
        ))}

      {toolsetsFailed && selectedToolsets.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">{uiT("ui.1f1bba47045d0c34")}</p>
          <p className="text-sm text-yellow-700 mt-1">{uiT("ui.521e8a6509117157")}</p>
        </div>
      )}

      {serversLoading && (
        <div className="flex items-center justify-center py-6">
          <UiLoadingSpinner />
          <p className="ml-3 text-sm text-muted-foreground">{uiT("ui.ad9662696670490d")}</p>
        </div>
      )}

      {servers.map((entry) => {
        const server = entry.server;
        const serverId = server.server_id;
        const serverName = server.server_name || server.alias || serverId;
        const tools = serverTools[serverId] || [];
        const grantsAll = mcpGrantsAllTools(entry.keyedTools);
        const selectedTools = grantsAll ? tools.map((t) => t.name) : entry.allowedTools ?? tools.map((t) => t.name);
        const isLoading = loadingTools[serverId];
        const error = toolErrors[serverId];
        const viewMode = viewModes[serverId] ?? "crud";
        const inherited = inheritedBadgeFor(entry.source);
        // The backend adds a toolset's tools to whatever this map allows, so these stay on however
        // the boxes are ticked. Locking them is what keeps the matrix an honest picture of the grant.
        const toolsetTools = entry.toolsetTools ?? [];

        return (
          <div key={serverId} className={`border rounded-lg bg-muted ${inherited ? "border-dashed" : ""}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card rounded-t-lg">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{serverName}</p>
                  {inherited && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-semibold border rounded-sm uppercase tracking-wide ${inherited.className}`}
                    >
                      {inherited.label}
                    </span>
                  )}
                </div>
                {server.description && <p className="text-sm text-muted-foreground">{server.description}</p>}
                {grantsAll && <p className="text-sm text-muted-foreground mt-1">{uiT("ui.aaad0e3f57a9ea1b")}</p>}
                {entry.ambiguousKeys.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">
                    {uiT("ui.ecc21b871b347d25", {
                      v0: String(entry.ambiguousKeys.map((key) => `"${key}"`).join(", ")),
                    })}
                  </p>
                )}
                {toolsetTools.length > 0 && (
                  <p className="text-sm text-purple-700 mt-1">
                    {toolsetTools.length === 1
                      ? uiT("ui.1f193bb0fc83ff3e", { v0: String(toolsetTools[0]) })
                      : uiT("ui.d26e159912207129", { v0: String(toolsetTools.join(", ")) })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!disabled && tools.length > 0 && (
                  <RadioGroup
                    value={viewMode}
                    onValueChange={(next) => setViewModes((prev) => ({ ...prev, [serverId]: next as "crud" | "flat" }))}
                    className="flex w-auto items-center gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="crud" />
                      {uiT("ui.a5ef0e28dfa2edeb")}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="flat" />
                      {uiT("ui.3ecbafeeb94edccc")}
                    </label>
                  </RadioGroup>
                )}
                {!disabled && (
                  <>
                    <button
                      type="button"
                      className="text-sm text-info hover:text-info/80 font-medium"
                      onClick={() => handleSelectAll(entry)}
                      disabled={isLoading}
                    >
                      {uiT("ui.d1ec69e64b9609d0")}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-info hover:text-info/80 font-medium"
                      onClick={() => writeAllowedTools(entry, [])}
                      disabled={isLoading}
                    >
                      {uiT("ui.5cd261bcc680ffda")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="p-4">
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <UiLoadingSpinner />
                  <p className="ml-3 text-sm text-muted-foreground">{uiT("ui.efc190cd4ce7585d")}</p>
                </div>
              )}

              {/* Error */}
              {error && !isLoading && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                  <p className="text-sm text-destructive font-medium">{uiT("ui.92334032f1a15115")}</p>
                  <p className="text-sm text-destructive mt-1">{error}</p>
                </div>
              )}

              {/* CRUD grouped view */}
              {!isLoading && !error && tools.length > 0 && viewMode === "crud" && (
                <McpCrudPermissionPanel
                  tools={tools}
                  value={entry.allowedTools === undefined ? undefined : [...selectedTools]}
                  lockedTools={toolsetTools}
                  onChange={(allowed) => writeAllowedTools(entry, allowed)}
                  readOnly={disabled}
                />
              )}

              {/* Flat list view */}
              {!isLoading && !error && tools.length > 0 && viewMode === "flat" && (
                <div className="space-y-2">
                  {tools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.name);
                    const isLocked = toolsetTools.includes(tool.name);
                    return (
                      <div key={tool.name} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          aria-label={tool.name}
                          checked={isSelected}
                          onChange={() => {
                            if (disabled || isLocked) return;
                            const next = isSelected
                              ? selectedTools.filter((n) => n !== tool.name)
                              : [...selectedTools, tool.name];
                            writeAllowedTools(entry, next);
                          }}
                          disabled={disabled || isLocked}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{tool.name}</p>
                            <p className="text-sm text-muted-foreground">
                              - {tool.description || uiT("ui.bcd8cc53f40e3d4e")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && tools.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">{uiT("ui.0ec9813e343bb4e3")}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MCPToolPermissions;
