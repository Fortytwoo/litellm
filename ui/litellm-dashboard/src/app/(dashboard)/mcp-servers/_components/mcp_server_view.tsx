"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { mcpServersKeys } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MCPServer, TRANSPORT, handleTransport, handleAuth } from "@/components/mcp_tools/types";
// TODO: Move Tools viewer from index file
import { MCPToolsViewer } from ".";
import MCPServerEdit, { EDIT_OAUTH_UI_STATE_KEY } from "./mcp_server_edit";
import { MCPServerUserCredentialsPanel } from "./MCPServerUserCredentialsPanel";
import { getSecureItem } from "@/utils/secureStorage";
import { isProxyAdminRole, isProxyAdminTierRole } from "@/utils/roles";
import MCPServerCostDisplay from "./mcp_server_cost_display";
import { StdioDisabledBanner } from "./StdioAvailability";
import { getMaskedAndFullUrl, getMCPNetworkAccess } from "./utils";
import { copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";
import { CheckIcon, CopyIcon } from "lucide-react";

interface MCPServerViewProps {
  mcpServer: MCPServer;
  onBack: () => void;
  isProxyAdmin: boolean;
  isEditing: boolean;
  accessToken: string | null;
  userRole: string | null;
  userID: string | null;
  isViewOnly?: boolean;
  availableAccessGroups: string[];
  existingServers?: MCPServer[];
  initialTabIndex?: number;
  stdioEnabled?: boolean;
}

// True when this render is the return from the edit-settings OAuth redirect for this
// server: the edit form wrote its UI-state snapshot before redirecting. Used to open
// the editing Settings tab on first render instead of defaulting to Overview.
function isReturningFromEditOAuth(isProxyAdmin: boolean, serverId: string): boolean {
  if (typeof window === "undefined" || !isProxyAdmin) {
    return false;
  }
  const stored = getSecureItem(EDIT_OAUTH_UI_STATE_KEY);
  if (!stored) {
    return false;
  }
  try {
    return JSON.parse(stored)?.serverId === serverId;
  } catch {
    return false;
  }
}

export const MCPServerView: React.FC<MCPServerViewProps> = ({
  mcpServer,
  onBack,
  isEditing,
  isProxyAdmin,
  accessToken,
  userRole,
  userID,
  isViewOnly = false,
  availableAccessGroups,
  existingServers,
  initialTabIndex = 0,
  stdioEnabled = true,
}) => {
  const { t: uiT } = useDashboardLanguage();

  // Open the editing Settings tab on first render when returning from the edit OAuth
  // redirect, so the "token fetched" feedback shows where the user left off (Settings=2).
  const queryClient = useQueryClient();
  const canEdit = isProxyAdmin && !isViewOnly && !mcpServer.is_config;
  const returningFromEditOAuth = isReturningFromEditOAuth(canEdit, mcpServer.server_id);
  const [editing, setEditing] = useState(isEditing || returningFromEditOAuth);
  const [showFullUrl, setShowFullUrl] = useState(false);
  const networkAccess = getMCPNetworkAccess(mcpServer);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [selectedTabIndex, setSelectedTabIndex] = useState(returningFromEditOAuth ? 2 : initialTabIndex);
  const editFormShowsStdioBanner = selectedTabIndex === 2 && editing && canEdit;
  const showStdioBanner = mcpServer.transport === TRANSPORT.STDIO && !stdioEnabled && !editFormShowsStdioBanner;
  const canViewUserCredentials = userRole !== null && isProxyAdminTierRole(userRole);
  const canRevokeUserCredentials = userRole !== null && isProxyAdminRole(userRole) && !isViewOnly;

  const handleSuccess = (updated: MCPServer) => {
    void queryClient.invalidateQueries({ queryKey: mcpServersKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["mcpTools", updated.server_id] });
    setEditing(false);
    onBack();
  };

  const urlValue = mcpServer.url ?? "";
  const { maskedUrl, hasToken } = urlValue ? getMaskedAndFullUrl(urlValue) : { maskedUrl: "—", hasToken: false };

  const renderUrlWithToggle = (url: string | null | undefined, showFull: boolean) => {
    if (!url) return "—";
    if (!hasToken) return url;
    return showFull ? url : maskedUrl;
  };

  const copyToClipboard = async (text: string | null | undefined, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const getTransportBadge = (transport: string) => <Badge variant="outline">{transport.toUpperCase()}</Badge>;

  const getAuthBadge = (authType: string) => <Badge variant="outline">{authType}</Badge>;

  return (
    <div className="max-w-full p-4">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          <ArrowLeft />
          {uiT("ui.741f8d598c018618")}
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">
            {mcpServer.server_name || mcpServer.alias || uiT("ui.fbe82fb867f31b34")}
          </h1>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={uiT("ui.9758ba7e0b38a9fd")}
            onClick={() => copyToClipboard(mcpServer.server_name || mcpServer.alias, "mcp-server_name")}
          >
            {copiedStates["mcp-server_name"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </Button>
          {mcpServer.alias && mcpServer.server_name && mcpServer.alias !== mcpServer.server_name && (
            <Badge variant="secondary" className="ml-2 font-mono">
              {mcpServer.alias}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <p className="font-mono text-xs text-muted-foreground">{mcpServer.server_id}</p>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={uiT("ui.3e708a2735eb6423")}
            onClick={() => copyToClipboard(mcpServer.server_id, "mcp-server-id")}
          >
            {copiedStates["mcp-server-id"] ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
          </Button>
        </div>
        {mcpServer.description && <p className="mt-2 text-sm text-muted-foreground">{mcpServer.description}</p>}
      </div>

      {showStdioBanner && <StdioDisabledBanner />}

      <Tabs value={String(selectedTabIndex)} onValueChange={(v: unknown) => setSelectedTabIndex(Number(v))}>
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="0" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.d4b1ea5708dd")}
          </TabsTrigger>
          <TabsTrigger value="1" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.ecd806d3c25e667a")}
          </TabsTrigger>
          {isProxyAdmin && (
            <TabsTrigger value="2" className="flex-none rounded-none px-4 py-2">
              {uiT("ui.74a883a037bc")}
            </TabsTrigger>
          )}
          {canViewUserCredentials && (
            <TabsTrigger value="3" className="flex-none rounded-none px-4 py-2">
              {uiT("ui.8e1a22b849f51bb4")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Panel */}
        <TabsContent value="0" keepMounted>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {uiT("ui.aaead4abf5d0fd5e")}
              </p>
              <div className="mt-3">
                {getTransportBadge(handleTransport(mcpServer.transport ?? undefined, mcpServer.spec_path ?? undefined))}
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {uiT("ui.66880d2d8216260d")}
              </p>
              <div className="mt-3">{getAuthBadge(handleAuth(mcpServer.auth_type ?? undefined))}</div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {uiT("ui.dae951acf769351a")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <p className="overflow-wrap-anywhere font-mono text-sm break-all">
                  {renderUrlWithToggle(mcpServer.url, showFullUrl)}
                </p>
                {/* Only proxy admins may reveal the raw URL — non-admins
                    receive a sanitized server object from the backend
                    with `url=null`, but hide the toggle anyway as
                    defense-in-depth in case the URL ever leaks back
                    into the response. */}
                {hasToken && isProxyAdmin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={showFullUrl ? uiT("ui.53fdca381a8fba29") : uiT("ui.ba289ab924cf8b8b")}
                    onClick={() => setShowFullUrl(!showFullUrl)}
                  >
                    {showFullUrl ? <EyeOff /> : <Eye />}
                  </Button>
                )}
              </div>
            </Card>
          </div>
          <Card className="mt-4 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {uiT("ui.20a90e67e23542a2")}
            </p>
            <div className="mt-3">
              <MCPServerCostDisplay costConfig={mcpServer.mcp_info?.mcp_server_cost_info} />
            </div>
          </Card>
        </TabsContent>

        {/* Tool Panel */}
        <TabsContent value="1" keepMounted>
          <MCPToolsViewer
            serverId={mcpServer.server_id}
            accessToken={accessToken}
            auth_type={mcpServer.auth_type}
            oauth2_flow={mcpServer.oauth2_flow}
            delegate_auth_to_upstream={mcpServer.delegate_auth_to_upstream}
            dcr_bridge={mcpServer.dcr_bridge}
            tokenUrl={mcpServer.token_url}
            userRole={userRole}
            userID={userID}
            serverAlias={mcpServer.alias}
            extraHeaders={mcpServer.extra_headers}
          />
        </TabsContent>

        {/* Settings Panel */}
        <TabsContent value="2" keepMounted>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">{uiT("ui.7b3667d5d6be4d9b")}</h2>
              {editing && canEdit ? null : (
                <Button variant="outline" disabled={!canEdit} onClick={() => setEditing(true)}>
                  {uiT("ui.cddc5824575b")}
                </Button>
              )}
            </div>
            {mcpServer.is_config && <p className="mb-4 text-sm text-muted-foreground">{uiT("ui.2cb7c2901b34faa9")}</p>}
            {editing && canEdit ? (
              <MCPServerEdit
                mcpServer={mcpServer}
                accessToken={accessToken}
                userID={userID}
                onCancel={() => setEditing(false)}
                onSuccess={handleSuccess}
                availableAccessGroups={availableAccessGroups}
                existingServers={existingServers}
                stdioEnabled={stdioEnabled}
              />
            ) : (
              <div className="divide-y divide-border">
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.bc4816425ebe8079")}</p>
                  <div className="col-span-2 text-sm">
                    {mcpServer.server_name || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.b19e02e9502bbe5a")}</p>
                  <div className="col-span-2 font-mono text-sm">
                    {mcpServer.alias || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.526e0087cc3f")}</p>
                  <div className="col-span-2 text-sm">
                    {mcpServer.description || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">URL</p>
                  <div className="col-span-2 flex items-center gap-2 font-mono text-sm break-all">
                    {renderUrlWithToggle(mcpServer.url, showFullUrl)}
                    {hasToken && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={showFullUrl ? uiT("ui.53fdca381a8fba29") : uiT("ui.ba289ab924cf8b8b")}
                        onClick={() => setShowFullUrl(!showFullUrl)}
                      >
                        {showFullUrl ? <EyeOff /> : <Eye />}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.aaead4abf5d0fd5e")}</p>
                  <div className="col-span-2">
                    {getTransportBadge(handleTransport(mcpServer.transport, mcpServer.spec_path))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.66880d2d8216260d")}</p>
                  <div className="col-span-2">{getAuthBadge(handleAuth(mcpServer.auth_type))}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.3c1aeb3d156fdd97")}</p>
                  <div className="col-span-2 text-sm">
                    {mcpServer.extra_headers && mcpServer.extra_headers.length > 0 ? (
                      mcpServer.extra_headers.join(", ")
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.51df80a79d83384c")}</p>
                  <div className="col-span-2">
                    {mcpServer.allow_all_keys ? (
                      <Badge variant="outline">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {uiT("ui.92c1cdfdf4cb")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{uiT("ui.75081b593d15")}</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.0226fc91b55c9cfa")}</p>
                  <div className="col-span-2">
                    <Badge variant="outline">
                      <span className={`h-1.5 w-1.5 rounded-full ${networkAccess.dotClassName}`} />
                      {networkAccess.label}
                    </Badge>
                    <p className="mt-2 text-xs text-muted-foreground">{networkAccess.description}</p>
                  </div>
                </div>
                {handleAuth(mcpServer.auth_type) === "oauth2" && (
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <p className="text-sm font-medium text-muted-foreground">{uiT("ui.12e66592a51ca540")}</p>
                    <div className="col-span-2">
                      {mcpServer.delegate_auth_to_upstream ? (
                        <Badge variant="outline">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {uiT("ui.7d2a315d803650ce")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{uiT("ui.75081b593d15")}</Badge>
                      )}
                    </div>
                  </div>
                )}
                {handleAuth(mcpServer.auth_type) !== "oauth2" &&
                  Array.isArray(mcpServer.extra_headers) &&
                  mcpServer.extra_headers.some((h) => typeof h === "string" && h.toLowerCase() === "authorization") && (
                    <div className="grid grid-cols-3 gap-4 py-3">
                      <p className="text-sm font-medium text-muted-foreground">{uiT("ui.4ee6e62c3a3a22ac")}</p>
                      <div className="col-span-2">
                        {mcpServer.oauth_passthrough ? (
                          <Badge variant="outline">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            {uiT("ui.92c1cdfdf4cb")}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{uiT("ui.75081b593d15")}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.b0252ccc6e86")}</p>
                  <div className="col-span-2">
                    {mcpServer.mcp_access_groups && mcpServer.mcp_access_groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mcpServer.mcp_access_groups.map((group: any, index: number) => (
                          <Badge key={index} variant="secondary">
                            {typeof group === "string" ? group : group?.name ?? ""}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.40c14c3addf57fe1")}</p>
                  <div className="col-span-2">
                    {mcpServer.allowed_tools && mcpServer.allowed_tools.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {mcpServer.allowed_tools.map((tool: string, index: number) => (
                          <Badge key={index} variant="secondary" className="font-mono">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline">{uiT("ui.4e1975aae4aa0c7a")}</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground">{uiT("ui.204a5eb2cd28")}</p>
                  <div className="col-span-2">
                    <MCPServerCostDisplay costConfig={mcpServer.mcp_info?.mcp_server_cost_info} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {canViewUserCredentials && (
          <TabsContent value="3">
            <Card className="p-6">
              <MCPServerUserCredentialsPanel
                serverId={mcpServer.server_id}
                accessToken={accessToken}
                canRevoke={canRevokeUserCredentials}
              />
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
