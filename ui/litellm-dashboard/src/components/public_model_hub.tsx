"use client";
import { t as translateUi } from "@/i18n";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ExternalLinkIcon, SearchIcon } from "@heroicons/react/outline";
import { SortingState } from "@tanstack/react-table";
import { Copy, Inbox, Info } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelect } from "./shared/MultiSelect";
import { featureLabel } from "./publicModelHub/publicModelHubFilters";
import { usePublicModelHubFacets } from "./publicModelHub/usePublicModelHubFacets";
import { usePublicModelHubList } from "./publicModelHub/usePublicModelHubList";
import { DataTable } from "./shared/DataTable";
import { toast } from "@/lib/toast";
import Navbar from "./navbar";
import {
  agentHubPublicModelsCall,
  skillHubPublicCall,
  getProxyBaseUrl,
  getPublicModelHubInfo,
  getUiConfig,
  mcpHubPublicServersCall,
} from "./networking";
import { Plugin } from "./claude_code_plugins/types";
import SkillHubDashboard from "./AIHub/SkillHubDashboard";
import {
  AgentCard,
  MCPServerData,
  ModelGroupInfo,
  getPublicAgentHubColumns,
  getPublicMCPHubColumns,
  getPublicModelHubColumns,
} from "./PublicModelHubTableColumns";
import { generateCodeSnippet } from "@/components/chat_ui/CodeSnippets";
import { getEndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import { MessageType } from "@/components/chat_ui/types";
import { getProviderLogoAndName } from "./provider_info_helpers";
import { filterBySearchTerm, rankBySearchRelevance } from "@/utils/searchUtils";

interface PublicModelHubProps {
  accessToken?: string | null;
  isEmbedded?: boolean; // When true, hides navbar and adjusts layout for embedding in dashboard
}

function PublicHubEmptyState({ title, body }: { title: string; body: string }) {
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

const PublicModelHub: React.FC<PublicModelHubProps> = ({ accessToken, isEmbedded = false }) => {
  const { t: uiT } = useDashboardLanguage();

  const anchor = useComboboxAnchor();
  const [proxyConfigured, setProxyConfigured] = useState<boolean>(false);
  const [agentHubData, setAgentHubData] = useState<AgentCard[] | null>(null);
  const [mcpHubData, setMcpHubData] = useState<MCPServerData[] | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("LiteLLM Gateway");
  const [customDocsDescription, setCustomDocsDescription] = useState<string | null>(null);
  const [litellmVersion, setLitellmVersion] = useState<string>("");
  const [usefulLinks, setUsefulLinks] = useState<Record<string, string | { url: string; index: number }>>({});
  const [agentLoading, setAgentLoading] = useState<boolean>(true);
  const [mcpLoading, setMcpLoading] = useState<boolean>(true);
  const [agentSearchTerm, setAgentSearchTerm] = useState<string>("");
  const [mcpSearchTerm, setMcpSearchTerm] = useState<string>("");
  const [selectedAgentSkills, setSelectedAgentSkills] = useState<string[]>([]);
  const [selectedMcpTransports, setSelectedMcpTransports] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAgentModalVisible, setIsAgentModalVisible] = useState(false);
  const [isMcpModalVisible, setIsMcpModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<null | ModelGroupInfo>(null);
  const [selectedAgent, setSelectedAgent] = useState<null | AgentCard>(null);
  const [selectedMcpServer, setSelectedMcpServer] = useState<null | MCPServerData>(null);
  const [activeTab, setActiveTab] = useState<string>("models");
  const [skillHubData, setSkillHubData] = useState<Plugin[]>([]);
  const [skillLoading, setSkillLoading] = useState<boolean>(false);

  useEffect(() => {
    const initializeAndFetch = async () => {
      // Initialize proxyBaseUrl first to ensure it includes the server root path
      try {
        await getUiConfig();
      } catch (error) {
        console.error("Failed to get UI config:", error);
        // Continue anyway - might work with default proxyBaseUrl
      }
      setProxyConfigured(true);

      const fetchAgentData = async () => {
        try {
          setAgentLoading(true);
          const _agentHubData = await agentHubPublicModelsCall();
          setAgentHubData(Array.isArray(_agentHubData) ? _agentHubData : []);
        } catch (error) {
          console.error("There was an error fetching the public agent data", error);
        } finally {
          setAgentLoading(false);
        }
      };

      const fetchMcpData = async () => {
        try {
          setMcpLoading(true);
          const _mcpHubData = await mcpHubPublicServersCall();
          setMcpHubData(Array.isArray(_mcpHubData) ? _mcpHubData : []);
        } catch (error) {
          console.error("There was an error fetching the public MCP server data", error);
        } finally {
          setMcpLoading(false);
        }
      };

      const fetchPublicModelHubInfo = async () => {
        const publicModelHubInfo = await getPublicModelHubInfo();
        setPageTitle(publicModelHubInfo.docs_title);
        setCustomDocsDescription(publicModelHubInfo.custom_docs_description);
        setLitellmVersion(publicModelHubInfo.litellm_version);
        setUsefulLinks(publicModelHubInfo.useful_links || {});
      };

      const fetchSkillData = async () => {
        try {
          setSkillLoading(true);
          const response = await skillHubPublicCall();
          setSkillHubData(response.plugins ?? []);
        } catch (error) {
          console.error("There was an error fetching the public skill data", error);
        } finally {
          setSkillLoading(false);
        }
      };

      fetchPublicModelHubInfo();

      fetchAgentData();
      fetchMcpData();
      fetchSkillData();
    };

    initializeAndFetch();
  }, []);

  const getUniqueAgentSkills = (data: AgentCard[]) => {
    const skills = new Set<string>();
    data.forEach((agent) => {
      agent.skills?.forEach((skill) => {
        skill.tags?.forEach((tag) => skills.add(tag));
      });
    });
    return Array.from(skills).sort();
  };

  const getUniqueMcpTransports = (data: MCPServerData[]) => {
    const transports = new Set<string>();
    data.forEach((server) => {
      if (server.transport) transports.add(server.transport);
    });
    return Array.from(transports).sort();
  };

  const filteredAgentData = useMemo(() => {
    if (!agentHubData || !Array.isArray(agentHubData)) return [];

    const searchResults = rankBySearchRelevance(
      filterBySearchTerm(agentHubData, agentSearchTerm, (agent) => [agent.name, agent.description]),
      agentSearchTerm,
      (agent) => agent.name,
    );

    // Apply skill filters
    return searchResults.filter((agent) => {
      const matchesSkill =
        selectedAgentSkills.length === 0 ||
        agent.skills?.some((skill) => skill.tags?.some((tag) => selectedAgentSkills.includes(tag)));

      return matchesSkill;
    });
  }, [agentHubData, agentSearchTerm, selectedAgentSkills]);

  const filteredMcpData = useMemo(() => {
    if (!mcpHubData || !Array.isArray(mcpHubData)) return [];

    const searchResults = rankBySearchRelevance(
      filterBySearchTerm(mcpHubData, mcpSearchTerm, (server) => [server.server_name, server.mcp_info?.description]),
      mcpSearchTerm,
      (server) => server.server_name,
    );

    // Apply transport filters
    return searchResults.filter((server) => {
      const matchesTransport = selectedMcpTransports.length === 0 || selectedMcpTransports.includes(server.transport);

      return matchesTransport;
    });
  }, [mcpHubData, mcpSearchTerm, selectedMcpTransports]);

  const showModal = useCallback((model: ModelGroupInfo) => {
    setSelectedModel(model);
    setIsModalVisible(true);
  }, []);

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedModel(null);
  };

  const showAgentModal = useCallback((agent: AgentCard) => {
    setSelectedAgent(agent);
    setIsAgentModalVisible(true);
  }, []);

  const handleAgentModalCancel = () => {
    setIsAgentModalVisible(false);
    setSelectedAgent(null);
  };

  const showMcpModal = useCallback((server: MCPServerData) => {
    setSelectedMcpServer(server);
    setIsMcpModalVisible(true);
  }, []);

  const handleMcpModalCancel = () => {
    setIsMcpModalVisible(false);
    setSelectedMcpServer(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(translateUi("ui.916fa4a51e4d90e0"));
  };

  const formatCapabilityName = (key: string) => {
    return key
      .replace(/^supports_/, "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getModelCapabilities = (model: ModelGroupInfo) => {
    return Object.entries(model)
      .filter(([key, value]) => key.startsWith("supports_") && value === true)
      .map(([key]) => key);
  };

  const formatCost = (cost: number) => {
    return `$${(cost * 1_000_000).toFixed(4)}`;
  };

  const models = usePublicModelHubList(proxyConfigured);
  const modelFacets = usePublicModelHubFacets(proxyConfigured);
  const modeOptions = useMemo(() => modelFacets.modes.map((mode) => ({ label: mode, value: mode })), [modelFacets]);
  const featureOptions = useMemo(
    () => modelFacets.features.map((feature) => ({ label: featureLabel(feature), value: feature })),
    [modelFacets],
  );
  const serviceStatus = models.error ? "Service unavailable" : "I'm alive! ✓";
  const [agentSorting, setAgentSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [mcpSorting, setMcpSorting] = useState<SortingState>([{ id: "server_name", desc: false }]);

  const modelColumns = useMemo(() => getPublicModelHubColumns({ onModelClick: showModal }), [showModal]);
  const agentColumns = useMemo(() => getPublicAgentHubColumns({ onAgentClick: showAgentModal }), [showAgentModal]);
  const mcpColumns = useMemo(() => getPublicMCPHubColumns({ onServerClick: showMcpModal }), [showMcpModal]);

  const hasAgents = Array.isArray(agentHubData) && agentHubData.length > 0;
  const hasMcpServers = Array.isArray(mcpHubData) && mcpHubData.length > 0;

  const agentSkillOptions = useMemo(
    () =>
      Array.isArray(agentHubData)
        ? getUniqueAgentSkills(agentHubData).map((skill) => ({ label: skill, value: skill }))
        : [],
    [agentHubData],
  );
  const mcpTransportOptions = useMemo(
    () =>
      Array.isArray(mcpHubData)
        ? getUniqueMcpTransports(mcpHubData).map((transport) => ({ label: transport, value: transport }))
        : [],
    [mcpHubData],
  );

  return (
    <ThemeProvider accessToken={accessToken}>
      <TooltipProvider>
        <div className={isEmbedded ? "w-full" : "min-h-screen bg-card"}>
          {/* Navigation - only show when not embedded */}
          {!isEmbedded && <Navbar accessToken={accessToken || null} isPublicPage={true} />}

          <div className={isEmbedded ? "w-full p-6" : "w-full px-8 py-12"}>
            {/* Embedded Explainer - only shown when embedded in dashboard */}
            {isEmbedded && (
              <div className="mb-6 p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm text-foreground">{uiT("ui.edb4466f0b4c4cb0")}</p>
              </div>
            )}

            {/* About Section - only shown when not embedded */}
            {!isEmbedded && (
              <Card className="mb-10 p-8 bg-card border border-border rounded-lg shadow-xs">
                <h2 className="text-2xl font-semibold mb-6 text-foreground">{uiT("ui.4efca0d10c5feb8e")}</h2>
                <p className="text-foreground mb-6 text-base leading-relaxed">
                  {customDocsDescription ? customDocsDescription : uiT("ui.96d3a1a35961f071")}
                </p>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <span className="w-4 h-4 mr-2">🔧</span>
                    {uiT("ui.586fb615ff4f428c")}
                    {litellmVersion}
                  </span>
                </div>
              </Card>
            )}

            {/* Useful Links - only shown when not embedded */}
            {usefulLinks && Object.keys(usefulLinks).length > 0 && (
              <Card className="mb-10 p-8 bg-card border border-border rounded-lg shadow-xs">
                <h2 className="text-2xl font-semibold mb-6 text-foreground">{uiT("ui.b24be634fa84bd44")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(usefulLinks || {})
                    .map(([title, value]) => {
                      // Handle both old format (string) and new format ({url, index})
                      const url = typeof value === "string" ? value : value.url;
                      const index = typeof value === "string" ? 0 : value.index ?? 0;
                      return { title, url, index };
                    })
                    .sort((a, b) => a.index - b.index)
                    .map(({ title, url }) => (
                      <button
                        key={title}
                        onClick={() => window.open(url, "_blank")}
                        className="flex min-w-0 items-center space-x-3 text-info transition-colors p-3 rounded-lg hover:bg-info/10 border border-border"
                      >
                        <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                        <p className="text-sm font-medium break-words">{title}</p>
                      </button>
                    ))}
                </div>
              </Card>
            )}

            {/* Health and Endpoint Status - only shown when not embedded */}
            {!isEmbedded && (
              <Card className="mb-10 p-8 bg-card border border-border rounded-lg shadow-xs">
                <h2 className="text-2xl font-semibold mb-6 text-foreground">{uiT("ui.ddbb5b6e1a99ba05")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <p className="text-success font-medium text-sm">
                    {uiT("ui.773bc70ef676dc86")} {translateText(serviceStatus)}
                  </p>
                </div>
              </Card>
            )}

            {/* Tabs for Models and Agents */}
            <Card className="p-8 bg-card border border-border rounded-lg shadow-xs">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="public-hub-tabs">
                <TabsList>
                  <TabsTrigger value="models">{uiT("ui.378755ff1951")}</TabsTrigger>
                  {hasAgents && <TabsTrigger value="agents">{uiT("ui.f938778632ed608b")}</TabsTrigger>}
                  {hasMcpServers && <TabsTrigger value="mcp">{uiT("ui.066e87fffe1f19d0")}</TabsTrigger>}
                  <TabsTrigger value="skills">{uiT("ui.96a9a8f03afe775a")}</TabsTrigger>
                </TabsList>

                {/* Models Tab */}
                <TabsContent value="models">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-foreground">{uiT("ui.144945601de405bb")}</h2>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-muted rounded-lg border border-border">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <p className="text-sm font-medium text-foreground">{uiT("ui.dce0fc277e714bf4")}</p>
                        <Tooltip>
                          <TooltipTrigger render={<Info className="w-4 h-4 text-muted-foreground cursor-help" />} />
                          <TooltipContent side="top">{uiT("ui.71c2f8e3cfbe999e")}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <SearchIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={uiT("ui.c42c2d3a045974a0")}
                          aria-label={uiT("ui.082bc19db07dcc3a")}
                          value={models.searchValue}
                          onChange={(e) => models.onSearchChange(e.target.value)}
                          className="border border-border rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-3 text-foreground">{uiT("ui.672f1efd8b87")}</p>
                      <Combobox
                        multiple
                        items={modelFacets.providers}
                        value={models.providerValues}
                        onValueChange={models.onProvidersChange}
                      >
                        <ComboboxChips render={<div ref={anchor} />} className="min-h-8 w-full py-1 text-sm">
                          <ComboboxValue>
                            {(values: string[]) =>
                              values.map((provider) => (
                                <ComboboxChip key={provider} aria-label={provider}>
                                  {provider}
                                </ComboboxChip>
                              ))
                            }
                          </ComboboxValue>
                          <ComboboxChipsInput
                            placeholder={uiT("ui.ed55719bc19ed671")}
                            aria-label={uiT("ui.ed55719bc19ed671")}
                            className="min-w-24"
                          />
                        </ComboboxChips>
                        <ComboboxContent anchor={anchor}>
                          <ComboboxEmpty>{uiT("ui.0bc42eace25559af")}</ComboboxEmpty>
                          <ComboboxList>
                            {(provider: string) => {
                              const { logo } = getProviderLogoAndName(provider);
                              return (
                                <ComboboxItem key={provider} value={provider}>
                                  <span className="flex min-w-0 items-center space-x-2">
                                    {logo && (
                                      <img
                                        src={logo}
                                        alt={provider}
                                        className="w-5 h-5 shrink-0 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    )}
                                    <span className="capitalize break-words">{provider}</span>
                                  </span>
                                </ComboboxItem>
                              );
                            }}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-3 text-foreground">{uiT("ui.7ce1afa3f281b07b")}</p>
                      <MultiSelect
                        options={modeOptions}
                        value={models.modeValues}
                        onValueChange={models.onModesChange}
                        placeholder={uiT("ui.0345a90f92546455")}
                        className="w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-3 text-foreground">{uiT("ui.7b886076f2603682")}</p>
                      <MultiSelect
                        options={featureOptions}
                        value={models.featureValues}
                        onValueChange={models.onFeaturesChange}
                        placeholder={uiT("ui.a85b84bf77fb91bd")}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <DataTable
                    data={models.rows}
                    columns={modelColumns}
                    getRowId={(model, index) => model.model_group || String(index)}
                    sortingMode="server"
                    sorting={models.sorting}
                    onSortingChange={models.onSortingChange}
                    paginationMode="server"
                    pagination={models.pagination}
                    onPaginationChange={models.onPaginationChange}
                    rowCount={models.rowCount}
                    isLoading={models.isLoading}
                    loadingMessage={uiT("ui.cc8b4624f7659c68")}
                    noDataMessage={
                      <PublicHubEmptyState
                        title={models.hasActiveQuery ? uiT("ui.5267f5e646a5a193") : uiT("ui.a5a9895b0241125f")}
                        body={models.hasActiveQuery ? uiT("ui.0cd8a85a01aca803") : uiT("ui.d7b1fecb0794291a")}
                      />
                    }
                    size="compact"
                  />
                </TabsContent>

                {/* Agents Tab */}
                {hasAgents && (
                  <TabsContent value="agents">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-semibold text-foreground">{uiT("ui.2925bc50a6b22883")}</h2>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-muted rounded-lg border border-border">
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <p className="text-sm font-medium text-foreground">{uiT("ui.068e24f6e70a9cd8")}</p>
                          <Tooltip>
                            <TooltipTrigger render={<Info className="w-4 h-4 text-muted-foreground cursor-help" />} />
                            <TooltipContent side="top">{uiT("ui.2330f43f15fa5535")}</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <SearchIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder={uiT("ui.26a2113e002946dd")}
                            value={agentSearchTerm}
                            onChange={(e) => setAgentSearchTerm(e.target.value)}
                            className="border border-border rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium mb-3 text-foreground">{uiT("ui.8b1d44c58a75ff49")}</p>
                        <MultiSelect
                          options={agentSkillOptions}
                          value={selectedAgentSkills}
                          onValueChange={setSelectedAgentSkills}
                          placeholder={uiT("ui.4ead1ce6abe57f80")}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <DataTable
                      data={filteredAgentData}
                      paginationMode="client"
                      columns={agentColumns}
                      getRowId={(agent, index) => agent.name || String(index)}
                      sortingMode="client"
                      sorting={agentSorting}
                      onSortingChange={setAgentSorting}
                      isLoading={agentLoading}
                      loadingMessage={uiT("ui.ae0c1414f42139ce")}
                      noDataMessage={
                        <PublicHubEmptyState title={uiT("ui.38b006752ec7a0a6")} body={uiT("ui.9f4f8d8df1ddf3d7")} />
                      }
                      size="compact"
                    />

                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        {uiT("ui.d604310a789a")} {filteredAgentData.length} {uiT("ui.28391d3bc64ec15c")}{" "}
                        {agentHubData?.length || 0} {uiT("ui.8c70b25cbbbe8e79")}
                      </p>
                    </div>
                  </TabsContent>
                )}

                {/* MCP Servers Tab */}
                {hasMcpServers && (
                  <TabsContent value="mcp">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-semibold text-foreground">{uiT("ui.704e5eab48e8df34")}</h2>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-muted rounded-lg border border-border">
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <p className="text-sm font-medium text-foreground">{uiT("ui.dc4c268fecb82000")}</p>
                          <Tooltip>
                            <TooltipTrigger render={<Info className="w-4 h-4 text-muted-foreground cursor-help" />} />
                            <TooltipContent side="top">{uiT("ui.5a7f20e6a1298e20")}</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <SearchIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder={uiT("ui.2c090ff7f27da18e")}
                            value={mcpSearchTerm}
                            onChange={(e) => setMcpSearchTerm(e.target.value)}
                            className="border border-border rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-transparent bg-card"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium mb-3 text-foreground">{uiT("ui.0212e4d1bcedca83")}</p>
                        <MultiSelect
                          options={mcpTransportOptions}
                          value={selectedMcpTransports}
                          onValueChange={setSelectedMcpTransports}
                          placeholder={uiT("ui.ba65fc58491b7f9f")}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <DataTable
                      data={filteredMcpData}
                      paginationMode="client"
                      columns={mcpColumns}
                      getRowId={(server, index) => server.server_id || String(index)}
                      sortingMode="client"
                      sorting={mcpSorting}
                      onSortingChange={setMcpSorting}
                      isLoading={mcpLoading}
                      loadingMessage={uiT("ui.02f555a8f0e40a88")}
                      noDataMessage={
                        <PublicHubEmptyState title={uiT("ui.883ba29119da6511")} body={uiT("ui.e86bf1085d2a66a3")} />
                      }
                      size="compact"
                    />

                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        {uiT("ui.d604310a789a")} {filteredMcpData.length} {uiT("ui.28391d3bc64ec15c")}{" "}
                        {mcpHubData?.length || 0} {uiT("ui.22a7559f09bf8f82")}
                      </p>
                    </div>
                  </TabsContent>
                )}

                {/* Skill Hub Tab */}
                <TabsContent value="skills">
                  <SkillHubDashboard skills={skillHubData} isLoading={skillLoading} publicPage={true} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Model Details Modal */}
          <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleModalCancel()}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center space-x-2">
                  <span className="break-words">{selectedModel?.model_group || uiT("ui.570f45eae54f9903")}</span>
                  {selectedModel && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Copy
                            onClick={() => copyToClipboard(selectedModel.model_group)}
                            className="cursor-pointer text-muted-foreground hover:text-info w-4 h-4 shrink-0"
                          />
                        }
                      />
                      <TooltipContent>{uiT("ui.136e93e3d54b6013")}</TooltipContent>
                    </Tooltip>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedModel && (
                <div className="space-y-6">
                  {/* Model Overview */}
                  <div>
                    <p className="text-lg font-semibold mb-4">{uiT("ui.517fb906b47bd966")}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-medium">{uiT("ui.1274addbe2f89d6d")}</p>
                        <p>{selectedModel.model_group}</p>
                      </div>
                      <div>
                        <p className="font-medium">{uiT("ui.7ce1afa3f281b07b")}</p>
                        <p>{selectedModel.mode || uiT("ui.dc12bec5d71f167b")}</p>
                      </div>
                      <div>
                        <p className="font-medium">{uiT("ui.35dbeb1dcbaf6ec1")}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedModel.providers ?? []).map((provider) => {
                            const { logo } = getProviderLogoAndName(provider);
                            return (
                              <Badge key={provider} variant="secondary" className="min-w-0">
                                <div className="flex items-center space-x-1">
                                  {logo && (
                                    <img
                                      src={logo}
                                      alt={provider}
                                      className="w-3 h-3 shrink-0 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  )}
                                  <span className="capitalize">{provider}</span>
                                </div>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Wildcard Routing Note */}
                    {selectedModel.model_group.includes("*") && (
                      <div className="bg-info/10 border border-info/20 rounded-lg p-4 mb-4">
                        <div className="flex items-start space-x-2">
                          <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-info mb-2">{uiT("ui.770b64ae87fcfc1a")}</p>
                            <p className="text-sm text-info mb-2">
                              {uiT("ui.eff8685a2d415fc4")}{" "}
                              <code className="bg-info/15 px-1 py-0.5 rounded-sm text-xs">*</code>{" "}
                              {uiT("ui.c1e1aecb8779f33e")}
                            </p>
                            <p className="text-sm text-info">
                              {uiT("ui.37d3ce4743f96f1a")}{" "}
                              <code className="bg-info/15 px-1 py-0.5 rounded-sm text-xs">
                                {selectedModel.model_group}
                              </code>
                              {uiT("ui.4f4d413b80578794")}
                              <code className="bg-info/15 px-1 py-0.5 rounded-sm text-xs">
                                {selectedModel.model_group.replaceAll("*", "my-custom-value")}
                              </code>
                              {uiT("ui.8719bc57c4f03e8b")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

                        if (capabilities.length === 0) {
                          return <p className="text-muted-foreground">{uiT("ui.c5b754a085dc94b9")}</p>;
                        }

                        return capabilities.map((capability) => (
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
                  {selectedModel.supported_openai_params && selectedModel.supported_openai_params.length > 0 && (
                    <div>
                      <p className="text-lg font-semibold mb-4">{uiT("ui.36dbad05448baa1d")}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedModel.supported_openai_params.map((param) => (
                          <Badge key={param} variant="secondary">
                            {param}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage Example */}
                  <div>
                    <p className="text-lg font-semibold mb-4">{uiT("ui.8395ae6b09d334bd")}</p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
                        {(() => {
                          const codeSnippet = generateCodeSnippet({
                            apiKeySource: "custom",
                            accessToken: null,
                            apiKey: "your_api_key",
                            inputMessage: "Hello, how are you?",
                            chatHistory: [
                              { role: "user", content: "Hello, how are you?", isImage: false } as MessageType,
                            ],
                            selectedTags: [],
                            selectedVectorStores: [],
                            selectedGuardrails: [],
                            selectedPolicies: [],
                            selectedMCPServers: [],
                            endpointType: getEndpointType(selectedModel.mode || "chat"),
                            selectedModel: selectedModel.model_group,
                            selectedSdk: "openai",
                          });
                          return codeSnippet;
                        })()}
                      </pre>
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => {
                          const codeSnippet = generateCodeSnippet({
                            apiKeySource: "custom",
                            accessToken: null,
                            apiKey: "your_api_key",
                            inputMessage: "Hello, how are you?",
                            chatHistory: [
                              { role: "user", content: "Hello, how are you?", isImage: false } as MessageType,
                            ],
                            selectedTags: [],
                            selectedVectorStores: [],
                            selectedGuardrails: [],
                            selectedPolicies: [],
                            selectedMCPServers: [],
                            endpointType: getEndpointType(selectedModel.mode || "chat"),
                            selectedModel: selectedModel.model_group,
                            selectedSdk: "openai",
                          });
                          copyToClipboard(codeSnippet);
                        }}
                        className="text-sm text-info hover:text-info/80 cursor-pointer"
                      >
                        {uiT("ui.b749e205302cc219")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Agent Details Modal */}
          <Dialog open={isAgentModalVisible} onOpenChange={(open) => !open && handleAgentModalCancel()}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center space-x-2">
                  <span className="break-words">{selectedAgent?.name || uiT("ui.c2de0f6fe35a07d0")}</span>
                  {selectedAgent && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Copy
                            onClick={() => copyToClipboard(selectedAgent.name)}
                            className="cursor-pointer text-muted-foreground hover:text-info w-4 h-4 shrink-0"
                          />
                        }
                      />
                      <TooltipContent>{uiT("ui.3501411e98639126")}</TooltipContent>
                    </Tooltip>
                  )}
                </DialogTitle>
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
                        <p>{selectedAgent.version}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium">{uiT("ui.0cf2814604b4")}</p>
                        <p>{selectedAgent.description}</p>
                      </div>
                      {selectedAgent.url && (
                        <div>
                          <p className="font-medium">{uiT("ui.734fd77b36107c77")}</p>
                          <a
                            href={selectedAgent.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-info hover:text-info/80 text-sm break-all"
                          >
                            {selectedAgent.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capabilities */}
                  {selectedAgent.capabilities && (
                    <div>
                      <p className="text-lg font-semibold mb-4">{uiT("ui.9460f16ac9b5171e")}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(selectedAgent.capabilities)
                          .filter(([_, value]) => value === true)
                          .map(([key]) => (
                            <Badge key={key} variant="secondary" className="capitalize">
                              {key}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedAgent.skills && selectedAgent.skills.length > 0 && (
                    <div>
                      <p className="text-lg font-semibold mb-4">{uiT("ui.66d0f523a379")}</p>
                      <div className="space-y-4">
                        {selectedAgent.skills.map((skill, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-base">{skill.name}</p>
                                <p className="text-sm text-muted-foreground">{skill.description}</p>
                              </div>
                            </div>
                            {skill.tags && skill.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {skill.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
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
                          {(selectedAgent.defaultInputModes ?? []).map((mode) => (
                            <Badge key={mode} variant="secondary">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{uiT("ui.57130eb22d1c9df9")}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedAgent.defaultOutputModes ?? []).map((mode) => (
                            <Badge key={mode} variant="secondary">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documentation */}
                  {selectedAgent.documentationUrl && (
                    <div>
                      <p className="text-lg font-semibold mb-4">{uiT("ui.c205924de0fe")}</p>
                      <a
                        href={selectedAgent.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-info hover:text-info/80 flex items-center space-x-2"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                        <span>{uiT("ui.4dbe44dc3561a25e")}</span>
                      </a>
                    </div>
                  )}

                  {/* A2A Usage Example */}
                  <div>
                    <p className="text-lg font-semibold mb-4">{uiT("ui.8248e83ac93290b7")}</p>

                    {/* Step 1: Retrieve Agent Card */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 text-foreground">{uiT("ui.46790e263bde8196")}</p>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs">
                          {translateUi("ui.93c27abc3afcb658", undefined, { v0: String(selectedAgent.url) })}
                        </pre>
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            const codeSnippet = `from a2a.client import A2ACardResolver, A2AClient
from a2a.types import (
    AgentCard,
    MessageSendParams,
    SendMessageRequest,
    SendStreamingMessageRequest,
)
from a2a.utils.constants import (
    AGENT_CARD_WELL_KNOWN_PATH,
    EXTENDED_AGENT_CARD_PATH,
)

base_url = '${selectedAgent.url}'

resolver = A2ACardResolver(
    httpx_client=httpx_client,
    base_url=base_url,
    # agent_card_path uses default, extended_agent_card_path also uses default
)

# Fetch Public Agent Card and Initialize Client
final_agent_card_to_use: AgentCard | None = None
_public_card = (
    await resolver.get_agent_card()
)  # Fetches from default public path - \`/agents/{agent_id}/\`
final_agent_card_to_use = _public_card

if _public_card.supports_authenticated_extended_card:
    try:
        auth_headers_dict = {
            'Authorization': 'Bearer dummy-token-for-extended-card'
        }
        _extended_card = await resolver.get_agent_card(
            relative_card_path=EXTENDED_AGENT_CARD_PATH,
            http_kwargs={'headers': auth_headers_dict},
        )
        final_agent_card_to_use = (
            _extended_card  # Update to use the extended card
        )
    except Exception as e_extended:
        logger.warning(
            f'Failed to fetch extended agent card: {e_extended}. Will proceed with public card.',
            exc_info=True,
        )`;
                            copyToClipboard(codeSnippet);
                          }}
                          className="text-sm text-info hover:text-info/80 cursor-pointer"
                        >
                          {uiT("ui.b749e205302cc219")}
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Call the Agent */}
                    <div>
                      <p className="text-sm font-medium mb-2 text-foreground">{uiT("ui.578a302b027f4256")}</p>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs">
                          {`client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 USD in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`}
                        </pre>
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            const codeSnippet = `client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 USD in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`;
                            copyToClipboard(codeSnippet);
                          }}
                          className="text-sm text-info hover:text-info/80 cursor-pointer"
                        >
                          {uiT("ui.b749e205302cc219")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* MCP Server Details Modal */}
          <Dialog open={isMcpModalVisible} onOpenChange={(open) => !open && handleMcpModalCancel()}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
              <DialogHeader>
                <DialogTitle className="flex min-w-0 items-center space-x-2">
                  <span className="break-words">{selectedMcpServer?.server_name || uiT("ui.6dd6d4f2da6e9492")}</span>
                  {selectedMcpServer && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Copy
                            onClick={() => copyToClipboard(selectedMcpServer.server_name)}
                            className="cursor-pointer text-muted-foreground hover:text-info w-4 h-4 shrink-0"
                          />
                        }
                      />
                      <TooltipContent>{uiT("ui.9758ba7e0b38a9fd")}</TooltipContent>
                    </Tooltip>
                  )}
                </DialogTitle>
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
                        <p className="font-medium">{uiT("ui.0212e4d1bcedca83")}</p>
                        <Badge variant="secondary">{selectedMcpServer.transport}</Badge>
                      </div>
                      {selectedMcpServer.alias && (
                        <div>
                          <p className="font-medium">{uiT("ui.40f0c3d5ce898690")}</p>
                          <p>{selectedMcpServer.alias}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{uiT("ui.5ff4a8ab52817436")}</p>
                        <Badge variant={selectedMcpServer.auth_type === "none" ? "outline" : "secondary"}>
                          {selectedMcpServer.auth_type}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium">{uiT("ui.0cf2814604b4")}</p>
                        <p>{selectedMcpServer.mcp_info?.description || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {selectedMcpServer.mcp_info && Object.keys(selectedMcpServer.mcp_info).length > 0 && (
                    <div>
                      <p className="text-lg font-semibold mb-4">{uiT("ui.9276bb4d881a3858")}</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(selectedMcpServer.mcp_info, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Usage Example */}
                  <div>
                    <p className="text-lg font-semibold mb-4">{uiT("ui.8395ae6b09d334bd")}</p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
                        {translateUi("ui.450823782d62016b", undefined, {
                          v0: String(selectedMcpServer.server_name),
                          v1: String(getProxyBaseUrl()),
                          v2: String(selectedMcpServer.server_name),
                        })}
                      </pre>
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => {
                          const codeSnippet = `# Using MCP Server with Python FastMCP

from fastmcp import Client
import asyncio

# Standard MCP configuration
config = {
    "mcpServers": {
        "${selectedMcpServer.server_name}": {
            "url": "${getProxyBaseUrl()}/${selectedMcpServer.server_name}/mcp",
            "headers": {
                "x-litellm-api-key": "Bearer <your-master-key>"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[tool.name for tool in tools]}")

        # Call a tool
        response = await client.call_tool(
            name="tool_name", 
            arguments={"arg": "value"}
        )
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())`;
                          copyToClipboard(codeSnippet);
                        }}
                        className="text-sm text-info hover:text-info/80 cursor-pointer"
                      >
                        {uiT("ui.b749e205302cc219")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default PublicModelHub;
