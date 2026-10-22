"use client";
import { formatMoney } from "@/utils/currency";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { AgentHubData, getAgentHubTableColumns } from "@/components/AIHub/AgentHubTableColumns";
import MakeAgentPublicForm from "@/components/AIHub/forms/MakeAgentPublicForm";
import MakeMCPPublicForm from "@/components/AIHub/forms/MakeMCPPublicForm";
import MakeModelPublicForm from "@/components/AIHub/forms/MakeModelPublicForm";
import { getMCPHubTableColumns, MCPServerData } from "@/components/AIHub/MCPHubTableColumns";
import { getModelHubTableColumns, ModelHubData } from "@/components/AIHub/ModelHubTableColumns";
import { modelUsageExample } from "@/components/AIHub/modelUsageExample";
import UsefulLinksManagement from "@/components/AIHub/UsefulLinksManagement";
import { getClaudeCodePluginsList } from "@/components/networking";
import { Plugin } from "@/components/claude_code_plugins/types";
import SkillHubDashboard from "@/components/AIHub/SkillHubDashboard";
import MakeSkillPublicForm from "@/components/claude_code_plugins/MakeSkillPublicForm";
import { DataTable } from "@/components/shared/DataTable";
import ModelFilters from "@/components/model_filters";
import {
  fetchMCPServers,
  getAgentsList,
  getConfigFieldSetting,
  getGlobalLitellmHeaderName,
  getProxyBaseUrl,
  getUiConfig,
  modelHubCall,
  modelHubPublicModelsCall,
} from "@/components/networking";
import PublicModelHub from "@/components/public_model_hub";
import { copyToClipboard } from "@/utils/dataUtils";
import { isAdminRole, isProxyAdminRole } from "@/utils/roles";
import { filterBySearchTerm } from "@/utils/searchUtils";
import { SortingState } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Inbox, Search as SearchIcon, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";

import { useSyntaxTheme } from "@/hooks/useSyntaxTheme";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { checkTokenValidity } from "@/utils/jwtUtils";
import { getCookie } from "@/utils/cookieUtils";
import { getLoginUrl } from "@/utils/returnUrlUtils";
import { uiHref } from "@/utils/uiHref";
import { DECISIONS_DOCS_URL, SYSTEM_ONE_PLAYGROUND_ROUTE, isDecisionMode } from "@/lib/decisionModels";

interface ModelHubTableProps {
  accessToken: string | null;
  publicPage: boolean;
  premiumUser: boolean;
  userRole: string | null;
  canOpenPlayground: boolean;
}

function isMCPHubVisibilityDisabled(isLoading: boolean, servers: readonly MCPServerData[] | null): boolean {
  return isLoading || servers === null;
}

function HubEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

const ModelHubTable: React.FC<ModelHubTableProps> = ({
  accessToken,
  publicPage,
  premiumUser,
  userRole,
  canOpenPlayground,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const syntaxTheme = useSyntaxTheme(prism);
  // Admin Viewer follows the read-parity rule: see the AI Hub catalog, but
  // cannot toggle public visibility (write).
  const canModify = isProxyAdminRole(userRole || "");

  const [publicPageAllowed, setPublicPageAllowed] = useState<boolean>(false);
  const [modelHubData, setModelHubData] = useState<ModelHubData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<null | ModelHubData>(null);
  const [filteredData, setFilteredData] = useState<ModelHubData[]>([]);
  const [isMakePublicModalVisible, setIsMakePublicModalVisible] = useState(false);
  // Agent Hub state
  const [agentHubData, setAgentHubData] = useState<AgentHubData[] | null>(null);
  const [isMakeAgentPublicModalVisible, setIsMakeAgentPublicModalVisible] = useState(false);
  const [agentLoading, setAgentLoading] = useState<boolean>(true);
  const [selectedAgent, setSelectedAgent] = useState<null | AgentHubData>(null);
  const [isAgentModalVisible, setIsAgentModalVisible] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  // MCP Hub state
  const [mcpHubData, setMcpHubData] = useState<MCPServerData[] | null>(null);
  const [mcpLoading, setMcpLoading] = useState<boolean>(true);
  const [selectedMcpServer, setSelectedMcpServer] = useState<null | MCPServerData>(null);
  const [isMcpModalVisible, setIsMcpModalVisible] = useState(false);
  const [isMakeMcpPublicModalVisible, setIsMakeMcpPublicModalVisible] = useState(false);
  // Skill Hub state
  const [skillHubData, setSkillHubData] = useState<Plugin[]>([]);
  const [skillLoading, setSkillLoading] = useState<boolean>(false);
  const [isMakeSkillPublicModalVisible, setIsMakeSkillPublicModalVisible] = useState(false);
  const { data: uiSettings, isLoading: isUISettingsLoading } = useUISettings();

  // Check authentication requirement for public AI Hub
  useEffect(() => {
    // Only check when UI settings are loaded and this is a public page
    if (isUISettingsLoading || !publicPage) {
      return;
    }

    const requireAuth = uiSettings?.values?.require_auth_for_public_ai_hub;

    // If require_auth_for_public_ai_hub is true, verify token
    if (requireAuth === true) {
      const token = getCookie("token");
      const isTokenValid = checkTokenValidity(token);

      // If token is invalid, redirect to login
      if (!isTokenValid) {
        window.location.replace(getLoginUrl(getProxyBaseUrl()));
        return;
      }
    }
    // If require_auth_for_public_ai_hub is false, allow public access (no change)
  }, [isUISettingsLoading, publicPage, uiSettings]);

  useEffect(() => {
    const fetchData = async (accessToken: string) => {
      try {
        setLoading(true);
        const _modelHubData = await modelHubCall(accessToken);
        setModelHubData(_modelHubData.data);

        getConfigFieldSetting(accessToken, "enable_public_model_hub")
          .then((data) => {
            if (data.field_value == true) {
              setPublicPageAllowed(true);
            }
          })
          .catch((error) => {
            // do nothing
          });
      } catch (error) {
        console.error("There was an error fetching the model data", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPublicData = async () => {
      try {
        setLoading(true);
        await getUiConfig();
        const _modelHubData = await modelHubPublicModelsCall();
        setModelHubData(_modelHubData);
        setPublicPageAllowed(true);
      } catch (error) {
        console.error("There was an error fetching the public model data", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchModelData = async () => {
      if (accessToken) {
        await fetchData(accessToken);
      } else if (publicPage) {
        await fetchPublicData();
      } else {
        setLoading(false);
      }
    };
    fetchModelData();
  }, [accessToken, publicPage]);

  // Fetch Agent Hub data
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!accessToken) {
        setAgentLoading(false);
        return;
      }

      try {
        setAgentLoading(true);
        const response = await getAgentsList(accessToken);
        const agents = response.agents;
        const agent_card_list = agents.map((agent: any) => ({
          agent_id: agent.agent_id,
          ...agent.agent_card_params,
          is_public: agent.litellm_params.is_public,
        }));
        setAgentHubData(agent_card_list);
      } catch (error) {
        console.error("There was an error fetching the agent data", error);
      } finally {
        setAgentLoading(false);
      }
    };

    if (!publicPage) {
      fetchAgentData();
    }
  }, [publicPage, accessToken]);

  // Fetch MCP Hub data
  useEffect(() => {
    const fetchMcpData = async () => {
      if (!accessToken) {
        setMcpLoading(false);
        return;
      }

      try {
        setMcpLoading(true);
        const response = await fetchMCPServers(accessToken);
        setMcpHubData(response);
      } catch (error) {
        console.error("There was an error fetching the MCP server data", error);
      } finally {
        setMcpLoading(false);
      }
    };

    if (!publicPage) {
      fetchMcpData();
    }
  }, [publicPage, accessToken]);

  // Fetch Skill Hub data — all skills for admins, enabled-only for public page
  useEffect(() => {
    const fetchSkillData = async () => {
      if (!accessToken) return;
      try {
        setSkillLoading(true);
        const enabledOnly = publicPage === true;
        const response = await getClaudeCodePluginsList(accessToken, enabledOnly);
        setSkillHubData(response.plugins);
      } catch (error) {
        console.error("Error fetching skill hub data", error);
      } finally {
        setSkillLoading(false);
      }
    };

    fetchSkillData();
  }, [accessToken, publicPage]);

  const showModal = useCallback((model: ModelHubData) => {
    setSelectedModel(model);
    setIsModalVisible(true);
  }, []);

  const showAgentModal = useCallback((agent: AgentHubData) => {
    setSelectedAgent(agent);
    setIsAgentModalVisible(true);
  }, []);

  const showMcpModal = useCallback((server: MCPServerData) => {
    setSelectedMcpServer(server);
    setIsMcpModalVisible(true);
  }, []);

  const handleMakePublicPage = () => {
    if (!accessToken) {
      return;
    }

    // Show the modal for selecting models to make public
    setIsMakePublicModalVisible(true);
  };

  const handleMakeAgentPublicPage = () => {
    if (!accessToken) {
      return;
    }

    // Show the modal for selecting agents to make public
    setIsMakeAgentPublicModalVisible(true);
  };

  const handleMakeMcpPublicPage = () => {
    if (!accessToken) {
      return;
    }

    // Show the modal for selecting MCP servers to make public
    setIsMakeMcpPublicModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    setSelectedModel(null);
    setIsAgentModalVisible(false);
    setSelectedAgent(null);
    setIsMcpModalVisible(false);
    setSelectedMcpServer(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedModel(null);
    setIsAgentModalVisible(false);
    setSelectedAgent(null);
    setIsMcpModalVisible(false);
    setSelectedMcpServer(null);
  };

  const formatCapabilityName = (key: string) => {
    // Remove 'supports_' prefix and convert snake_case to Title Case
    return key
      .replace(/^supports_/, "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getModelCapabilities = (model: ModelHubData) => {
    // Find all properties that start with 'supports_' and are true
    return Object.entries(model)
      .filter(([key, value]) => key.startsWith("supports_") && value === true)
      .map(([key]) => key);
  };

  const formatCost = (cost: number) => {
    return formatMoney((cost * 1_000_000), 2);
  };

  const handleMakePublicSuccess = () => {
    // Refresh the model hub data after successful public operation
    if (accessToken) {
      const fetchData = async () => {
        try {
          const _modelHubData = await modelHubCall(accessToken);
          setModelHubData(_modelHubData.data);
        } catch (error) {
          console.error("Error refreshing model data:", error);
        }
      };
      fetchData();
    }
  };

  const handleMakeAgentPublicSuccess = () => {
    // Refresh the agent hub data after successful public operation
    if (accessToken) {
      const fetchAgentData = async () => {
        try {
          const response = await getAgentsList(accessToken);
          const agents = response.agents;
          const agent_card_list = agents.map((agent: any) => ({
            agent_id: agent.agent_id,
            ...agent.agent_card_params,
            is_public: agent.is_public,
          }));
          setAgentHubData(agent_card_list);
        } catch (error) {
          console.error("Error refreshing agent data:", error);
        }
      };
      fetchAgentData();
    }
  };

  const handleMakeMcpPublicSuccess = () => {
    // Refresh the MCP hub data after successful public operation
    if (accessToken) {
      const fetchMcpData = async () => {
        try {
          setMcpLoading(true);
          const response = await fetchMCPServers(accessToken);
          setMcpHubData(response);
        } catch (error) {
          setMcpHubData(null);
          console.error("Error refreshing MCP server data:", error);
        } finally {
          setMcpLoading(false);
        }
      };
      fetchMcpData();
    }
  };

  const handleFilteredDataChange = useCallback((newFilteredData: ModelHubData[]) => {
    setFilteredData(newFilteredData);
  }, []);

  const [modelSorting, setModelSorting] = useState<SortingState>([{ id: "model_group", desc: false }]);
  const [agentSorting, setAgentSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [mcpSorting, setMcpSorting] = useState<SortingState>([{ id: "server_name", desc: false }]);

  const modelColumns = useMemo(() => getModelHubTableColumns({ onModelClick: showModal }), [showModal]);
  const agentColumns = useMemo(() => getAgentHubTableColumns({ onAgentClick: showAgentModal }), [showAgentModal]);
  const filteredAgentData = useMemo(
    () => filterBySearchTerm(agentHubData ?? [], agentSearchTerm, (agent) => [agent.name, agent.description]),
    [agentHubData, agentSearchTerm],
  );
  const mcpColumns = useMemo(() => getMCPHubTableColumns({ onServerClick: showMcpModal }), [showMcpModal]);

  // If this is a public page, use the dedicated PublicModelHub component
  if (publicPage && publicPageAllowed) {
    return <PublicModelHub accessToken={accessToken} />;
  }

  return (
    <div className="mx-4">
      {publicPage == false ? (
        <div className="w-full m-2 mt-2 p-8">
          {/* Header with Title, Description and URL */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-start">
              <h2 className="text-center text-xl font-semibold">{uiT("ui.dc459287898f")}</h2>
              {isAdminRole(userRole || "") ? (
                <p className="text-sm text-muted-foreground">{uiT("ui.d249892069c4b5e3")}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{uiT("ui.c47a20d6f5d2e23a")}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <p>{uiT("ui.05419ce1dd5c6477")}</p>
              <div className="flex items-center bg-border px-2 py-1 rounded-sm">
                <p className="mr-2">
                  {translateUi("ui.be4a5da9bee88f4e", undefined, { v0: String(getProxyBaseUrl()) })}
                </p>
                <button
                  onClick={() => void copyToClipboard(`${getProxyBaseUrl()}/ui/model_hub_table`)}
                  className="p-1 hover:bg-accent rounded-sm transition-colors"
                  title={uiT("ui.b26d1037f1c2da31")}
                >
                  <Copy size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Useful Links Management Section for Admins */}
          {canModify && (
            <div className="mt-8 mb-2">
              <UsefulLinksManagement accessToken={accessToken} userRole={userRole} />
            </div>
          )}

          {/* Tab System for Model Hub, Agent Hub, MCP Hub, and Plugin Marketplace */}
          <Tabs defaultValue="models">
            <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
              <TabsTrigger value="models" className="flex-none rounded-none px-4 py-2">
                {uiT("ui.378755ff1951")}
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex-none rounded-none px-4 py-2">
                {uiT("ui.f938778632ed608b")}
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex-none rounded-none px-4 py-2">
                {uiT("ui.066e87fffe1f19d0")}
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex-none rounded-none px-4 py-2">
                {uiT("ui.96a9a8f03afe775a")}
              </TabsTrigger>
            </TabsList>

            <div>
              {/* Model Hub Tab */}
              <TabsContent value="models" keepMounted>
                {/* Model Filters and Table */}
                <Card className="px-6">
                  {/* Header with Make Public Button */}
                  {publicPage == false && canModify && (
                    <div className="flex justify-end mb-4">
                      <Button onClick={() => handleMakePublicPage()}>{uiT("ui.498f0efc93165756")}</Button>
                    </div>
                  )}

                  {/* Filters */}
                  <ModelFilters modelHubData={modelHubData || []} onFilteredDataChange={handleFilteredDataChange} />

                  {/* Model Table */}
                  <DataTable
                    data={filteredData}
                    paginationMode="client"
                    columns={modelColumns}
                    getRowId={(model, index) => model.model_group || String(index)}
                    sortingMode="client"
                    sorting={modelSorting}
                    onSortingChange={setModelSorting}
                    isLoading={loading}
                    loadingMessage={uiT("ui.cc8b4624f7659c68")}
                    noDataMessage={
                      <HubEmptyState
                        title={modelHubData?.length ? uiT("ui.5267f5e646a5a193") : uiT("ui.c7a9aa43558fd4f3")}
                        body={modelHubData?.length ? uiT("ui.be1bd120a00599fb") : uiT("ui.ac13cfaaec2382f9")}
                      />
                    }
                    size="compact"
                  />
                </Card>

                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uiT("ui.d604310a789a")} {filteredData.length} {uiT("ui.28391d3bc64ec15c")}{" "}
                    {modelHubData?.length || 0} {uiT("ui.8edcc26c0f6c7256")}
                  </p>
                </div>
              </TabsContent>

              {/* Agent Hub Tab */}
              <TabsContent value="agents" keepMounted>
                <Card className="px-6">
                  {/* Header with Make Public Button */}
                  {publicPage == false && canModify && (
                    <div className="flex justify-end mb-4">
                      <Button onClick={() => handleMakeAgentPublicPage()}>{uiT("ui.c1773c2d4782c8b0")}</Button>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">{uiT("ui.068e24f6e70a9cd8")}</p>
                    <InputGroup className="max-w-sm">
                      <InputGroupAddon>
                        <SearchIcon className="size-4 text-muted-foreground" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder={uiT("ui.26a2113e002946dd")}
                        value={agentSearchTerm}
                        onChange={(e) => setAgentSearchTerm(e.target.value)}
                      />
                      {agentSearchTerm && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            aria-label={uiT("ui.3b7ea51793e9d906")}
                            onClick={() => setAgentSearchTerm("")}
                          >
                            <X />
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  </div>

                  {/* Agent Table */}
                  <DataTable
                    data={filteredAgentData}
                    paginationMode="client"
                    columns={agentColumns}
                    getRowId={(agent, index) => agent.agent_id || agent.name || String(index)}
                    sortingMode="client"
                    sorting={agentSorting}
                    onSortingChange={setAgentSorting}
                    isLoading={agentLoading}
                    loadingMessage={uiT("ui.ae0c1414f42139ce")}
                    noDataMessage={
                      <HubEmptyState
                        title={agentHubData?.length ? uiT("ui.38b006752ec7a0a6") : uiT("ui.971b61f8cb4dab8e")}
                        body={agentHubData?.length ? uiT("ui.bc5abf6e9f8afba4") : uiT("ui.2dd078891130d3d1")}
                      />
                    }
                    size="compact"
                  />
                </Card>

                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uiT("ui.d604310a789a")} {filteredAgentData.length} {uiT("ui.28391d3bc64ec15c")}{" "}
                    {agentHubData?.length || 0} {uiT("ui.8c70b25cbbbe8e79")}
                  </p>
                </div>
              </TabsContent>

              {/* MCP Hub Tab */}
              <TabsContent value="mcp" keepMounted>
                <Card className="px-6">
                  {/* Header with Make Public Button */}
                  {publicPage == false && canModify && (
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={() => handleMakeMcpPublicPage()}
                        disabled={isMCPHubVisibilityDisabled(mcpLoading, mcpHubData)}
                      >
                        {uiT("ui.b3b737880741e637")}
                      </Button>
                    </div>
                  )}

                  {/* MCP Server Table */}
                  <DataTable
                    data={mcpHubData || []}
                    paginationMode="client"
                    columns={mcpColumns}
                    getRowId={(server, index) => server.server_id || String(index)}
                    sortingMode="client"
                    sorting={mcpSorting}
                    onSortingChange={setMcpSorting}
                    isLoading={mcpLoading}
                    loadingMessage={uiT("ui.02f555a8f0e40a88")}
                    noDataMessage={
                      <HubEmptyState title={uiT("ui.9c0b284fa55e9668")} body={uiT("ui.cbd5f55b7a4a6fb2")} />
                    }
                    size="compact"
                  />
                </Card>

                <div className="mt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {uiT("ui.d604310a789a")} {mcpHubData?.length || 0} {uiT("ui.d938c8168e3acbba")}
                    {mcpHubData?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </TabsContent>

              {/* Skill Hub Tab */}
              <TabsContent value="skills" keepMounted>
                {publicPage == false && canModify && (
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => setIsMakeSkillPublicModalVisible(true)}>{uiT("ui.aa9c4f06688cd72c")}</Button>
                  </div>
                )}
                <SkillHubDashboard
                  skills={skillHubData}
                  isLoading={skillLoading}
                  isAdmin={canModify}
                  accessToken={accessToken}
                  publicPage={publicPage}
                  onPublishSuccess={async () => {
                    const response = await getClaudeCodePluginsList(accessToken || "", publicPage);
                    setSkillHubData(response.plugins);
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      ) : (
        <Card className="mx-auto max-w-xl mt-10 px-6">
          <p className="text-xl text-center mb-2 text-foreground">{uiT("ui.d04bc65641125673")}</p>
          <p className="text-base text-center text-foreground">{uiT("ui.46b7deea69205f8d")}</p>
        </Card>
      )}

      {/* Model Details Modal */}
      <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{selectedModel?.model_group || uiT("ui.570f45eae54f9903")}</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-6">
              {/* Model Overview */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.517fb906b47bd966")}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">{uiT("ui.094acf6d7061d27a")}</p>
                    <p>{selectedModel.model_group}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.7ce1afa3f281b07b")}</p>
                    <p>{selectedModel.mode || uiT("ui.dc12bec5d71f167b")}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.35dbeb1dcbaf6ec1")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedModel.providers.map((provider) => (
                        <Badge key={provider} variant="secondary">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Token and Cost Information */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.41c2c7b4bf157a06")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{uiT("ui.e607783235ac2365")}</p>
                    <p>{selectedModel.max_input_tokens?.toLocaleString() || uiT("ui.dc12bec5d71f167b")}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.f962058b2af90775")}</p>
                    <p>{selectedModel.max_output_tokens?.toLocaleString() || uiT("ui.dc12bec5d71f167b")}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.526021595b9a17ce")}</p>
                    <p>
                      {selectedModel.input_cost_per_token
                        ? formatCost(selectedModel.input_cost_per_token)
                        : uiT("ui.dc12bec5d71f167b")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.2d83e8bb79bedc18")}</p>
                    <p>
                      {selectedModel.output_cost_per_token
                        ? formatCost(selectedModel.output_cost_per_token)
                        : uiT("ui.dc12bec5d71f167b")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.9460f16ac9b5171e")}</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const capabilities = getModelCapabilities(selectedModel);
                    const colors = ["green", "blue", "purple", "orange", "red", "yellow"];

                    if (capabilities.length === 0) {
                      return <p className="text-muted-foreground">{uiT("ui.c5b754a085dc94b9")}</p>;
                    }

                    return capabilities.map((capability, index) => (
                      <Badge key={capability} variant="secondary">
                        {formatCapabilityName(capability)}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>

              {/* Rate Limits */}
              {(selectedModel.tpm || selectedModel.rpm) && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.ed129d234fd4")}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedModel.tpm && (
                      <div>
                        <p className="font-medium">{uiT("ui.4bd69634f0e2f006")}</p>
                        <p>{selectedModel.tpm.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedModel.rpm && (
                      <div>
                        <p className="font-medium">{uiT("ui.0f46e463aa2fadf5")}</p>
                        <p>{selectedModel.rpm.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Supported OpenAI Parameters */}
              {selectedModel.supported_openai_params && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.36dbad05448baa1d")}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.supported_openai_params.map((param) => (
                      <Badge key={param} variant="default">
                        {param}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.8395ae6b09d334bd")}</p>
                {isDecisionMode(selectedModel.mode) && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {uiT("ui.43c00a90f8636c98")} <code>/v1/decisions</code> {uiT("ui.6201111b83a0cb5b")}{" "}
                    <code>/v1/systemone</code>
                    {uiT("ui.fe6ed4add0dd09a0")} <code>/chat/completions</code>.{" "}
                    <a href={DECISIONS_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline">
                      {uiT("ui.7c42d83806a10c4f")}
                    </a>
                    {canOpenPlayground && (
                      <>
                        {" · "}
                        <a href={uiHref(SYSTEM_ONE_PLAYGROUND_ROUTE)} className="underline">
                          {uiT("ui.5c1318f97a510e1d")}
                        </a>
                      </>
                    )}
                  </p>
                )}
                <SyntaxHighlighter language="python" className="text-sm" style={syntaxTheme}>
                  {modelUsageExample(
                    selectedModel.mode,
                    getProxyBaseUrl(),
                    selectedModel.model_group,
                    getGlobalLitellmHeaderName(),
                  )}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agent Details Modal */}
      <Dialog open={isAgentModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{selectedAgent?.name || uiT("ui.c2de0f6fe35a07d0")}</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              {/* Agent Overview */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.0fc079dd3842137e")}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">{uiT("ui.2683cad48a14dc3f")}</p>
                    <p>{selectedAgent.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.4c5726ee16ee7828")}</p>
                    <Badge variant="secondary">v{selectedAgent.version}</Badge>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.2163474af8252a1e")}</p>
                    <p>{selectedAgent.protocolVersion}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.734fd77b36107c77")}</p>
                    <div className="flex items-center space-x-2">
                      <p className="truncate min-w-0">{selectedAgent.url}</p>
                      <Copy
                        onClick={() => void copyToClipboard(selectedAgent.url)}
                        className="size-3.5 shrink-0 cursor-pointer text-muted-foreground hover:text-info"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{uiT("ui.0cf2814604b4")}</p>
                  <p className="mt-1">{selectedAgent.description}</p>
                </div>
              </div>

              {/* Capabilities */}
              {selectedAgent.capabilities && Object.keys(selectedAgent.capabilities).length > 0 && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.9460f16ac9b5171e")}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedAgent.capabilities)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <Badge key={key} variant="default">
                          {key}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Input/Output Modes */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.0f6cc911de021d8e")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{uiT("ui.9b0ebb6f6ddf0e4e")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.defaultInputModes?.map((mode) => (
                        <Badge key={mode} variant="secondary">
                          {mode}
                        </Badge>
                      )) || <p>{uiT("ui.dc12bec5d71f167b")}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.57130eb22d1c9df9")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.defaultOutputModes?.map((mode) => (
                        <Badge key={mode} variant="outline">
                          {mode}
                        </Badge>
                      )) || <p>{uiT("ui.dc12bec5d71f167b")}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedAgent.skills && selectedAgent.skills.length > 0 && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.66d0f523a379")}</p>
                  <div className="space-y-4">
                    {selectedAgent.skills.map((skill) => (
                      <div key={skill.id} className="border border-border rounded-sm p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-base">{skill.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {uiT("ui.3ea36adcd1e02c94")} {skill.id}
                            </p>
                          </div>
                          {skill.tags && skill.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {skill.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm mb-2">{skill.description}</p>
                        {skill.examples && skill.examples.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground">{uiT("ui.1889f03338b79bba")}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {skill.examples.map((example, idx) => (
                                <Badge key={idx} variant="outline">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Properties */}
              {selectedAgent.supportsAuthenticatedExtendedCard && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.7c51c81264220132")}</p>
                  <Badge variant="default">{uiT("ui.f004595b5dcf413f")}</Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MCP Server Details Modal */}
      <Dialog open={isMcpModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{selectedMcpServer?.server_name || uiT("ui.6dd6d4f2da6e9492")}</DialogTitle>
          </DialogHeader>
          {selectedMcpServer && (
            <div className="space-y-6">
              {/* Server Overview */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.96f6c45e6c2129c0")}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">{uiT("ui.280538ffaf6bb847")}</p>
                    <p>{selectedMcpServer.server_name}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.d33134bd014c38a4")}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs truncate min-w-0">{selectedMcpServer.server_id}</p>
                      <Copy
                        onClick={() => void copyToClipboard(selectedMcpServer.server_id)}
                        className="size-3.5 shrink-0 cursor-pointer text-muted-foreground hover:text-info"
                      />
                    </div>
                  </div>
                  {selectedMcpServer.alias && (
                    <div>
                      <p className="font-medium">{uiT("ui.40f0c3d5ce898690")}</p>
                      <p>{selectedMcpServer.alias}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{uiT("ui.0212e4d1bcedca83")}</p>
                    <Badge variant="secondary">{selectedMcpServer.transport}</Badge>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.5ff4a8ab52817436")}</p>
                    <Badge variant={selectedMcpServer.auth_type === "none" ? "outline" : "default"}>
                      {selectedMcpServer.auth_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.755c8b2a9fb11446")}</p>
                    <Badge
                      variant={
                        selectedMcpServer.status === "active" || selectedMcpServer.status === "healthy"
                          ? "default"
                          : selectedMcpServer.status === "inactive" || selectedMcpServer.status === "unhealthy"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {selectedMcpServer.status || uiT("ui.b23a6a8439c0")}
                    </Badge>
                  </div>
                </div>
                {selectedMcpServer.description && (
                  <div className="mt-2">
                    <p className="font-medium">{uiT("ui.0cf2814604b4")}</p>
                    <p className="mt-1">{selectedMcpServer.description}</p>
                  </div>
                )}
              </div>

              {/* Connection Details */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.880cac6e9612c767")}</p>
                <div className="space-y-2">
                  {selectedMcpServer.command && (
                    <div>
                      <p className="font-medium">{uiT("ui.a7a9c91545a4fca0")}</p>
                      <p className="text-sm bg-muted p-2 rounded-sm mt-1 font-mono">{selectedMcpServer.command}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tools */}
              {selectedMcpServer.allowed_tools && selectedMcpServer.allowed_tools.length > 0 && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.40c14c3addf57fe1")}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMcpServer.allowed_tools.map((tool, idx) => (
                      <Badge key={idx} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams */}
              {selectedMcpServer.teams && selectedMcpServer.teams.length > 0 && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.1e1a1c078af2")}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMcpServer.teams.map((team, idx) => (
                      <Badge key={idx} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Access Groups */}
              {selectedMcpServer.mcp_access_groups && selectedMcpServer.mcp_access_groups.length > 0 && (
                <div>
                  <p className="text-lg font-semibold mb-4">{uiT("ui.b0252ccc6e86")}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMcpServer.mcp_access_groups.map((group, idx) => (
                      <Badge key={idx} variant="default">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.9eddf573cb50")}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{uiT("ui.b9a6204c897efd6d")}</p>
                    <p>{selectedMcpServer.created_by}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.92f3bd46caecb1d4")}</p>
                    <p>{selectedMcpServer.updated_by}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.8fd7542a821729b1")}</p>
                    <p className="text-sm">{new Date(selectedMcpServer.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">{uiT("ui.8a8da3ae29863197")}</p>
                    <p className="text-sm">{new Date(selectedMcpServer.updated_at).toLocaleString()}</p>
                  </div>
                  {selectedMcpServer.last_health_check && (
                    <div>
                      <p className="font-medium">{uiT("ui.e6891f2b8ba47ef8")}</p>
                      <p className="text-sm">{new Date(selectedMcpServer.last_health_check).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {selectedMcpServer.health_check_error && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded-sm">
                    <p className="font-medium text-destructive">{uiT("ui.99065e2268216ce7")}</p>
                    <p className="text-sm text-destructive mt-1">{selectedMcpServer.health_check_error}</p>
                  </div>
                )}
              </div>

              {/* Usage Example */}
              <div>
                <p className="text-lg font-semibold mb-4">{uiT("ui.8395ae6b09d334bd")}</p>
                <SyntaxHighlighter language="python" className="text-sm" style={syntaxTheme}>
                  {translateUi("ui.36bb80ac9174c46f", undefined, {
                    v0: String(selectedMcpServer.server_name),
                    v1: String(getProxyBaseUrl()),
                    v2: String(selectedMcpServer.server_name),
                  })}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Make Model Public Form */}
      <MakeModelPublicForm
        visible={isMakePublicModalVisible}
        onClose={() => setIsMakePublicModalVisible(false)}
        accessToken={accessToken || ""}
        modelHubData={modelHubData || []}
        onSuccess={handleMakePublicSuccess}
      />

      {/* Make Agent Public Form */}
      <MakeAgentPublicForm
        visible={isMakeAgentPublicModalVisible}
        onClose={() => setIsMakeAgentPublicModalVisible(false)}
        accessToken={accessToken || ""}
        agentHubData={agentHubData || []}
        onSuccess={handleMakeAgentPublicSuccess}
      />

      {/* Make MCP Public Form */}
      <MakeMCPPublicForm
        visible={isMakeMcpPublicModalVisible}
        onClose={() => setIsMakeMcpPublicModalVisible(false)}
        accessToken={accessToken || ""}
        mcpHubData={mcpHubData || []}
        onSuccess={handleMakeMcpPublicSuccess}
      />

      {/* Make Skill Public Form */}
      <MakeSkillPublicForm
        visible={isMakeSkillPublicModalVisible}
        onClose={() => setIsMakeSkillPublicModalVisible(false)}
        accessToken={accessToken || ""}
        skillsList={skillHubData}
        onSuccess={async () => {
          const response = await getClaudeCodePluginsList(accessToken || "", publicPage === true);
          setSkillHubData(response.plugins);
        }}
      />
    </div>
  );
};

export default ModelHubTable;
