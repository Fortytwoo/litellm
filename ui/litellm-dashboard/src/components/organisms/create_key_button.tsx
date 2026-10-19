"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { keyKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useProjects } from "@/app/(dashboard)/hooks/projects/useProjects";
import { useTags } from "@/app/(dashboard)/hooks/tags/useTags";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useCan from "@/app/(dashboard)/hooks/useCan";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect, type MultiSelectOption } from "@/components/shared/MultiSelect";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { TagsInput } from "@/app/(dashboard)/guardrails/_components/content_filter/TagsInput";
import { ChevronDown, Info } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { type Control, useForm, useWatch, type UseFormSetValue } from "react-hook-form";
import { isProxyAdminRole, rolesWithWriteAccess } from "../../utils/roles";
import AgentSelector from "../agent_management/AgentSelector";
import SkillSelector from "../skills/SkillSelector";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import BudgetDurationDropdown from "../common_components/budget_duration_dropdown";
import SchemaFormFields from "../common_components/check_openapi_schema";
import KeyLifecycleSettings from "../common_components/KeyLifecycleSettings";
import ModelAliasManager from "../common_components/ModelAliasManager";
import {
  MountedFormField,
  MountedFormProvider,
  projectMountedValues,
  useMountRegistry,
  type MountedFormValues,
} from "../common_components/MountedFormField";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import PremiumLoggingSettings from "../common_components/PremiumLoggingSettings";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import RouterSettingsAccordion, {
  RouterSettingsAccordionRef,
  RouterSettingsAccordionValue,
} from "../common_components/RouterSettingsAccordion";
import TeamDropdown from "../common_components/team_dropdown";
import OrganizationDropdown from "../common_components/OrganizationDropdown";
import ProjectDropdown from "../common_components/ProjectDropdown";
import { CreateUserButton } from "../CreateUserButton";
import { BudgetFallbacksEditor } from "../key_team_helpers/BudgetFallbacksEditor";
import { END_USER_BUDGET_HINT, EndUserBudgetSelect } from "../key_team_helpers/EndUserBudgetSelect";
import { BudgetWindowEntry, BudgetWindowsEditor } from "../key_team_helpers/BudgetWindowsEditor";
import { ModelMaxBudget, ModelMaxBudgetEditor } from "../key_team_helpers/ModelMaxBudgetEditor";
import { TagRateLimitEditor, TagRateLimitEntry } from "../key_team_helpers/TagRateLimitEditor";
import {
  excludeProxyWideSentinel,
  getModelDisplayName,
  hasAllModelsSentinel,
} from "../key_team_helpers/fetch_available_models_team_key";
import { Team } from "../key_team_helpers/key_list";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import { toast } from "@/lib/toast";
import {
  getAgentsList,
  getGuardrailsList,
  getPoliciesList,
  getPossibleUserRoles,
  getPromptsList,
  keyCreateCall,
  keyCreateServiceAccountCall,
  modelAvailableCall,
  proxyBaseUrl,
  userFilterUICall,
} from "../networking";
import CreatedKeyDisplay from "../shared/CreatedKeyDisplay";
import NumericalInput from "../shared/numerical_input";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { buildKeyCreatePayload, type KeyCreateInput } from "./createKeyPayload";
import { simplifyKeyGenerateError } from "./utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const KEY_TYPE_OPTIONS = [
  {
    value: "llm_api",
    get label() {
      return translateUi("ui.d2abdaa27ce8");
    },
    get hint() {
      return translateUi("ui.dd6ebc488d6f849b");
    },
  },
  {
    value: "management",
    get label() {
      return translateUi("ui.e51248773b9a");
    },
    get hint() {
      return translateUi("ui.ff3df0ecc8db7171");
    },
  },
  {
    value: "default",
    get label() {
      return translateUi("ui.1d36da8581e0");
    },
    get hint() {
      return translateUi("ui.2bc65f06c7b55ec0");
    },
  },
];

const KEY_OWNER_LABEL_CLASS = "flex items-center gap-2 text-sm font-normal text-foreground";

const SECTION_HEADER_CLASS = "group/section flex w-full items-center justify-between px-4 py-3 text-left";
const SECTION_CHEVRON_CLASS =
  "size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-180";

type FieldWrite = (value: unknown) => void;

type McpSelectorValue = { servers: string[]; accessGroups: string[]; toolsets?: string[] };

type AgentSelectorValue = { agents: string[]; accessGroups: string[] };

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

const requiredRule = (required: boolean, message: string) => ({
  validate: (value: unknown) => (required && isBlank(value) ? message : true),
});

const ceilingRule = (ceiling: number | null | undefined, message: (limit: number) => string) => ({
  validate: (value: unknown) =>
    value && ceiling !== null && ceiling !== undefined && (value as number) > ceiling ? message(ceiling) : true,
});

interface McpToolPermissionsFieldProps {
  readonly accessToken: string;
  readonly control: Control<MountedFormValues>;
  readonly setValue: UseFormSetValue<MountedFormValues>;
}

const McpToolPermissionsField: React.FC<McpToolPermissionsFieldProps> = ({ accessToken, control, setValue }) => {
  const selection = useWatch({ control, name: "allowed_mcp_servers_and_groups" }) as
    | { servers?: string[]; accessGroups?: string[]; toolsets?: string[] }
    | undefined;
  const toolPermissions = useWatch({ control, name: "mcp_tool_permissions" }) as Record<string, string[]> | undefined;

  return (
    <div className="mt-6">
      <MCPToolPermissions
        accessToken={accessToken}
        selectedServers={selection?.servers || []}
        selectedAccessGroups={selection?.accessGroups || []}
        selectedToolsets={selection?.toolsets || []}
        toolPermissions={toolPermissions || {}}
        onChange={(toolPerms) => setValue("mcp_tool_permissions", toolPerms)}
      />
    </div>
  );
};

/**
 * Interface for pre-filling the create key form from URL parameters
 */
export interface CreateKeyPrefillData {
  owned_by?: "you" | "service_account" | "another_user";
  team_id?: string;
  key_alias?: string;
  models?: string[];
  key_type?: "default" | "llm_api" | "management";
}

interface CreateKeyProps {
  team: Team | null;
  data: any[] | null;
  teams: Team[] | null;
  addKey: (data: any) => void;
  autoOpenCreate?: boolean;
  prefillData?: CreateKeyPrefillData;
}

interface User {
  user_id: string;
  user_email: string | null;
  role?: string;
}

export const fetchTeamModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  teamID: string | null,
): Promise<string[]> => {
  try {
    if (userID === null || userRole === null) {
      return [];
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole, true, teamID, true);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      return available_model_names;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user models:", error);
    return [];
  }
};

export const fetchUserModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  setUserModels: (models: string[]) => void,
) => {
  try {
    if (userID === null || userRole === null) {
      return;
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      setUserModels(available_model_names);
    }
  } catch (error) {
    console.error("Error fetching user models:", error);
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * @deprecated
 * This component is being DEPRECATED in favor of src/app/(dashboard)/virtual-keys/components/CreateKey.tsx
 * Please contribute to the new refactor.
 * ─────────────────────────────────────────────────────────────────────────
 */
const CreateKey: React.FC<CreateKeyProps> = ({ team, teams, data, addKey, autoOpenCreate, prefillData }) => {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken, userId: userID, userRole, premiumUser } = useAuthorized();
  const canEditGuardrails = premiumUser || (userRole != null && rolesWithWriteAccess.includes(userRole));
  const canViewPolicies = useCan("viewPolicies");
  const canViewPrompts = useCan("viewPrompts");
  const { data: organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { data: uiSettingsData } = useUISettings();
  const { data: tagsData } = useTags();
  const enableProjectsUI = Boolean(uiSettingsData?.values?.enable_projects_ui);
  const disableCustomApiKeys = Boolean(uiSettingsData?.values?.disable_custom_api_keys);
  const tagOptions = tagsData ? Object.values(tagsData).map((tag) => ({ value: tag.name, label: tag.name })) : [];
  const queryClient = useQueryClient();
  const [formDefaults] = useState<MountedFormValues>(() => ({
    team_id: team ? team.team_id : null,
    key_type: "llm_api",
    tpm_limit_type: null,
    rpm_limit_type: null,
    mcp_tool_permissions: {},
    duration: "",
  }));
  const form = useForm<MountedFormValues>({
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: formDefaults,
  });
  const registry = useMountRegistry();
  const mountedForm = useMemo(() => ({ control: form.control, registry }), [form.control, registry]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [keyOwner, setKeyOwner] = useState("you");
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [pendingPrefillModels, setPendingPrefillModels] = useState<string[] | null>(null);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [selectedCreateKeyTeam, setSelectedCreateKeyTeam] = useState<Team | null>(team);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [possibleUIRoles, setPossibleUIRoles] = useState<Record<string, Record<string, string>>>({});
  const [userOptions, setUserOptions] = useState<SearchSelectOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState<boolean>(false);
  const latestUserSearchRef = useRef(0);
  const [disabledCallbacks, setDisabledCallbacks] = useState<string[]>([]);
  const [keyType, setKeyType] = useState<string>("llm_api");
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [autoRotationEnabled, setAutoRotationEnabled] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<string>("30d");
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const routerSettingsRef = useRef<RouterSettingsAccordionRef>(null);
  const [budgetLimits, setBudgetLimits] = useState<BudgetWindowEntry[]>([]);
  const [modelMaxBudget, setModelMaxBudget] = useState<ModelMaxBudget>({});
  const [tagRateLimits, setTagRateLimits] = useState<TagRateLimitEntry[]>([]);
  const [budgetFallbacks, setBudgetFallbacks] = useState<Record<string, string[]>>({});
  const [budgetFallbacksKey, setBudgetFallbacksKey] = useState<number>(0);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);
  const [agentsList, setAgentsList] = useState<{ agent_id: string; agent_name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedModels: string[] = (useWatch({ control: form.control, name: "models" }) as string[] | undefined) ?? [];
  const handleCancel = () => {
    setIsModalVisible(false);
    setApiKey(null);
    setSelectedCreateKeyTeam(null);
    form.reset(formDefaults);
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
    setSelectedAgentId(null);
    setSelectedOrganizationId(null);
    setSelectedProjectId(null);
    setBudgetLimits([]);
    setTagRateLimits([]);
    setBudgetFallbacks({});
    setBudgetFallbacksKey((k) => k + 1);
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      fetchUserModels(userID, userRole, accessToken, setUserModels);
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    if (accessToken) {
      getAgentsList(accessToken)
        .then((res) => setAgentsList(res?.agents || []))
        .catch(() => setAgentsList([]));
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    const fetchPrompts = async () => {
      try {
        const response = await getPromptsList(accessToken);
        setPromptsList(Array.from(new Set(response.prompts.map((prompt) => prompt.prompt_id))));
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchGuardrails();
    if (canViewPolicies) fetchPolicies();
    if (canViewPrompts) fetchPrompts();
  }, [accessToken, canViewPolicies, canViewPrompts]);

  // Fetch possible user roles when component mounts
  useEffect(() => {
    const fetchPossibleRoles = async () => {
      try {
        if (accessToken) {
          // Check if roles are cached in session storage
          const cachedRoles = sessionStorage.getItem("possibleUserRoles");
          if (cachedRoles) {
            setPossibleUIRoles(JSON.parse(cachedRoles));
          } else {
            const availableUserRoles = await getPossibleUserRoles(accessToken);
            sessionStorage.setItem("possibleUserRoles", JSON.stringify(availableUserRoles));
            setPossibleUIRoles(availableUserRoles);
          }
        }
      } catch (error) {
        console.error("Error fetching possible user roles:", error);
      }
    };

    fetchPossibleRoles();
  }, [accessToken]);

  // Auto-open modal and prefill form from URL params (deep link).
  // Guarded by write access so we don't open for read-only users.
  useEffect(() => {
    if (autoOpenCreate && !hasPrefilled && teams && userRole && rolesWithWriteAccess.includes(userRole)) {
      // Open the modal
      setIsModalVisible(true);
      setHasPrefilled(true);

      // Apply prefill data if provided
      if (prefillData) {
        // Set key owner (owned_by) - validate that "another_user" is only allowed for Admin
        if (prefillData.owned_by) {
          if (prefillData.owned_by === "another_user" && userRole !== "Admin") {
            // Ignore invalid owned_by for non-admin users, fall back to default
            setKeyOwner("you");
          } else {
            setKeyOwner(prefillData.owned_by);
          }
        }

        // Set team - find the team by ID and set it (only if team exists in user's teams)
        if (prefillData.team_id) {
          const selectedTeam = teams?.find((t) => t.team_id === prefillData.team_id) || null;
          if (selectedTeam) {
            setSelectedCreateKeyTeam(selectedTeam);
            form.setValue("team_id", prefillData.team_id);
          }
          // Silently ignore invalid team_id - don't prefill with a team user doesn't have access to
        }

        // Set key alias
        if (prefillData.key_alias) {
          form.setValue("key_alias", prefillData.key_alias);
        }

        // Defer model selection until we load the allowed model list.
        if (prefillData.models && prefillData.models.length > 0) {
          setPendingPrefillModels(prefillData.models);
        }

        // Set key type
        if (prefillData.key_type) {
          setKeyType(prefillData.key_type);
          form.setValue("key_type", prefillData.key_type);
        }
      }
    }
  }, [autoOpenCreate, prefillData, teams, hasPrefilled, form, userRole]);

  // Check if team selection is required
  const isTeamSelectionRequired = modelsToPick.includes("no-default-models");
  const isFormDisabled = isTeamSelectionRequired && !selectedCreateKeyTeam;

  const handleCreate = async (formValues: MountedFormValues) => {
    try {
      const input: KeyCreateInput = {
        formValues,
        existingKeys: data,
        keyOwner,
        userID,
        selectedAgentId,
        loggingSettings,
        disabledCallbacks,
        autoRotationEnabled,
        rotationInterval,
        modelAliases,
        routerSettings: routerSettingsRef.current?.getValue() ?? routerSettings,
        budgetLimits,
        modelMaxBudget,
        tagRateLimits,
        budgetFallbacks,
      };
      const built = buildKeyCreatePayload(input);
      if (built.kind === "duplicate_alias") {
        throw new Error(
          `Key alias ${built.alias} already exists for team with ID ${built.teamId}, please provide another key alias`,
        );
      }

      toast.info(translateUi("ui.6bd96a047f1a5dee"));
      setIsModalVisible(true);

      if (built.kind === "agent_not_selected") {
        toast.fromError("Please select an agent");
        return;
      }
      const { payload, endpoint } = built;

      const response =
        endpoint === "service_account"
          ? await keyCreateServiceAccountCall(accessToken, payload)
          : await keyCreateCall(accessToken, userID, payload);

      // Add the data to the state in the parent component
      // Also directly update the keys list in VirtualKeysTable without an API call
      addKey(response);

      // Invalidate and refetch all keys list queries to update the table
      // This will trigger a refetch of all key list queries regardless of pagination
      queryClient.invalidateQueries({ queryKey: keyKeys.lists() });

      setApiKey(response["key"]);
      toast.success(translateUi("ui.7600e810ce6288a2"));
      form.reset(formDefaults);
      setBudgetLimits([]);
      setTagRateLimits([]);
      setBudgetFallbacks({});
      setBudgetFallbacksKey((k) => k + 1);
      localStorage.removeItem("userData" + userID);
    } catch (error) {
      const simplifiedError = simplifyKeyGenerateError(error);
      toast.fromError(simplifiedError);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) =>
    void form.handleSubmit(() => handleCreate(projectMountedValues(registry, form.getValues)))(event);

  // Fetch available models when team or auth changes.
  // Note: Model prefill from URL params is handled by the useEffect below, which
  // watches for pendingPrefillModels + modelsToPick to both be populated.
  useEffect(() => {
    if (selectedProjectId) {
      // When a project is selected, use the project's models
      const project = projects?.find((p) => p.project_id === selectedProjectId);
      const projectModels = project?.models ?? [];
      setModelsToPick(projectModels);
      form.setValue("models", []);
      return;
    }
    if (userID && userRole && accessToken) {
      fetchTeamModels(userID, userRole, accessToken, selectedCreateKeyTeam?.team_id ?? null).then((models) => {
        const allModels = excludeProxyWideSentinel(
          Array.from(new Set([...(selectedCreateKeyTeam?.models ?? []), ...models])),
        );
        setModelsToPick(allModels);
      });
    }
    // Only clear models if we don't have pending prefill models
    if (!pendingPrefillModels) {
      form.setValue("models", []);
    }
    // Clear MCP server selection when team changes (available servers may differ)
    form.setValue("allowed_mcp_servers_and_groups", { servers: [], accessGroups: [] });
  }, [selectedCreateKeyTeam, selectedProjectId, accessToken, userID, userRole, form]);

  // Apply deferred model prefill once the available model list arrives.
  // This handles timing where prefill data arrives before or after models are fetched.
  useEffect(() => {
    if (!pendingPrefillModels || pendingPrefillModels.length === 0) {
      return;
    }
    if (!modelsToPick || modelsToPick.length === 0) {
      return;
    }

    const validModels = pendingPrefillModels.filter((model) => modelsToPick.includes(model));
    if (validModels.length > 0) {
      form.setValue("models", validModels);
    }
    setPendingPrefillModels(null);
  }, [pendingPrefillModels, modelsToPick, form]);

  // Sync team when project is selected but teams loaded later (race condition)
  useEffect(() => {
    if (!selectedProjectId || !teams) return;
    const project = projects?.find((p) => p.project_id === selectedProjectId);
    if (!project?.team_id) return;
    // If team is already set correctly, skip
    if (selectedCreateKeyTeam?.team_id === project.team_id) return;
    const projectTeam = teams.find((t) => t.team_id === project.team_id) || null;
    if (projectTeam) {
      setSelectedCreateKeyTeam(projectTeam);
      form.setValue("team_id", projectTeam.team_id);
    }
  }, [teams, selectedProjectId, projects]);

  // Add a callback function to handle user creation
  const handleUserCreated = (userId: string) => {
    form.setValue("user_id", userId);
    setIsCreateUserModalVisible(false);
  };

  const fetchUsers = async (searchText: string): Promise<void> => {
    const searchId = latestUserSearchRef.current + 1;
    latestUserSearchRef.current = searchId;
    const isLatestSearch = (): boolean => searchId === latestUserSearchRef.current;

    if (!searchText) {
      setUserOptions([]);
      setUserSearchLoading(false);
      return;
    }

    setUserSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("search", searchText);
      if (accessToken == null) {
        return;
      }
      const response = await userFilterUICall(accessToken, params);
      if (!isLatestSearch()) return;

      const data: User[] = response;
      const options: SearchSelectOption[] = data.map((user) => ({
        label: user.user_email ? `${user.user_email} (${user.user_id})` : user.user_id,
        value: user.user_id,
      }));

      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (isLatestSearch()) toast.fromError("Failed to search for users");
    } finally {
      if (isLatestSearch()) setUserSearchLoading(false);
    }
  };

  const changeOrganization = (write: FieldWrite) => (orgId: string | null) => {
    write(orgId);
    setSelectedOrganizationId(orgId);
    // Clear team and project when org changes
    setSelectedCreateKeyTeam(null);
    setSelectedProjectId(null);
    form.setValue("team_id", null);
    form.setValue("project_id", null);
  };

  const selectTeam = (team: Team | null) => {
    setSelectedCreateKeyTeam(team);
    setSelectedProjectId(null);
    form.setValue("project_id", null);
    // Auto-populate org from team for non-admin users
    if (team?.organization_id) {
      setSelectedOrganizationId(team.organization_id);
      form.setValue("organization_id", team.organization_id);
    } else if (!team) {
      setSelectedOrganizationId(null);
      form.setValue("organization_id", null);
    }
  };

  const changeProject = (write: FieldWrite) => (projectId: string | null) => {
    write(projectId);
    if (!projectId) {
      setSelectedProjectId(null);
      setSelectedCreateKeyTeam(null);
      form.setValue("team_id", null);
      return;
    }
    setSelectedProjectId(projectId);
  };

  const modelOptions: MultiSelectOption[] = [
    ...(selectedProjectId === null && selectedCreateKeyTeam
      ? [{ value: "all-team-models", label: uiT("ui.48f6183707a2") }]
      : []),
    ...(selectedProjectId === null && !selectedCreateKeyTeam
      ? [{ value: "all-proxy-models", label: uiT("ui.72d4bf586944") }]
      : []),
    ...modelsToPick.map((model) => ({
      value: model,
      label: getModelDisplayName(model),
      disabled: hasAllModelsSentinel(selectedModels),
    })),
  ];

  const changeKeyType = (write: FieldWrite) => (value: string) => {
    write(value);
    setKeyType(value);
    // Clear models field and disable if management or read_only
    if (value === "management" || value === "read_only") {
      form.setValue("models", []);
    }
  };

  return (
    <div>
      {userRole && rolesWithWriteAccess.includes(userRole) && (
        <Button className="mx-auto" onClick={() => setIsModalVisible(true)} data-testid="create-key-button">
          {uiT("ui.d3ca8c0e9dc212a0")}
        </Button>
      )}
      <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">{uiT("ui.7ea9d0fa4ba3")}</DialogTitle>
          </DialogHeader>
          <MountedFormProvider value={mountedForm}>
            <form onSubmit={handleSubmit}>
              {/* Section 1: Key Ownership */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-foreground mb-4">{uiT("ui.f75986a1f21fd3cf")}</h3>
                <Field className="mb-4">
                  <FieldLabel>
                    <span>
                      {uiT("ui.1457c787b98fe5ee")}{" "}
                      <SimpleTooltip content={uiT("ui.ee0d7c411b5ffaa0")}>
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  </FieldLabel>
                  <RadioGroup
                    className="flex flex-wrap items-center gap-4"
                    value={keyOwner}
                    onValueChange={(value: unknown) => setKeyOwner(String(value))}
                  >
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="you" />
                      {uiT("ui.08b041935798fbf6")}
                    </label>
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="service_account" />
                      {uiT("ui.562c51b88d992a9c")}
                    </label>
                    {userRole === "Admin" && (
                      <label className={KEY_OWNER_LABEL_CLASS}>
                        <RadioGroupItem value="another_user" />
                        {uiT("ui.00f92162d92b92f3")}
                      </label>
                    )}
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="agent" />
                      {uiT("ui.11b39c93777e")} <Badge>{uiT("ui.18fdd549b2ed367a")}</Badge>
                    </label>
                  </RadioGroup>
                </Field>

                {keyOwner === "another_user" && (
                  <MountedFormField
                    label={
                      <span>
                        {uiT("ui.7967e089a7b9")}{" "}
                        <SimpleTooltip content={uiT("ui.9a896ad01b3f316f")}>
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="user_id"
                    className="mt-4"
                    required
                    rules={requiredRule(
                      keyOwner === "another_user",
                      `Please input the user ID of the user you are assigning the key to`,
                    )}
                  >
                    {(control) => (
                      <div>
                        <div className="mb-2 flex">
                          <PaginatedSearchSelect
                            options={userOptions}
                            value={typeof control.value === "string" ? control.value : undefined}
                            onValueChange={control.onChange}
                            onSearchChange={fetchUsers}
                            isLoading={userSearchLoading}
                            placeholder={uiT("ui.a6942607662531e1")}
                            emptyText={uiT("ui.bf1e104fb3c8")}
                            loadingText={uiT("ui.78c9d9f6ace0e9b8")}
                            inputId={control.id}
                            aria-required={control["aria-required"] === "true" ? true : undefined}
                            aria-invalid={control["aria-invalid"] === "true" ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                          <Button variant="outline" className="ml-2" onClick={() => setIsCreateUserModalVisible(true)}>
                            {uiT("ui.80532ec0b622")}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">{uiT("ui.1819c2f9011754b6")}</div>
                      </div>
                    )}
                  </MountedFormField>
                )}
                {keyOwner === "agent" && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md dark:bg-purple-950 dark:border-purple-800">
                    <div className="mb-3">
                      <label htmlFor="create-key-agent" className="text-sm font-medium text-foreground">
                        {uiT("ui.1c3b649532b3656f")} <span className="text-destructive">*</span>
                      </label>
                    </div>
                    <SearchSelect
                      inputId="create-key-agent"
                      placeholder={uiT("ui.7d4cf06874635248")}
                      emptyText={uiT("ui.0661615149895720")}
                      value={selectedAgentId}
                      onValueChange={setSelectedAgentId}
                      options={agentsList.map((a) => ({
                        label: a.agent_name || a.agent_id,
                        value: a.agent_id,
                      }))}
                    />
                    <div className="text-xs text-muted-foreground mt-2">{uiT("ui.2d099cd780850765")}</div>
                  </div>
                )}
                <MountedFormField
                  label={
                    <span>
                      {uiT("ui.d764d42592fc")}{" "}
                      <SimpleTooltip content={uiT("ui.fcd3c48b17d993b5")}>
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  }
                  name="organization_id"
                  className="mt-4"
                >
                  {(control) => (
                    <OrganizationDropdown
                      id={control.id}
                      value={typeof control.value === "string" ? control.value : null}
                      organizations={organizations}
                      loading={isOrganizationsLoading}
                      disabled={userRole !== "Admin"}
                      onChange={changeOrganization(control.onChange)}
                    />
                  )}
                </MountedFormField>
                <MountedFormField
                  label={
                    <span>
                      {uiT("ui.5985039f106d")}{" "}
                      <SimpleTooltip content={uiT("ui.58fd784543a3d575")}>
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  }
                  name="team_id"
                  className="mt-4"
                  required={keyOwner === "service_account"}
                  rules={requiredRule(keyOwner === "service_account", "Please select a team for the service account")}
                  help={keyOwner === "service_account" ? "required" : ""}
                >
                  {(control) => (
                    <TeamDropdown
                      id={control.id}
                      value={typeof control.value === "string" ? control.value : null}
                      onChange={control.onChange}
                      disabled={selectedProjectId !== null}
                      organizationId={selectedOrganizationId}
                      onTeamSelect={selectTeam}
                    />
                  )}
                </MountedFormField>
                {enableProjectsUI && (
                  <MountedFormField
                    label={
                      <span>
                        {uiT("ui.985959785319")}{" "}
                        <SimpleTooltip content={uiT("ui.15d35a4ee67cb6de")}>
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="project_id"
                    className="mt-4"
                  >
                    {(control) => (
                      <ProjectDropdown
                        id={control.id}
                        value={typeof control.value === "string" ? control.value : null}
                        projects={projects}
                        teamId={selectedCreateKeyTeam?.team_id}
                        loading={isProjectsLoading || !teams}
                        onChange={changeProject(control.onChange)}
                      />
                    )}
                  </MountedFormField>
                )}
              </div>

              {/* Show message when team selection is required */}
              {isFormDisabled && (
                <div className="mb-8 p-4 bg-info/10 border border-info/20 rounded-md">
                  <p className="text-info text-sm">{uiT("ui.989b197762fb3653")}</p>
                </div>
              )}

              {/* Section 2: Key Details */}
              {!isFormDisabled && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-4">{uiT("ui.be69569f4c00c7d3")}</h3>
                  <MountedFormField
                    label={
                      <span>
                        {keyOwner === "you" || keyOwner === "another_user"
                          ? uiT("ui.750c6798ab7ffc9a")
                          : uiT("ui.bde626c5ca64a2b7")}{" "}
                        <SimpleTooltip
                          content={
                            keyOwner === "you" || keyOwner === "another_user"
                              ? uiT("ui.fca2f94a58a45433")
                              : uiT("ui.aaa2d279e67f6413")
                          }
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="key_alias"
                    required
                    rules={requiredRule(
                      true,
                      `Please input a ${keyOwner === "you" ? "key name" : "service account ID"}`,
                    )}
                    help="required"
                  >
                    {(control) => <Input {...control} value={(control.value as string | undefined) ?? ""} />}
                  </MountedFormField>

                  <MountedFormField
                    label={
                      <span>
                        {uiT("ui.d17d2d78d76e")}{" "}
                        <SimpleTooltip content={uiT("ui.a98a5d0d80ff8ce3")}>
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="models"
                    help={
                      keyType === "management" || keyType === "read_only"
                        ? uiT("ui.b50e49e8d965")
                        : "optional - leave empty to allow access to all models"
                    }
                    className="mt-4"
                  >
                    {(control) => (
                      <MultiSelect
                        id={control.id}
                        options={modelOptions}
                        value={(control.value as string[] | undefined) ?? []}
                        placeholder={uiT("ui.9fcdcf02670c")}
                        disabled={keyType === "management" || keyType === "read_only"}
                        onValueChange={(values) => {
                          control.onChange(values);
                          if (values.includes("all-team-models")) {
                            form.setValue("models", ["all-team-models"]);
                          } else if (values.includes("all-proxy-models")) {
                            form.setValue("models", ["all-proxy-models"]);
                          }
                        }}
                      />
                    )}
                  </MountedFormField>

                  <MountedFormField
                    label={
                      <span>
                        {uiT("ui.8cf6b66156ec")}{" "}
                        <SimpleTooltip content={uiT("ui.2cc17d21811056ce")}>
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="key_type"
                    className="mt-4"
                  >
                    {(control) => (
                      <Select
                        items={KEY_TYPE_OPTIONS}
                        value={control.value as string | undefined}
                        onValueChange={(value: string | null) =>
                          value != null && changeKeyType(control.onChange)(value)
                        }
                      >
                        <SelectTrigger
                          id={control.id}
                          className="w-full"
                          aria-invalid={control["aria-invalid"]}
                          aria-describedby={control["aria-describedby"]}
                        >
                          <SelectValue placeholder={uiT("ui.4d9158f200f3")} />
                        </SelectTrigger>
                        <SelectContent>
                          {KEY_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="py-1">
                                <div className="font-medium">{option.label}</div>
                                <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </MountedFormField>
                </div>
              )}

              {/* Section 3: Optional Settings */}
              {!isFormDisabled && (
                <div className="mb-8">
                  <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                    <h3 className="m-0 text-lg font-medium text-foreground">
                      <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                        {uiT("ui.22cacf9e2be2ffa0")}
                        <ChevronDown className={SECTION_CHEVRON_CLASS} />
                      </CollapsibleTrigger>
                    </h3>
                    <CollapsibleContent className="px-4 pb-3">
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.afa99ea4a8c3")}{" "}
                            <SimpleTooltip content={uiT("ui.9a8d758bcca165e9")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="max_budget"
                        help={`Budget cannot exceed team max budget: $${team?.max_budget !== null && team?.max_budget !== undefined ? team?.max_budget : "unlimited"}`}
                        rules={ceilingRule(
                          team?.max_budget,
                          (limit) => `Budget cannot exceed team max budget: $${formatNumberWithCommas(limit, 4)}`,
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={0.01}
                            precision={2}
                            width={200}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.66b0753db929")}{" "}
                            <SimpleTooltip content={uiT("ui.d9882fdada2dc1c3")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="budget_duration"
                        help={`Team Reset Budget: ${team?.budget_duration !== null && team?.budget_duration !== undefined ? team?.budget_duration : "None"}`}
                      >
                        {(control) => (
                          <BudgetDurationDropdown
                            id={control.id}
                            value={control.value as string | null | undefined}
                            showNeverResets
                            placeholder={uiT("ui.4895f73177ab")}
                            onChange={(next) => control.onChange(next ?? undefined)}
                          />
                        )}
                      </MountedFormField>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {uiT("ui.34a7ff25992a01c3")}{" "}
                            <SimpleTooltip content={uiT("ui.63deaaac37918156")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <BudgetWindowsEditor value={budgetLimits} onChange={setBudgetLimits} />
                      </Field>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {uiT("ui.d60b24269c388c15")}{" "}
                            <SimpleTooltip content={uiT("ui.6bce0ef3d22e90c6")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <ModelMaxBudgetEditor
                          value={modelMaxBudget}
                          onChange={setModelMaxBudget}
                          availableModels={modelsToPick}
                          premiumUser={premiumUser === true}
                        />
                      </Field>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {uiT("ui.a0e9a1ac2373")}{" "}
                            <SimpleTooltip content={uiT("ui.06033d4d9cd39a9d")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <BudgetFallbacksEditor
                          key={budgetFallbacksKey}
                          value={budgetFallbacks}
                          onChange={setBudgetFallbacks}
                          availableModels={modelsToPick}
                        />
                      </Field>
                      {keyOwner === "service_account" && isProxyAdminRole(userRole ?? "") && (
                        <MountedFormField
                          className="mt-4"
                          label={
                            <span>
                              {uiT("ui.07ea33873919f740")}{" "}
                              <SimpleTooltip content={END_USER_BUDGET_HINT}>
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </SimpleTooltip>
                            </span>
                          }
                          name="end_user_budget_id"
                        >
                          {(control) => (
                            <EndUserBudgetSelect
                              id={control.id}
                              accessToken={accessToken}
                              value={typeof control.value === "string" ? control.value : null}
                              onChange={control.onChange}
                              canEdit
                            />
                          )}
                        </MountedFormField>
                      )}
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.fc2295c5aa4194d7")}{" "}
                            <SimpleTooltip content={uiT("ui.354c6168b4b98187")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="tpm_limit"
                        help={`TPM cannot exceed team TPM limit: ${team?.tpm_limit !== null && team?.tpm_limit !== undefined ? team?.tpm_limit : "unlimited"}`}
                        rules={ceilingRule(
                          team?.tpm_limit,
                          (limit) => `TPM limit cannot exceed team TPM limit: ${limit}`,
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={1}
                            width={400}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField name="tpm_limit_type" bare>
                        {(control) => (
                          <RateLimitTypeFormItem
                            type="tpm"
                            name="tpm_limit_type"
                            className="mt-4"
                            showDetailedDescriptions
                            id={control.id}
                            value={control.value as string | null | undefined}
                            onChange={control.onChange}
                            aria-invalid={control["aria-invalid"] ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.78a5a4ba4bb627b1")}{" "}
                            <SimpleTooltip content={uiT("ui.bd211898e91a5d70")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="rpm_limit"
                        help={`RPM cannot exceed team RPM limit: ${team?.rpm_limit !== null && team?.rpm_limit !== undefined ? team?.rpm_limit : "unlimited"}`}
                        rules={ceilingRule(
                          team?.rpm_limit,
                          (limit) => `RPM limit cannot exceed team RPM limit: ${limit}`,
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={1}
                            width={400}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField name="rpm_limit_type" bare>
                        {(control) => (
                          <RateLimitTypeFormItem
                            type="rpm"
                            name="rpm_limit_type"
                            className="mt-4"
                            showDetailedDescriptions
                            id={control.id}
                            value={control.value as string | null | undefined}
                            onChange={control.onChange}
                            aria-invalid={control["aria-invalid"] ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.a7e8917eff0624f4")}{" "}
                            <SimpleTooltip content={uiT("ui.de76b226d2634d8d")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="tpd_limit"
                        help={`TPD cannot exceed team TPD limit: ${team?.tpd_limit !== null && team?.tpd_limit !== undefined ? team?.tpd_limit : "unlimited"}`}
                        rules={ceilingRule(
                          team?.tpd_limit,
                          (limit) => `TPD limit cannot exceed team TPD limit: ${limit}`,
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={1}
                            width={400}
                          />
                        )}
                      </MountedFormField>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {uiT("ui.cdbe0b845ccbd0f7")}{" "}
                            <SimpleTooltip content={uiT("ui.3c676b7c07237034")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <TagRateLimitEditor value={tagRateLimits} onChange={setTagRateLimits} />
                      </Field>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.e1c85f09ac430a8e")}{" "}
                            <SimpleTooltip content={uiT("ui.37dbe05f6fa8e61d")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="throttle_on_budget_exceeded"
                      >
                        {(control) => (
                          <Switch
                            id={control.id}
                            checked={control.value === true}
                            onCheckedChange={control.onChange}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {uiT("ui.596e169941369ac3")}{" "}
                            <SimpleTooltip content={uiT("ui.c051826f964d9e1c")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="enable_prompt_caching"
                      >
                        {(control) => (
                          <Switch
                            id={control.id}
                            checked={control.value === true}
                            onCheckedChange={control.onChange}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.443f975eefe8")}{" "}
                            <SimpleTooltip content={uiT("ui.247ab3c00255be36")}>
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                              >
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </a>
                            </SimpleTooltip>
                          </span>
                        }
                        name="guardrails"
                        className="mt-4"
                        help={
                          canEditGuardrails
                            ? "Select existing guardrails or enter new ones"
                            : "Premium feature - Upgrade to set guardrails by key"
                        }
                      >
                        {(control) => (
                          <TagsInput
                            id={control.id}
                            value={(control.value as string[] | undefined) ?? []}
                            onValueChange={control.onChange}
                            disabled={!canEditGuardrails}
                            placeholder={!canEditGuardrails ? uiT("ui.71da41c8f940dc22") : uiT("ui.25c531a59a96bbe3")}
                            options={guardrailsList.map((name) => ({ value: name, label: name }))}
                          />
                        )}
                      </MountedFormField>
                      {userRole != null && isProxyAdminRole(userRole) && (
                        <MountedFormField
                          label={
                            <span>
                              {uiT("ui.c98d9cde3398")}{" "}
                              <SimpleTooltip content={uiT("ui.750240de3825ef4e")}>
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </a>
                              </SimpleTooltip>
                            </span>
                          }
                          name="disable_global_guardrails"
                          className="mt-4"
                          help={
                            canEditGuardrails
                              ? "Bypass global guardrails for this key"
                              : "Premium feature - Upgrade to disable global guardrails by key"
                          }
                        >
                          {(control) => (
                            <Switch
                              id={control.id}
                              checked={control.value === true}
                              onCheckedChange={control.onChange}
                              disabled={!canEditGuardrails}
                              aria-describedby={control["aria-describedby"]}
                            />
                          )}
                        </MountedFormField>
                      )}
                      {canViewPolicies && (
                        <MountedFormField
                          label={
                            <span>
                              {uiT("ui.d3ad1f1f8c9c")}{" "}
                              <SimpleTooltip content={uiT("ui.dd5c93ab7681c851")}>
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </a>
                              </SimpleTooltip>
                            </span>
                          }
                          name="policies"
                          className="mt-4"
                          help={
                            premiumUser
                              ? "Select existing policies or enter new ones"
                              : "Premium feature - Upgrade to set policies by key"
                          }
                        >
                          {(control) => (
                            <TagsInput
                              id={control.id}
                              value={(control.value as string[] | undefined) ?? []}
                              onValueChange={control.onChange}
                              disabled={!premiumUser}
                              placeholder={!premiumUser ? uiT("ui.57a0363fc33426ba") : uiT("ui.64f01b23acc2a5ee")}
                              options={policiesList.map((name) => ({ value: name, label: name }))}
                            />
                          )}
                        </MountedFormField>
                      )}
                      {canViewPrompts && (
                        <MountedFormField
                          label={
                            <span>
                              {uiT("ui.5f2e66e65397")}{" "}
                              <SimpleTooltip content={uiT("ui.930c4e61426731d9")}>
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/prompt_management"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </a>
                              </SimpleTooltip>
                            </span>
                          }
                          name="prompts"
                          className="mt-4"
                          help={
                            premiumUser
                              ? "Select existing prompts or enter new ones"
                              : "Premium feature - Upgrade to set prompts by key"
                          }
                        >
                          {(control) => (
                            <TagsInput
                              id={control.id}
                              value={(control.value as string[] | undefined) ?? []}
                              onValueChange={control.onChange}
                              disabled={!premiumUser}
                              placeholder={!premiumUser ? uiT("ui.0819898854a0cc5a") : uiT("ui.39bc50ed091f0e06")}
                              options={promptsList.map((name) => ({ value: name, label: name }))}
                            />
                          )}
                        </MountedFormField>
                      )}
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.b0252ccc6e86")}{" "}
                            <SimpleTooltip content={uiT("ui.f0d4e5f6e4f030a3")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="access_group_ids"
                        className="mt-4"
                        help="Select access groups to assign to this key"
                      >
                        {(control) => (
                          <AccessGroupSelector
                            value={control.value as string[] | undefined}
                            onChange={control.onChange}
                            placeholder={uiT("ui.0241d89497da")}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.c46eae929e67")}{" "}
                            <SimpleTooltip content={uiT("ui.703e72e4b4183559")}>
                              <a
                                href="https://docs.litellm.ai/docs/proxy/pass_through"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                              >
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </a>
                            </SimpleTooltip>
                          </span>
                        }
                        name="allowed_passthrough_routes"
                        className="mt-4"
                        help={
                          premiumUser
                            ? "Select existing pass through routes or enter new ones"
                            : "Premium feature - Upgrade to set pass through routes by key"
                        }
                      >
                        {(control) => (
                          <PassThroughRoutesSelector
                            value={control.value as string[] | undefined}
                            onChange={control.onChange}
                            accessToken={accessToken}
                            placeholder={!premiumUser ? uiT("ui.ddfb743b0d10a33b") : uiT("ui.18d931111bc94d2b")}
                            disabled={!premiumUser}
                            teamId={selectedCreateKeyTeam ? selectedCreateKeyTeam.team_id : null}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.df02e3f9df6db929")}{" "}
                            <SimpleTooltip content={uiT("ui.8cc22fce9227c56a")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="allowed_vector_store_ids"
                        className="mt-4"
                        help="Select vector stores this key can access. Leave empty for access to all vector stores"
                      >
                        {(control) => (
                          <VectorStoreSelector
                            onChange={control.onChange}
                            value={control.value as string[] | undefined}
                            accessToken={accessToken}
                            placeholder={uiT("ui.3881edd7c2157a1f")}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.9eddf573cb50")}{" "}
                            <SimpleTooltip content={uiT("ui.3012d5950c359d39")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="metadata"
                        className="mt-4"
                      >
                        {(control) => (
                          <Textarea
                            {...control}
                            value={(control.value as string | undefined) ?? ""}
                            rows={4}
                            placeholder={uiT("ui.10b479100f50")}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {uiT("ui.1331275bc537")}{" "}
                            <SimpleTooltip content={uiT("ui.c7f7ed2183c280cb")}>
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="tags"
                        className="mt-4"
                        help={`Tags for tracking spend and/or doing tag-based routing.`}
                      >
                        {(control) => (
                          <TagsInput
                            id={control.id}
                            value={(control.value as string[] | undefined) ?? []}
                            onValueChange={control.onChange}
                            placeholder={uiT("ui.ece0d183110d")}
                            tokenSeparators={[","]}
                            options={tagOptions}
                          />
                        )}
                      </MountedFormField>
                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.2d8a5a12c36bd164")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {uiT("ui.d9543d4a192d4721")}{" "}
                                <SimpleTooltip content={uiT("ui.5696cecab9ceef9b")}>
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_mcp_servers_and_groups"
                            help="Select MCP servers or access groups this key can access"
                          >
                            {(control) => (
                              <MCPServerSelector
                                onChange={control.onChange}
                                value={control.value as McpSelectorValue | undefined}
                                accessToken={accessToken}
                                teamId={selectedCreateKeyTeam?.team_id ?? null}
                                placeholder={uiT("ui.932feda2a896")}
                                allowNoMcpServers
                              />
                            )}
                          </MountedFormField>

                          {/* Hidden field to register mcp_tool_permissions with the form */}
                          <MountedFormField name="mcp_tool_permissions" bare>
                            {(control) => <input type="hidden" id={control.id} name={control.name} />}
                          </MountedFormField>

                          <McpToolPermissionsField
                            accessToken={accessToken}
                            control={form.control}
                            setValue={form.setValue}
                          />
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.b526bb2e5b8f7f1a")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {uiT("ui.299b3b300b6c1f97")}{" "}
                                <SimpleTooltip content={uiT("ui.47145a3bef8ecd97")}>
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_agents_and_groups"
                            help="Select agents or access groups this key can access"
                          >
                            {(control) => (
                              <AgentSelector
                                onChange={control.onChange}
                                value={control.value as AgentSelectorValue | undefined}
                                accessToken={accessToken}
                                placeholder={uiT("ui.3c8350c1d0ba")}
                              />
                            )}
                          </MountedFormField>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.8be5b320492524f3")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {uiT("ui.595339ca76594e55")}{" "}
                                <SimpleTooltip content={uiT("ui.5618aca04873a94c")}>
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_skills"
                            help="Select private skills this key can access in the Claude Code marketplace"
                          >
                            {(control) => (
                              <SkillSelector
                                onChange={control.onChange}
                                value={control.value as string[] | undefined}
                                accessToken={accessToken}
                                placeholder={uiT("ui.88d6ecd86716470f")}
                              />
                            )}
                          </MountedFormField>
                        </CollapsibleContent>
                      </Collapsible>

                      {premiumUser ? (
                        <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                          <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                            <b>{uiT("ui.f5d87a5328ff")}</b>
                            <ChevronDown className={SECTION_CHEVRON_CLASS} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-3">
                            <div className="mt-4">
                              <PremiumLoggingSettings
                                value={loggingSettings}
                                onChange={setLoggingSettings}
                                premiumUser={true}
                                disabledCallbacks={disabledCallbacks}
                                onDisabledCallbacksChange={setDisabledCallbacks}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SimpleTooltip
                          className="w-full"
                          content={
                            <span>
                              {uiT("ui.a64a4089c05f4fde")}
                              <a href="https://www.litellm.ai/enterprise" target="_blank">
                                https://www.litellm.ai/enterprise
                              </a>
                            </span>
                          }
                          side="top"
                        >
                          <div style={{ position: "relative" }}>
                            <div style={{ opacity: 0.5 }}>
                              <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                                <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                                  <b>{uiT("ui.f5d87a5328ff")}</b>
                                  <ChevronDown className={SECTION_CHEVRON_CLASS} />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-4 pb-3">
                                  <div className="mt-4">
                                    <PremiumLoggingSettings
                                      value={loggingSettings}
                                      onChange={setLoggingSettings}
                                      premiumUser={false}
                                      disabledCallbacks={disabledCallbacks}
                                      onDisabledCallbacksChange={setDisabledCallbacks}
                                    />
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                            <div style={{ position: "absolute", inset: 0, cursor: "not-allowed" }} />
                          </div>
                        </SimpleTooltip>
                      )}

                      <Collapsible
                        key={`router-settings-accordion-${routerSettingsKey}`}
                        className="mt-4 mb-4 overflow-hidden rounded-lg border"
                      >
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.c4b306b8f296")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4 w-full">
                            <RouterSettingsAccordion
                              key={routerSettingsKey}
                              ref={routerSettingsRef}
                              accessToken={accessToken || ""}
                              value={routerSettings || undefined}
                              onChange={setRouterSettings}
                              modelData={
                                userModels.length > 0
                                  ? { data: userModels.map((model) => ({ model_name: model })) }
                                  : undefined
                              }
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.af75f10e90acaee3")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-4">{uiT("ui.f1f941aa1aa12857")}</p>
                            <ModelAliasManager
                              accessToken={accessToken}
                              initialModelAliases={modelAliases}
                              onAliasUpdate={setModelAliases}
                              showExampleConfig={false}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{uiT("ui.4d1e271f22d119f9")}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4">
                            <MountedFormField name="duration" bare>
                              {(control) => (
                                <KeyLifecycleSettings
                                  id={control.id}
                                  value={control.value as string | undefined}
                                  onChange={control.onChange}
                                  autoRotationEnabled={autoRotationEnabled}
                                  onAutoRotationChange={setAutoRotationEnabled}
                                  rotationInterval={rotationInterval}
                                  onRotationIntervalChange={setRotationInterval}
                                  isCreateMode={true}
                                />
                              )}
                            </MountedFormField>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <div className="flex items-center gap-2">
                            <b>{uiT("ui.22d4f6088b718aa4")}</b>
                            <SimpleTooltip
                              content={
                                <span>
                                  {uiT("ui.5c4233f4096090f3")}{" "}
                                  <a
                                    href={
                                      proxyBaseUrl
                                        ? `${proxyBaseUrl}/#/key%20management/generate_key_fn_key_generate_post`
                                        : `/#/key%20management/generate_key_fn_key_generate_post`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-info hover:text-info/80"
                                  >
                                    {uiT("ui.caf9f906b16a91cb")}
                                  </a>
                                </span>
                              }
                            >
                              <Info className="size-4 text-muted-foreground hover:text-foreground cursor-help" />
                            </SimpleTooltip>
                          </div>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <SchemaFormFields
                            schemaComponent="GenerateKeyRequest"
                            setValue={form.setValue}
                            excludedFields={[
                              "key_alias",
                              "team_id",
                              "organization_id",
                              "models",
                              "duration",
                              "metadata",
                              "tags",
                              "guardrails",
                              "max_budget",
                              "budget_duration",
                              "tpm_limit",
                              "rpm_limit",
                              "tpd_limit",
                              ...(disableCustomApiKeys ? ["key"] : []),
                            ]}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              <div style={{ textAlign: "right", marginTop: "10px" }}>
                <Button type="submit" disabled={isFormDisabled}>
                  {uiT("ui.2c302f787a1e")}
                </Button>
              </div>
            </form>
          </MountedFormProvider>
        </DialogContent>
      </Dialog>

      {/* Add the Create User Modal */}
      {isCreateUserModalVisible && (
        <Dialog open={isCreateUserModalVisible} onOpenChange={(open) => !open && setIsCreateUserModalVisible(false)}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{uiT("ui.b94e41c963249855")}</DialogTitle>
            </DialogHeader>
            <CreateUserButton
              userID={userID}
              accessToken={accessToken}
              possibleUIRoles={possibleUIRoles}
              onUserCreated={handleUserCreated}
              isEmbedded={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {apiKey && (
        <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="grid grid-cols-1 gap-2 w-full">
              <DialogTitle className="text-lg font-medium text-foreground">{uiT("ui.426d928738bb6388")}</DialogTitle>
              {apiKey != null ? (
                <CreatedKeyDisplay apiKey={apiKey} />
              ) : (
                <p className="text-sm">{uiT("ui.6064cf4281f95d33")}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CreateKey;
