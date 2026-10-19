"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { AgentIdentityFields } from "./AgentIdentityFields";
import { AgentIdentityDetails } from "./AgentIdentityDetails";
import { withAgentIdentity } from "./agent_identity";
import React, { useState, useEffect, useMemo } from "react";
import { cx } from "@/lib/cva.config";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "@/lib/toast";
import { ArrowLeft } from "lucide-react";
import { getAgentInfo, patchAgentCall, getAgentCreateMetadata, AgentCreateInfo } from "@/components/networking";
import { Agent } from "@/components/agents/types";
import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { useKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useAccessGroups } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import AccessGroupSelector from "@/components/common_components/AccessGroupSelector";
import KeyInfoView from "@/components/templates/key_info_view";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "@/components/mcp_server_management/MCPToolPermissions";
import AgentVirtualKeys from "./agent_virtual_keys";
import AgentKillSwitchDangerZone from "./AgentKillSwitchDangerZone";
import AgentFormFields, { unmountedA2AFieldNames } from "./agent_form_fields";
import DynamicAgentFormFields, { buildDynamicAgentData, unmountedDynamicFieldNames } from "./dynamic_agent_form_fields";
import {
  AGENT_FORM_CONFIG,
  buildAgentDataFromForm,
  buildMcpObjectPermission,
  parseAccessGroupIdsForForm,
  parseAgentForForm,
  parseMcpPermissionsForForm,
} from "./agent_config";
import {
  AgentFormField,
  AgentFormValues,
  AgentNumberInput,
  AgentRequestPayload,
  McpServerSelection,
  labelWithHint,
  omitFieldValues,
  useCollapsiblePanels,
} from "./AgentFormKit";
import AgentCostView from "./agent_cost_view";
import { detectAgentType, parseDynamicAgentForForm } from "./agent_type_utils";
import AgentCardDiscovery, { DiscoveredAgentCardSelection } from "./agent_card_discovery";
import { buildDiscoveryRequest, overlayDiscoveredCardParams } from "./agent_discovery_utils";

interface AgentInfoViewProps {
  agentId: string;
  onClose: () => void;
  accessToken: string | null;
  isAdmin: boolean;
}

const DetailList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <dl
    className={cx(
      "grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)] overflow-hidden rounded-lg border border-border text-sm",
      className,
    )}
  >
    {children}
  </dl>
);

const DetailItem: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <>
    <dt className="border-b border-border bg-muted px-4 py-3 font-medium text-foreground last-of-type:border-b-0">
      {label}
    </dt>
    <dd className="border-b border-border px-4 py-3 break-words text-foreground last-of-type:border-b-0">{children}</dd>
  </>
);

const AgentInfoView: React.FC<AgentInfoViewProps> = ({ agentId, onClose, accessToken, isAdmin }) => {
  const { t: uiT } = useDashboardLanguage();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [selectedKey, setSelectedKey] = useState<KeyResponse | null>(null);
  const { data: keysData, isLoading: keysLoading, refetch: refetchAgentKeys } = useKeys(1, 100, { agentID: agentId });
  const agentKeys = keysData?.keys ?? [];
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<AgentFormValues>({ defaultValues: {} });
  const panels = useCollapsiblePanels([AGENT_FORM_CONFIG.basic.key]);
  const [agentTypeMetadata, setAgentTypeMetadata] = useState<AgentCreateInfo[]>([]);
  const [detectedAgentType, setDetectedAgentType] = useState<string>("a2a");
  const [appliedDiscoveredSelection, setAppliedDiscoveredSelection] = useState<DiscoveredAgentCardSelection | null>(
    null,
  );

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await getAgentCreateMetadata();
        setAgentTypeMetadata(metadata);
      } catch (error) {
        console.error("Error fetching agent metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAgentInfo();
  }, [agentId, accessToken]);

  const fetchAgentInfo = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const data = await getAgentInfo(accessToken, agentId);
      setAgent(data);

      // Detect agent type
      const agentType = detectAgentType(data);
      setDetectedAgentType(agentType);

      // Parse form values based on agent type
      if (agentType === "a2a") {
        form.reset(parseAgentForForm(data));
      } else {
        const typeInfo = agentTypeMetadata.find((t) => t.agent_type === agentType);
        if (typeInfo) {
          form.reset({
            ...parseDynamicAgentForForm(data, typeInfo),
            ...parseMcpPermissionsForForm(data),
            ...parseAccessGroupIdsForForm(data),
          });
        } else {
          form.reset(parseAgentForForm(data));
        }
      }
    } catch (error) {
      console.error("Error fetching agent info:", error);
      toast.error(translateUi("ui.9006afdf9ddeb92b"));
    } finally {
      setIsLoading(false);
    }
  };

  // Re-parse form when metadata is loaded
  useEffect(() => {
    if (agent && agentTypeMetadata.length > 0) {
      const agentType = detectAgentType(agent);
      if (agentType !== "a2a") {
        const typeInfo = agentTypeMetadata.find((t) => t.agent_type === agentType);
        if (typeInfo) {
          form.reset({
            ...parseDynamicAgentForForm(agent, typeInfo),
            ...parseMcpPermissionsForForm(agent),
            ...parseAccessGroupIdsForForm(agent),
          });
        }
      }
    }
  }, [agentTypeMetadata, agent]);

  const selectedAgentTypeInfo = agentTypeMetadata.find((t) => t.agent_type === detectedAgentType);
  const watchedFormValues = useWatch({ control: form.control });
  const mcpSelection = useWatch({ control: form.control, name: "allowed_mcp_servers_and_groups" });
  const mcpToolPermissions = useWatch({ control: form.control, name: "mcp_tool_permissions" });
  const { data: mcpServers = [] } = useMCPServers();
  const { data: accessGroups = [] } = useAccessGroups();

  const mcpServerLabel = (serverId: string) => {
    const server = mcpServers.find((s) => s.server_id === serverId);
    return server?.server_name ? `${server.server_name} (${serverId})` : serverId;
  };

  const accessGroupLabel = (accessGroupId: string) => {
    const group = accessGroups.find((g) => g.access_group_id === accessGroupId);
    return group ? `${group.access_group_name} (${accessGroupId})` : accessGroupId;
  };

  const discoveryRequest = useMemo(
    () => buildDiscoveryRequest(detectedAgentType, watchedFormValues || {}, selectedAgentTypeInfo),
    [watchedFormValues, selectedAgentTypeInfo, detectedAgentType],
  );

  const handleApplyDiscoveredCard = (selection: DiscoveredAgentCardSelection | null) => {
    setAppliedDiscoveredSelection(selection);
    if (!selection) return;
    const { selected_card } = selection;
    const skills = (selected_card.skills ?? []).map((s) => ({
      id: s.id ?? "",
      name: s.name ?? "",
      description: s.description ?? "",
      tags: s.tags ?? [],
      examples: s.examples ?? [],
    }));

    const urlCredentialKeys = (selectedAgentTypeInfo?.credential_fields ?? [])
      .map((f) => f.key)
      .filter((key) => /(^|_)(url|api_base|endpoint)$/i.test(key));

    const fieldsToSet: AgentFormValues = {
      name: selected_card.name ?? undefined,
      description: selected_card.description ?? undefined,
      url: selection.upstream_url,
      streaming: Boolean(selected_card.capabilities?.streaming),
      skills,
      iconUrl: selected_card.iconUrl ?? undefined,
      documentationUrl: selected_card.documentationUrl ?? undefined,
      ...Object.fromEntries(urlCredentialKeys.map((key) => [key, selection.upstream_url])),
    };

    for (const [key, value] of Object.entries(fieldsToSet)) {
      form.setValue(key, value);
    }
  };

  const usesDynamicFields = detectedAgentType !== "a2a" && selectedAgentTypeInfo !== undefined;

  const handleUpdate = async (submitted: AgentFormValues) => {
    if (!accessToken || !agent) return;

    setIsSaving(true);
    try {
      const values = omitFieldValues(
        submitted,
        usesDynamicFields
          ? unmountedDynamicFieldNames(panels.mountedPanels)
          : unmountedA2AFieldNames(panels.mountedPanels),
      );

      const built: AgentRequestPayload = usesDynamicFields
        ? { ...buildDynamicAgentData(values, selectedAgentTypeInfo, agent), agent_name: values.agent_name }
        : buildAgentDataFromForm(values, agent);

      const updateData = appliedDiscoveredSelection
        ? overlayDiscoveredCardParams(built, appliedDiscoveredSelection.selected_card)
        : built;
      const cardEdited =
        Boolean(appliedDiscoveredSelection) ||
        [AGENT_FORM_CONFIG.basic, AGENT_FORM_CONFIG.skills, AGENT_FORM_CONFIG.capabilities, AGENT_FORM_CONFIG.optional]
          .flatMap((section) => section.fields)
          .some((field) => form.getFieldState(field.name).isDirty);

      await patchAgentCall(accessToken, agentId, {
        ...withAgentIdentity(updateData, values, agent, cardEdited),
        object_permission: buildMcpObjectPermission(values),
        access_group_ids: values.access_group_ids ?? [],
      });
      toast.success(translateUi("ui.91e42f32d66b0a2e"));
      setIsEditing(false);
      fetchAgentInfo();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(translateUi("ui.fbf185dd39a4d6e1"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <UiLoadingSpinner className="size-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-4">
        <div className="text-center">{uiT("ui.a50ba166a23ade64")}</div>
        <Button onClick={onClose} className="mt-4">
          {uiT("ui.88ed38c19911a249")}
        </Button>
      </div>
    );
  }

  // Format date helper function
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const rateLimitField = (name: keyof AgentFormValues & string, label: string) => (
    <AgentFormField name={name} label={label}>
      {({ value, onChange, ref, ...control }) => (
        <AgentNumberInput
          {...control}
          value={value}
          onChange={onChange}
          inputRef={ref}
          min={0}
          placeholder={uiT("ui.11dde17d6c3e")}
        />
      )}
    </AgentFormField>
  );

  if (selectedKey) {
    return (
      <KeyInfoView
        keyId={selectedKey.token}
        keyData={selectedKey}
        onClose={() => setSelectedKey(null)}
        onDelete={() => {
          setSelectedKey(null);
          refetchAgentKeys();
        }}
        teams={null}
        backButtonText="Back to Agent"
      />
    );
  }

  return (
    <div className="p-4">
      <div>
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="size-4" />
          {uiT("ui.28a2018a409007fc")}
        </Button>
        <h1 className="text-2xl font-semibold">{agent.agent_name || uiT("ui.52da6da0869cc4c5")}</h1>
        <p className="text-sm text-muted-foreground font-mono">{agent.agent_id}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.d4b1ea5708dd")}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
              {uiT("ui.74a883a037bc")}
            </TabsTrigger>
          )}
        </TabsList>

        <div>
          {/* Overview Panel */}
          <TabsContent value="overview" keepMounted>
            <AgentIdentityDetails
              agentId={agentId}
              identity={agent.identity}
              accessToken={accessToken}
              isAdmin={isAdmin}
            />
            <DetailList>
              <DetailItem label={uiT("ui.510bce732db77286")}>{agent.agent_id}</DetailItem>
              <DetailItem label={uiT("ui.28145084c72576a9")}>{agent.agent_name}</DetailItem>
              <DetailItem label={uiT("ui.18d67c992b71ce69")}>{agent.agent_card_params?.name || "-"}</DetailItem>
              <DetailItem label={uiT("ui.526e0087cc3f")}>{agent.agent_card_params?.description || "-"}</DetailItem>
              <DetailItem label="URL">{agent.agent_card_params?.url || "-"}</DetailItem>
              <DetailItem label={uiT("ui.dd167905de0defca")}>{agent.agent_card_params?.version || "-"}</DetailItem>
              <DetailItem label={uiT("ui.291267b5e04ce1b5")}>
                {agent.agent_card_params?.protocolVersion || "-"}
              </DetailItem>
              <DetailItem label={uiT("ui.a951c5945635e2d3")}>
                {agent.agent_card_params?.capabilities?.streaming
                  ? uiT("ui.85a39ab345d672ff")
                  : uiT("ui.1ea442a134b2a184")}
              </DetailItem>
              {agent.agent_card_params?.capabilities?.pushNotifications && (
                <DetailItem label={uiT("ui.3b1776f544c9f4b0")}>{uiT("ui.85a39ab345d672ff")}</DetailItem>
              )}
              {agent.agent_card_params?.capabilities?.stateTransitionHistory && (
                <DetailItem label={uiT("ui.7cf48623858f12d3")}>{uiT("ui.85a39ab345d672ff")}</DetailItem>
              )}
              <DetailItem label={uiT("ui.66d0f523a379")}>
                {agent.agent_card_params?.skills?.length || 0} {uiT("ui.20158224750041d6")}
              </DetailItem>
              {agent.litellm_params?.model && (
                <DetailItem label={uiT("ui.5e2c614c23f0")}>{agent.litellm_params.model}</DetailItem>
              )}
              {agent.litellm_params?.make_public !== undefined && (
                <DetailItem label={uiT("ui.24139936d627112e")}>
                  {agent.litellm_params.make_public ? uiT("ui.85a39ab345d672ff") : uiT("ui.1ea442a134b2a184")}
                </DetailItem>
              )}
              {agent.agent_card_params?.iconUrl && (
                <DetailItem label={uiT("ui.5522df36679f818e")}>{agent.agent_card_params.iconUrl}</DetailItem>
              )}
              {agent.agent_card_params?.documentationUrl && (
                <DetailItem label={uiT("ui.33db6f919e9e2d29")}>{agent.agent_card_params.documentationUrl}</DetailItem>
              )}
              <DetailItem label={uiT("ui.703406a2fc47")}>{agent.tpm_limit ?? uiT("ui.11dde17d6c3e")}</DetailItem>
              <DetailItem label={uiT("ui.e543e799b809")}>{agent.rpm_limit ?? uiT("ui.11dde17d6c3e")}</DetailItem>
              <DetailItem label={uiT("ui.49d91a62a1487c10")}>
                {agent.session_tpm_limit ?? uiT("ui.11dde17d6c3e")}
              </DetailItem>
              <DetailItem label={uiT("ui.f08408abc3420f12")}>
                {agent.session_rpm_limit ?? uiT("ui.11dde17d6c3e")}
              </DetailItem>
              <DetailItem label={uiT("ui.b0252ccc6e86")}>
                {agent.access_group_ids?.length ? (
                  <div className="space-y-1">
                    {agent.access_group_ids.map((accessGroupId) => (
                      <div key={accessGroupId}>{accessGroupLabel(accessGroupId)}</div>
                    ))}
                  </div>
                ) : (
                  uiT("ui.dc937b598926")
                )}
              </DetailItem>
              <DetailItem label={uiT("ui.3d44337010bf")}>{formatDate(agent.created_at)}</DetailItem>
              <DetailItem label={uiT("ui.e35c8e4f5cb5")}>{formatDate(agent.updated_at)}</DetailItem>
            </DetailList>

            <AgentVirtualKeys keys={agentKeys} isLoading={keysLoading} onKeyClick={setSelectedKey} />

            {agent.object_permission &&
              (agent.object_permission.mcp_servers?.length ||
                agent.object_permission.mcp_access_groups?.length ||
                agent.object_permission.mcp_toolsets?.length ||
                (agent.object_permission.mcp_tool_permissions &&
                  Object.keys(agent.object_permission.mcp_tool_permissions).length > 0)) && (
                <div style={{ marginTop: 24 }}>
                  <h3 className="text-lg font-medium">{uiT("ui.747e141ddff53f65")}</h3>
                  <DetailList className="mt-4">
                    {agent.object_permission.mcp_servers && agent.object_permission.mcp_servers.length > 0 && (
                      <DetailItem label={uiT("ui.aab669a72882")}>
                        <div className="space-y-1">
                          {agent.object_permission.mcp_servers.map((serverId) => (
                            <div key={serverId}>{mcpServerLabel(serverId)}</div>
                          ))}
                        </div>
                      </DetailItem>
                    )}
                    {agent.object_permission.mcp_access_groups &&
                      agent.object_permission.mcp_access_groups.length > 0 && (
                        <DetailItem label={uiT("ui.330da412f455f4e8")}>
                          {agent.object_permission.mcp_access_groups.join(", ")}
                        </DetailItem>
                      )}
                    {agent.object_permission.mcp_toolsets && agent.object_permission.mcp_toolsets.length > 0 && (
                      <DetailItem label={uiT("ui.e4dfc68329bd2326")}>
                        {agent.object_permission.mcp_toolsets.join(", ")}
                      </DetailItem>
                    )}
                    {agent.object_permission.mcp_tool_permissions &&
                      Object.keys(agent.object_permission.mcp_tool_permissions).length > 0 && (
                        <DetailItem label={uiT("ui.64762e03dab2f405")}>
                          <div className="space-y-1">
                            {Object.entries(agent.object_permission.mcp_tool_permissions).map(([serverId, tools]) => (
                              <div key={serverId}>
                                <span className="font-medium">{mcpServerLabel(serverId)}:</span>{" "}
                                {Array.isArray(tools) ? tools.join(", ") : String(tools)}
                              </div>
                            ))}
                          </div>
                        </DetailItem>
                      )}
                  </DetailList>
                </div>
              )}

            <AgentCostView agent={agent} />

            {agent.agent_card_params?.skills && agent.agent_card_params.skills.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 className="text-lg font-medium">{uiT("ui.66d0f523a379")}</h3>
                <DetailList className="mt-4">
                  {agent.agent_card_params.skills.map((skill, index) => (
                    <DetailItem label={skill.name || uiT("ui.df501287d41d1b3f", { v0: String(index + 1) })} key={index}>
                      <div>
                        <div>
                          <strong>{uiT("ui.3ea36adcd1e02c94")}</strong> {skill.id}
                        </div>
                        <div>
                          <strong>{uiT("ui.0cf2814604b4")}</strong> {skill.description}
                        </div>
                        <div>
                          <strong>{uiT("ui.865658f888f2c502")}</strong>{" "}
                          {Array.isArray(skill.tags) ? skill.tags.join(", ") : skill.tags}
                        </div>
                        {skill.examples && skill.examples.length > 0 && (
                          <div>
                            <strong>{uiT("ui.1889f03338b79bba")}</strong>{" "}
                            {Array.isArray(skill.examples) ? skill.examples.join(", ") : skill.examples}
                          </div>
                        )}
                      </div>
                    </DetailItem>
                  ))}
                </DetailList>
              </div>
            )}

            <AgentKillSwitchDangerZone
              agentId={agent.agent_id}
              agentName={agent.agent_name}
              killSwitch={agent.kill_switch}
              accessToken={accessToken}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {/* Settings Panel (only for admins) */}
          {isAdmin && (
            <TabsContent value="settings" keepMounted>
              <Card className="block p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{uiT("ui.b526bb2e5b8f7f1a")}</h3>
                  {!isEditing && (
                    <Button
                      onClick={() => {
                        setAppliedDiscoveredSelection(null);
                        setIsEditing(true);
                      }}
                    >
                      {uiT("ui.cddc5824575b")}
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <TooltipProvider>
                    <FormProvider {...form}>
                      <form onSubmit={form.handleSubmit(handleUpdate)}>
                        <FieldGroup className="mb-4">
                          <Field>
                            <FieldLabel htmlFor="agent-id">{uiT("ui.510bce732db77286")}</FieldLabel>
                            <Input id="agent-id" value={agent.agent_id} disabled readOnly />
                          </Field>
                        </FieldGroup>

                        {usesDynamicFields && selectedAgentTypeInfo ? (
                          <DynamicAgentFormFields agentTypeInfo={selectedAgentTypeInfo} panels={panels} />
                        ) : (
                          <AgentFormFields showAgentName={true} panels={panels} />
                        )}

                        <AgentIdentityFields accessToken={accessToken} />

                        {discoveryRequest && (
                          <div className="mt-4">
                            <AgentCardDiscovery
                              accessToken={accessToken}
                              onApply={handleApplyDiscoveredCard}
                              discoveryRequest={discoveryRequest}
                              savedAgentCard={agent.agent_card_params ?? null}
                            />
                          </div>
                        )}

                        <Separator className="my-6" />
                        <h3 className="text-lg font-medium mb-4">{uiT("ui.ed129d234fd4")}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {rateLimitField("tpm_limit", "TPM Limit")}
                          {rateLimitField("rpm_limit", "RPM Limit")}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {rateLimitField("session_tpm_limit", "Session TPM Limit")}
                          {rateLimitField("session_rpm_limit", "Session RPM Limit")}
                        </div>

                        <Separator className="my-6" />
                        <h3 className="text-lg font-medium mb-4">{uiT("ui.b0252ccc6e86")}</h3>
                        <FieldGroup>
                          <AgentFormField
                            name="access_group_ids"
                            label={labelWithHint(
                              "Access Groups",
                              "Attached groups cap which models, MCP servers, and agents this agent can reach, on top of its key and team permissions. Leave empty to apply no extra cap.",
                            )}
                          >
                            {({ value, onChange }) => (
                              <AccessGroupSelector
                                value={Array.isArray(value) ? (value as string[]) : []}
                                onChange={onChange}
                                placeholder={uiT("ui.0241d89497da")}
                              />
                            )}
                          </AgentFormField>
                        </FieldGroup>

                        <Separator className="my-6" />
                        <h3 className="text-lg font-medium mb-4">{uiT("ui.aab669a72882")}</h3>
                        <FieldGroup>
                          <AgentFormField
                            name="allowed_mcp_servers_and_groups"
                            label={labelWithHint(
                              "Allowed MCP Servers",
                              "Select which MCP servers or access groups this agent can access. Keys bound to this agent can only reach servers granted here.",
                            )}
                          >
                            {({ value, onChange }) => (
                              <MCPServerSelector
                                onChange={onChange}
                                value={{
                                  servers: (value as McpServerSelection | undefined)?.servers ?? [],
                                  accessGroups: (value as McpServerSelection | undefined)?.accessGroups ?? [],
                                  toolsets: (value as McpServerSelection | undefined)?.toolsets ?? [],
                                }}
                                accessToken={accessToken ?? ""}
                                placeholder={uiT("ui.932feda2a896")}
                              />
                            )}
                          </AgentFormField>
                        </FieldGroup>
                        <div className="mt-4">
                          <MCPToolPermissions
                            accessToken={accessToken ?? ""}
                            selectedServers={mcpSelection?.servers ?? []}
                            toolPermissions={mcpToolPermissions ?? {}}
                            onChange={(toolPerms: Record<string, string[]>) =>
                              form.setValue("mcp_tool_permissions", toolPerms)
                            }
                          />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setAppliedDiscoveredSelection(null);
                              setIsEditing(false);
                              fetchAgentInfo();
                            }}
                          >
                            {uiT("ui.19766ed6ccb2")}
                          </Button>
                          <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                            {isSaving && <UiLoadingSpinner className="size-4" />}
                            {uiT("ui.35322b5bb5a2")}
                          </Button>
                        </div>
                      </form>
                    </FormProvider>
                  </TooltipProvider>
                ) : (
                  <p>{uiT("ui.b12392f3276dc5e1")}</p>
                )}
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default AgentInfoView;
