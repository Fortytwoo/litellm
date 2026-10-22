"use client";
import { formatMoney } from "@/utils/currency";
import { getFormattingLocale } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useModelAccessGroupNames } from "@/app/(dashboard)/hooks/models/useModels";
import { useProjects } from "@/app/(dashboard)/hooks/projects/useProjects";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { useApplyUserBudgetToTeamKeys } from "@/app/(dashboard)/hooks/uiSettings/useApplyUserBudgetToTeamKeys";
import useTeams from "@/app/(dashboard)/hooks/useTeams";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { mapEmptyStringToNull } from "@/utils/keyUpdateUtils";
import { ArrowLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityLink } from "@/components/shared/EntityLink";
import { modelOrAccessGroupHref, teamDetailHref } from "@/utils/entityLinks";
import { BadgeLink } from "@/components/shared/BadgeLink";
import { KeyInfoHeader } from "./KeyInfoHeader";
import KeySavingsTab from "./KeySavingsTab";
import KeyAutoRouterUsageTab from "./KeyAutoRouterUsageTab";
import { useActivityDateRange } from "@/app/(dashboard)/cost-optimization/_components/useDailyActivityRange";
import { useEffect, useState } from "react";
import {
  hasProxyWideSpendView,
  isProxyAdminRole,
  isUserTeamAdminForSingleTeam,
  rolesWithWriteAccess,
} from "../../utils/roles";
import { mapDisplayToInternalNames, mapInternalToDisplayNames } from "../callback_info_helpers";
import AutoRotationView from "../common_components/AutoRotationView";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import RouterSettingsSummary from "../common_components/RouterSettingsSummary";
import { hasRouterSettings } from "../common_components/routerSettingsPayload";
import { extractLoggingSettings, formatMetadataForDisplay, stripTagsFromMetadata } from "../key_info_utils";
import { KeyResponse } from "../key_team_helpers/key_list";
import LoggingSettingsView from "../logging_settings_view";
import { toast } from "@/lib/toast";
import { getPolicyInfoWithGuardrails, keyDeleteCall, keyUpdateCall } from "../networking";
import { useResetKeySpend } from "@/app/(dashboard)/hooks/keys/useResetKeySpend";
import { useSetKeyBlockedState } from "@/app/(dashboard)/hooks/keys/useSetKeyBlockedState";
import { keyKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useQueryClient } from "@tanstack/react-query";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcpServers/useMCPToolsets";
import { extractMcpEntitlement } from "../mcp_server_management/mcpEntitlement";
import ObjectPermissionsView from "../object_permissions_view";
import { RegenerateKeyModal } from "../organisms/RegenerateKeyModal";
import { parseErrorMessage } from "../shared/errorUtils";
import { InheritedBudgetHint, inheritedBudgetGates, keyOwnerBudgetSource } from "../shared/InheritedBudgetHint";
import { KeyEditView } from "./key_edit_view";
import { isTeamAdminEditingMemberKey, teamAdminMemberKeyPayload } from "./teamAdminMemberKeyPayload";

export function needsLifetimeSpendBackfill(spend: number, totalSpend: number | null | undefined): boolean {
  return (totalSpend ?? 0) < spend;
}

interface KeyInfoViewProps {
  keyId: string;
  onClose: () => void;
  keyData: KeyResponse | undefined;
  onKeyDataUpdate?: (data: Partial<KeyResponse>) => void;
  onDelete?: () => void;
  teams: any[] | null;
  backButtonText?: string;
}

// Premium fields (from LiteLLM_ManagementEndpoint_MetadataFields_Premium in
// litellm/proxy/_types.py) that the key-edit form submits as arrays/strings, where
// "empty" means "unset". The loop below drops them when they're empty-and-were-empty
// so a non-premium edit of unrelated fields doesn't trip the server's premium gate.
//
// Boolean premium fields (e.g. disable_global_guardrails) do NOT belong here: false is
// a real value, not "empty", so isEmptyValue(false) is false and the loop would never
// drop it — we'd resend false on every edit and trip the gate. Booleans get their own
// "send only when changed" guard instead (see disable_global_guardrails below).
const PREMIUM_METADATA_FIELDS = ["policies", "guardrails", "prompts", "tags", "allowed_passthrough_routes"] as const;

const isEmptyValue = (v: unknown): boolean =>
  v == null || (Array.isArray(v) && v.length === 0) || (typeof v === "string" && v.trim() === "");

/**
 * ─────────────────────────────────────────────────────────────────────────
 * @deprecated
 * This component is being DEPRECATED in favor of src/app/(dashboard)/virtual-keys/components/KeyInfoView.tsx
 * Please contribute to the new refactor.
 * ─────────────────────────────────────────────────────────────────────────
 */
export default function KeyInfoView({
  onClose,
  keyData,
  teams,
  onKeyDataUpdate,
  onDelete,
  backButtonText = "Back to Keys",
}: KeyInfoViewProps) {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken, userId: userID, userRole, premiumUser } = useAuthorized();
  const accessGroupNames = useModelAccessGroupNames();
  const activityDateRange = useActivityDateRange();
  const queryClient = useQueryClient();
  const canEditGuardrails = premiumUser || (userRole != null && rolesWithWriteAccess.includes(userRole));
  const { teams: teamsData } = useTeams();
  const { data: organizations } = useOrganizations();
  const { data: projects } = useProjects();
  const { data: uiSettingsData } = useUISettings();
  const applyUserBudgetToTeamKeys = useApplyUserBudgetToTeamKeys();
  const { data: allMcpServers } = useMCPServers();
  const { data: allMcpToolsets } = useMCPToolsets();
  const enableProjectsUI = Boolean(uiSettingsData?.values?.enable_projects_ui);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isResetSpendModalOpen, setIsResetSpendModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const { mutate: resetKeySpend, isPending: resetSpendLoading } = useResetKeySpend();
  const { mutate: setKeyBlockedState, isPending: blockLoading } = useSetKeyBlockedState();
  // Add local state to maintain key data and track regeneration
  const [currentKeyData, setCurrentKeyData] = useState<KeyResponse | undefined>(keyData);
  const [lastRegeneratedAt, setLastRegeneratedAt] = useState<Date | null>(null);
  const [keyDataUpdateHeldUntilModalClose, setKeyDataUpdateHeldUntilModalClose] = useState<Partial<KeyResponse> | null>(
    null,
  );
  const [isRecentlyRegenerated, setIsRecentlyRegenerated] = useState(false);
  const [policyGuardrails, setPolicyGuardrails] = useState<Record<string, string[]>>({});
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Update local state when keyData prop changes (but don't reset to undefined)
  useEffect(() => {
    if (keyData) {
      setCurrentKeyData(keyData);
    }
  }, [keyData]);

  // Fetch resolved guardrails for all policies
  useEffect(() => {
    const fetchPolicyGuardrails = async () => {
      const policies = currentKeyData?.metadata?.policies;
      if (!accessToken || !policies || !Array.isArray(policies) || policies.length === 0) {
        return;
      }

      setLoadingPolicies(true);
      const guardrailsMap: Record<string, string[]> = {};

      try {
        await Promise.all(
          policies.map(async (policyName: string) => {
            try {
              const policyInfo = await getPolicyInfoWithGuardrails(accessToken, policyName);
              guardrailsMap[policyName] = policyInfo.resolved_guardrails || [];
            } catch (error) {
              console.error(`Failed to fetch guardrails for policy ${policyName}:`, error);
              guardrailsMap[policyName] = [];
            }
          }),
        );
        setPolicyGuardrails(guardrailsMap);
      } catch (error) {
        console.error("Failed to fetch policy guardrails:", error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicyGuardrails();
  }, [accessToken, currentKeyData?.metadata?.policies]);

  // Reset recent regeneration indicator after 5 seconds
  useEffect(() => {
    if (isRecentlyRegenerated) {
      const timer = setTimeout(() => {
        setIsRecentlyRegenerated(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRecentlyRegenerated]);

  // Use currentKeyData instead of keyData throughout the component
  if (!currentKeyData) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={onClose} className="mb-4">
          <ArrowLeft className="size-4" />
          {backButtonText}
        </Button>
        <p className="text-sm">{uiT("ui.141020c2ac2a")}</p>
      </div>
    );
  }

  const handleKeyUpdate = async (formValues: Record<string, any>, dirtyFields: readonly string[] = []) => {
    try {
      if (!accessToken) return;

      const currentKey = formValues.token;
      formValues.key = currentKey;

      // Guard premium features
      if (!canEditGuardrails) {
        delete formValues.guardrails;
        delete formValues.prompts;
      }

      // Drop premium metadata fields that are empty AND were empty before.
      // The /key/update response echoes defaults like `policies: []` back into
      // state; without this, the next save resends `[]` and trips the premium
      // gate in prepare_metadata_fields for non-premium users.
      for (const field of PREMIUM_METADATA_FIELDS) {
        const previousValue =
          (currentKeyData.metadata as Record<string, unknown> | undefined)?.[field] ??
          (currentKeyData as unknown as Record<string, unknown>)[field];
        if (isEmptyValue(formValues[field]) && isEmptyValue(previousValue)) {
          delete formValues[field];
        }
      }

      // disable_global_guardrails is premium-gated server-side; only send it when it
      // changed so a non-premium edit of unrelated fields isn't blocked by that gate.
      const previousDisableGlobalGuardrails = Boolean(
        (currentKeyData.metadata as Record<string, unknown> | undefined)?.disable_global_guardrails,
      );
      if (Boolean(formValues.disable_global_guardrails) === previousDisableGlobalGuardrails) {
        delete formValues.disable_global_guardrails;
      }

      // Handle max budget empty string
      formValues.max_budget = mapEmptyStringToNull(formValues.max_budget);

      // soft_budget is a budget change server-side (admin-gated); only send it when it changed
      // so a non-admin edit of unrelated fields isn't blocked by that gate.
      const previousSoftBudget =
        (currentKeyData.litellm_budget_table as { soft_budget?: number | null } | null | undefined)?.soft_budget ??
        null;
      const nextSoftBudget =
        formValues.soft_budget === "" || formValues.soft_budget == null ? null : Number(formValues.soft_budget);
      if (nextSoftBudget !== null && !Number.isFinite(nextSoftBudget)) {
        toast.error(translateUi("ui.6b961a9f7c0bcb5f"));
        return;
      }
      if (nextSoftBudget === previousSoftBudget) {
        delete formValues.soft_budget;
      } else {
        formValues.soft_budget = nextSoftBudget;
      }

      // Handle object_permission updates
      if (formValues.vector_stores !== undefined) {
        formValues.object_permission = {
          ...currentKeyData.object_permission,
          vector_stores: formValues.vector_stores || [],
        };
        // Remove vector_stores from the top level as it should be in object_permission
        delete formValues.vector_stores;
      }

      const mcpEntitlement = extractMcpEntitlement(formValues, allMcpServers ?? [], allMcpToolsets ?? []);
      if (mcpEntitlement) {
        // Without a catalog the grants an allowlist key still has are unresolvable, so nothing is
        // pruned and a revocation would save as a no-op while reporting success. Refuse instead.
        const unresolvableSelection =
          allMcpServers === undefined ||
          mcpEntitlement.mcp_toolsets.some(
            (toolsetId) => !(allMcpToolsets ?? []).some((toolset) => toolset.toolset_id === toolsetId),
          );
        if (unresolvableSelection && Object.keys(mcpEntitlement.mcp_tool_permissions).length > 0) {
          toast.error(translateUi("ui.255b789dcf9ceaa3"));
          return;
        }
        formValues.object_permission = {
          ...(formValues.object_permission ?? currentKeyData.object_permission),
          ...mcpEntitlement,
        };
      }
      delete formValues.mcp_servers_and_groups;
      delete formValues.mcp_tool_permissions;

      // Handle agent permissions
      if (formValues.agents_and_groups !== undefined) {
        const { agents, accessGroups } = formValues.agents_and_groups || { agents: [], accessGroups: [] };
        formValues.object_permission = {
          ...formValues.object_permission,
          agents: agents || [],
          agent_access_groups: accessGroups || [],
        };
        delete formValues.agents_and_groups;
      }

      if (formValues.skills !== undefined) {
        formValues.object_permission = {
          ...formValues.object_permission,
          skills: formValues.skills || [],
        };
        delete formValues.skills;
      }

      formValues.max_budget = mapEmptyStringToNull(formValues.max_budget);
      formValues.tpm_limit = mapEmptyStringToNull(formValues.tpm_limit);
      formValues.rpm_limit = mapEmptyStringToNull(formValues.rpm_limit);
      formValues.tpd_limit = mapEmptyStringToNull(formValues.tpd_limit);
      formValues.max_parallel_requests = mapEmptyStringToNull(formValues.max_parallel_requests);

      // Convert metadata back to an object if it exists and is a string
      if (formValues.metadata && typeof formValues.metadata === "string") {
        try {
          const parsedMetadata = JSON.parse(formValues.metadata);
          // Ensure tags are controlled via dedicated field, not in metadata textarea
          if ("tags" in parsedMetadata) {
            delete parsedMetadata["tags"];
          }
          formValues.metadata = {
            ...parsedMetadata,
            ...(Array.isArray(formValues.tags) && formValues.tags.length > 0 ? { tags: formValues.tags } : {}),
            ...(formValues.guardrails?.length > 0 ? { guardrails: formValues.guardrails } : {}),
            ...(Array.isArray(formValues.logging_settings) && formValues.logging_settings.length > 0
              ? { logging: formValues.logging_settings }
              : {}),
            ...(formValues.disabled_callbacks?.length > 0
              ? {
                  litellm_disabled_callbacks: mapDisplayToInternalNames(formValues.disabled_callbacks),
                }
              : {}),
          };
        } catch (error) {
          console.error("Error parsing metadata JSON:", error);
          toast.error(translateUi("ui.0a80165df88edc8c"));
          return;
        }
      } else {
        const baseMetadata = formValues.metadata || {};
        const { tags: _omitTags, ...rest } = baseMetadata;
        formValues.metadata = {
          ...rest,
          ...(Array.isArray(formValues.tags) && formValues.tags.length > 0 ? { tags: formValues.tags } : {}),
          ...(formValues.guardrails?.length > 0 ? { guardrails: formValues.guardrails } : {}),
          ...(Array.isArray(formValues.logging_settings) && formValues.logging_settings.length > 0
            ? { logging: formValues.logging_settings }
            : {}),
          ...(formValues.disabled_callbacks?.length > 0
            ? {
                litellm_disabled_callbacks: mapDisplayToInternalNames(formValues.disabled_callbacks),
              }
            : {}),
        };
      }

      // tags are merged into metadata; do not send as top-level field
      if ("tags" in formValues) {
        delete formValues.tags;
      }
      delete formValues.logging_settings;

      // Normalize any legacy word-form budget_duration to the canonical API format
      if (formValues.budget_duration) {
        const wordToCanonical: Record<string, string> = {
          hourly: "1h",
          daily: "24h",
          weekly: "7d",
          monthly: "30d",
        };
        formValues.budget_duration = wordToCanonical[formValues.budget_duration] ?? formValues.budget_duration;
      }

      const memberKeyEditContext = {
        userRole: userRole || "",
        userId: userID || "",
        keyUserId: currentKeyData.user_id,
        keyTeamId: currentKeyData.team_id,
        teamMembers: teamsData?.find((team) => team.team_id === currentKeyData.team_id)?.members_with_roles,
      };
      const editingMemberKeyAsTeamAdmin = isTeamAdminEditingMemberKey(memberKeyEditContext);
      if (editingMemberKeyAsTeamAdmin) {
        const trimmed = teamAdminMemberKeyPayload(formValues, dirtyFields);
        if (trimmed.kind === "blocked") {
          toast.error(translateUi("ui.bca591447318e975", undefined, { v0: String(trimmed.fields.join(", ")) }));
          return;
        }
        formValues = trimmed.payload;
      }

      const newKeyValues = await keyUpdateCall(accessToken, formValues);

      setCurrentKeyData((prevData) => (prevData ? { ...prevData, ...newKeyValues } : undefined));
      void queryClient.invalidateQueries({ queryKey: keyKeys.all });

      if (onKeyDataUpdate) {
        onKeyDataUpdate(newKeyValues);
      }
      toast.success(translateUi("ui.21a32c3dba418146"));
      setIsEditing(false);
      // Refresh key data here if needed
    } catch (error) {
      toast.fromError(parseErrorMessage(error));
      console.error("Error updating key:", error);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      if (!accessToken) return;
      await keyDeleteCall(accessToken as string, currentKeyData.token || currentKeyData.token_id);
      toast.success(translateUi("ui.bc1e0a726616401a"));
      await queryClient.invalidateQueries({ queryKey: keyKeys.lists() });
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error) {
      console.error("Error deleting the key:", error);
      toast.fromError(error);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleRegenerateKeyUpdate = (updatedKeyData: Partial<KeyResponse>) => {
    const regeneratedAt = new Date();
    // Update local state immediately with ALL the new data
    setCurrentKeyData((prevData) => {
      if (!prevData) return undefined;
      const newData = {
        ...prevData,
        ...updatedKeyData, // This should include the new token (key-id)
        // Update the created_at to show when it was regenerated
        created_at: regeneratedAt.toLocaleString(),
      };
      return newData;
    });

    // Track regeneration timestamp
    setLastRegeneratedAt(regeneratedAt);
    setIsRecentlyRegenerated(true);

    setKeyDataUpdateHeldUntilModalClose({
      ...updatedKeyData,
      created_at: regeneratedAt.toLocaleString(),
    });
  };

  const handleRegenerateModalClose = () => {
    setIsRegenerateModalOpen(false);
    if (keyDataUpdateHeldUntilModalClose) {
      setKeyDataUpdateHeldUntilModalClose(null);
      onKeyDataUpdate?.(keyDataUpdateHeldUntilModalClose);
    }
  };

  // Update the formatTimestamp function to use the desired date format
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString(getFormattingLocale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString(getFormattingLocale(), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  const canModifyKey =
    isProxyAdminRole(userRole || "") ||
    (teamsData &&
      isUserTeamAdminForSingleTeam(
        teamsData?.filter((team) => team.team_id === currentKeyData.team_id)[0]?.members_with_roles,
        userID || "",
      )) ||
    (userID === currentKeyData.user_id && userRole !== "Internal Viewer");

  const isKeyAdmin =
    isProxyAdminRole(userRole || "") ||
    Boolean(
      teamsData &&
        isUserTeamAdminForSingleTeam(
          teamsData?.filter((team) => team.team_id === currentKeyData.team_id)[0]?.members_with_roles,
          userID || "",
        ),
    );

  const canResetSpend = isKeyAdmin;
  const canBlockKey = isKeyAdmin;

  const handleResetSpend = () => {
    resetKeySpend(currentKeyData.token || currentKeyData.token_id, {
      onSuccess: () => {
        setCurrentKeyData((prevData) => (prevData ? { ...prevData, spend: 0 } : undefined));
        if (onKeyDataUpdate) {
          onKeyDataUpdate({ spend: 0 });
        }
        toast.success(translateUi("ui.e8d44173af754d7b"));
        setIsResetSpendModalOpen(false);
      },
      onError: (error) => {
        toast.fromError(parseErrorMessage(error));
        console.error("Error resetting key spend:", error);
      },
    });
  };

  const isBlocked = currentKeyData.blocked === true;

  const handleToggleBlocked = () => {
    setKeyBlockedState(
      { keyToken: currentKeyData.token || currentKeyData.token_id, blocked: !isBlocked },
      {
        onSuccess: (response) => {
          const blocked = response.blocked === true;
          setCurrentKeyData((prevData) => (prevData ? { ...prevData, blocked } : undefined));
          if (onKeyDataUpdate) {
            onKeyDataUpdate({ blocked });
          }
          toast.success(blocked ? translateUi("ui.f8b6a82cc848e255") : translateUi("ui.494bbc6bc030d32d"));
          setIsBlockModalOpen(false);
        },
        onError: (error) => {
          toast.fromError(parseErrorMessage(error));
          console.error("Error updating key blocked state:", error);
        },
      },
    );
  };

  const lastConfiguredAt = currentKeyData.settings_updated_at || currentKeyData.created_at;

  const parentTeam = currentKeyData.team_id ? teamsData?.find((team) => team.team_id === currentKeyData.team_id) : null;
  const orgId = currentKeyData.organization_id || currentKeyData.org_id || parentTeam?.organization_id || "";
  const parentOrg = orgId ? organizations?.find((org) => org.organization_id === orgId) : null;

  const hasOwnBudget = currentKeyData.max_budget !== null;
  const budgetDisplay = hasOwnBudget ? formatMoney(currentKeyData.max_budget, 2) : "Unlimited";
  const ownerUser = keyOwnerBudgetSource(currentKeyData, applyUserBudgetToTeamKeys);
  const inheritedGates = hasOwnBudget ? [] : inheritedBudgetGates(parentTeam, parentOrg, ownerUser);

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <KeyInfoHeader
        data={{
          keyName: currentKeyData.key_alias || "Virtual Key",
          keyId: currentKeyData.token_id || currentKeyData.token,
          userId: currentKeyData.user_id || "",
          userEmail: currentKeyData.user_email || "",
          userAlias: currentKeyData.user?.user_alias ?? null,
          teamId: currentKeyData.team_id || "",
          teamAlias: parentTeam?.team_alias ?? null,
          orgId,
          orgAlias: parentOrg?.organization_alias ?? null,
          createdBy:
            currentKeyData.created_by_user?.user_alias ||
            currentKeyData.created_by_user?.user_email ||
            currentKeyData.created_by ||
            "",
          createdById: currentKeyData.created_by_user?.user_id || currentKeyData.created_by || "",
          createdAt: currentKeyData.created_at ? formatTimestamp(currentKeyData.created_at) : "",
          lastUpdated: lastConfiguredAt ? formatTimestamp(lastConfiguredAt) : "",
          lastActive: currentKeyData.last_active ? formatTimestamp(currentKeyData.last_active) : "Never",
          expires: currentKeyData.expires ? formatTimestamp(currentKeyData.expires) : "Never",
        }}
        onBack={onClose}
        onRegenerate={() => setIsRegenerateModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
        onResetSpend={canResetSpend ? () => setIsResetSpendModalOpen(true) : undefined}
        onToggleBlocked={canBlockKey ? () => setIsBlockModalOpen(true) : undefined}
        isBlocked={isBlocked}
        canModifyKey={canModifyKey}
        backButtonText={backButtonText}
        regenerateDisabled={!premiumUser}
        regenerateTooltip={!premiumUser ? uiT("ui.44176be32a16") : undefined}
      />

      {/* Add RegenerateKeyModal */}
      <RegenerateKeyModal
        selectedToken={currentKeyData}
        visible={isRegenerateModalOpen}
        onClose={handleRegenerateModalClose}
        onKeyUpdate={handleRegenerateKeyUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={uiT("ui.00727245851b")}
        alertMessage="This action is irreversible and will immediately revoke access for any applications using this key."
        message={uiT("ui.0184cc60593b24ab")}
        resourceInformationTitle="Key Information"
        resourceInformation={[
          {
            label: uiT("ui.1e7044ffa52d"),
            value: currentKeyData?.key_alias || "-",
          },
          {
            label: uiT("ui.d54d56ee0a42"),
            value: currentKeyData?.token_id || currentKeyData?.token || "-",
            code: true,
          },
          {
            label: uiT("ui.fa2758a6173a"),
            value: currentKeyData?.team_id || "-",
            code: true,
          },
          {
            label: uiT("ui.85f3d558db12"),
            value: currentKeyData?.spend ? formatMoney(currentKeyData.spend, 4) : "¥0.0000",
          },
        ]}
        onCancel={() => {
          setIsDeleteModalOpen(false);
        }}
        onOk={handleDelete}
        confirmLoading={deleteLoading}
        requiredConfirmation={currentKeyData?.key_alias}
      />

      {/* Reset Spend Confirmation Modal */}
      <Dialog open={isResetSpendModalOpen} onOpenChange={(open) => setIsResetSpendModalOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiT("ui.ca0bb163f216")}</DialogTitle>
          </DialogHeader>
          <p>
            {uiT("ui.a2ccee16b0910a36")}{" "}
            <strong>{currentKeyData?.key_alias || currentKeyData?.token_id || uiT("ui.c9e64db2715f38a5")}</strong>{" "}
            {uiT("ui.663ea1bfffe5")} <strong>¥0</strong>?
          </p>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: 8 }}>
            {uiT("ui.a56b5bae4770c46f")} <strong>{formatMoney(currentKeyData.spend, 4)}</strong>
            {uiT("ui.2e7f247f6bb38c93")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetSpendModalOpen(false)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button variant="destructive" onClick={handleResetSpend} disabled={resetSpendLoading}>
              {uiT("ui.daee7606b339")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlockModalOpen} onOpenChange={(open) => setIsBlockModalOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBlocked ? uiT("ui.f0f53722c7d5") : uiT("ui.9c51af12d953")}</DialogTitle>
          </DialogHeader>
          <p>
            {isBlocked ? uiT("ui.712da63171e0") : uiT("ui.211d0bb8cf4f")}{" "}
            <strong>{currentKeyData?.key_alias || currentKeyData?.token_id || uiT("ui.c9e64db2715f38a5")}</strong>?
          </p>
          <p style={{ color: "#666", fontSize: "0.875rem", marginTop: 8 }}>
            {isBlocked ? uiT("ui.cfc1483a04c5") : uiT("ui.9fb8a464d349")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              onClick={handleToggleBlocked}
              disabled={blockLoading}
            >
              {isBlocked ? uiT("ui.712da63171e0") : uiT("ui.211d0bb8cf4f")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.d4b1ea5708dd")}
          </TabsTrigger>
          <TabsTrigger value="savings" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.ed46218066a7")}
          </TabsTrigger>
          {hasProxyWideSpendView(userRole) && (
            <TabsTrigger value="auto-router-usage" className="flex-none rounded-none px-4 py-2">
              {uiT("ui.88d5aa106c3e")}
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.74a883a037bc")}
          </TabsTrigger>
        </TabsList>

        <div>
          {/* Overview Panel */}
          <TabsContent value="overview" keepMounted>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.85f3d558db12")}</p>
                <div className="mt-2">
                  <h3 className="text-lg font-medium">{formatMoney(currentKeyData.spend, 4)}</h3>
                  <p className="text-sm">
                    {uiT("ui.28391d3bc64ec15c")} {translateText(budgetDisplay)}
                    <InheritedBudgetHint gates={inheritedGates} />
                  </p>
                  {currentKeyData.budget_reset_at && (
                    <p className="text-sm">
                      {uiT("ui.7816b9affc62a9e9")} {translateText(formatTimestamp(currentKeyData.budget_reset_at))}
                    </p>
                  )}
                  <p className="text-sm mt-2" data-testid="key-lifetime-spend">
                    {uiT("ui.dee36f20ae21")}
                    {formatMoney(currentKeyData.total_spend ?? 0, 4)}
                    {needsLifetimeSpendBackfill(currentKeyData.spend, currentKeyData.total_spend) && (
                      <HoverCard>
                        <HoverCardTrigger
                          render={
                            <button
                              type="button"
                              aria-label={uiT("ui.a44d21ca46c6")}
                              className="inline-flex align-middle ml-1 cursor-help"
                              data-testid="key-lifetime-spend-backfill-hint"
                            />
                          }
                        >
                          <Info className="size-3 text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">{uiT("ui.19a489d8015f")}</HoverCardContent>
                      </HoverCard>
                    )}
                  </p>
                </div>
              </Card>

              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.ed129d234fd4")}</p>
                <div className="mt-2">
                  <p className="text-sm">
                    {uiT("ui.22506bb2e2fc9c02")}{" "}
                    {currentKeyData.tpm_limit !== null ? currentKeyData.tpm_limit : uiT("ui.11dde17d6c3e")}
                  </p>
                  <p className="text-sm">
                    {uiT("ui.0a9c9fab18f38f0e")}{" "}
                    {currentKeyData.rpm_limit !== null ? currentKeyData.rpm_limit : uiT("ui.11dde17d6c3e")}
                  </p>
                  <p className="text-sm">
                    {uiT("ui.1dbc7e398eaa09e7")} {currentKeyData.tpd_limit ?? uiT("ui.11dde17d6c3e")}
                  </p>
                  {Boolean(currentKeyData.metadata?.throttle_on_budget_exceeded) && (
                    <p className="text-sm">{uiT("ui.5f49516bd8cafb3a")}</p>
                  )}
                </div>
              </Card>

              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.d17d2d78d76e")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentKeyData.models && currentKeyData.models.length > 0 ? (
                    currentKeyData.models.map((model, index) => (
                      <BadgeLink
                        key={index}
                        href={modelOrAccessGroupHref(model, accessGroupNames)}
                        className="min-w-0 break-words"
                      >
                        {model}
                      </BadgeLink>
                    ))
                  ) : (
                    <p className="text-sm">{uiT("ui.80b25d2084c3")}</p>
                  )}
                </div>
              </Card>

              <Card className="block p-6">
                <ObjectPermissionsView
                  objectPermission={currentKeyData.object_permission}
                  variant="inline"
                  accessToken={accessToken}
                />
              </Card>

              <Card className="block p-6">
                <p className="text-sm font-medium mb-3">{uiT("ui.443f975eefe8")}</p>
                {Array.isArray(currentKeyData.metadata?.guardrails) && currentKeyData.metadata.guardrails.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentKeyData.metadata.guardrails.map((guardrail: string, index: number) => (
                      <Badge key={index} variant="secondary" className="min-w-0 break-words">
                        {guardrail}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{uiT("ui.06b64f696c9c")}</p>
                )}
                {typeof currentKeyData.metadata?.disable_global_guardrails === "boolean" &&
                  currentKeyData.metadata.disable_global_guardrails === true && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Badge variant="destructive">{uiT("ui.4948a5ba4187")}</Badge>
                    </div>
                  )}
              </Card>

              <Card className="block p-6">
                <p className="text-sm font-medium mb-3">{uiT("ui.d3ad1f1f8c9c")}</p>
                {Array.isArray(currentKeyData.metadata?.policies) && currentKeyData.metadata.policies.length > 0 ? (
                  <div className="space-y-4">
                    {currentKeyData.metadata.policies.map((policy: string, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="min-w-0 break-words">
                            {policy}
                          </Badge>
                          {loadingPolicies && <p className="text-xs text-muted-foreground">{uiT("ui.d9dd86513316")}</p>}
                        </div>
                        {!loadingPolicies && policyGuardrails[policy] && policyGuardrails[policy].length > 0 && (
                          <div className="ml-4 pl-3 border-l-2 border-border">
                            <p className="text-xs text-muted-foreground mb-1">{uiT("ui.d9fe6ef6ac99a43e")}</p>
                            <div className="flex flex-wrap gap-1">
                              {policyGuardrails[policy].map((guardrail: string, gIndex: number) => (
                                <Badge key={gIndex} variant="secondary" className="min-w-0 break-words">
                                  {guardrail}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{uiT("ui.3ff1bc9f5720")}</p>
                )}
              </Card>

              <LoggingSettingsView
                loggingConfigs={extractLoggingSettings(currentKeyData.metadata)}
                disabledCallbacks={
                  Array.isArray(currentKeyData.metadata?.litellm_disabled_callbacks)
                    ? mapInternalToDisplayNames(currentKeyData.metadata.litellm_disabled_callbacks)
                    : []
                }
                variant="card"
              />

              <AutoRotationView
                autoRotate={currentKeyData.auto_rotate}
                rotationInterval={currentKeyData.rotation_interval}
                lastRotationAt={currentKeyData.last_rotation_at}
                keyRotationAt={currentKeyData.key_rotation_at}
                nextRotationAt={currentKeyData.next_rotation_at}
                variant="card"
              />
            </div>
          </TabsContent>

          {/* Savings Panel. No keepMounted: this tab sweeps the daily rollup, and staying mounted
              would fire that request on every key page open for people who never look at it. */}
          <TabsContent value="savings">
            <KeySavingsTab
              accessToken={accessToken}
              keyToken={currentKeyData.token}
              userId={userID}
              userRole={userRole}
              activity={activityDateRange}
            />
          </TabsContent>

          {hasProxyWideSpendView(userRole) && (
            <TabsContent value="auto-router-usage">
              <KeyAutoRouterUsageTab
                accessToken={accessToken}
                keyToken={currentKeyData.token}
                activity={activityDateRange}
              />
            </TabsContent>
          )}

          {/* Settings Panel */}
          <TabsContent value="settings" keepMounted>
            <Card className="block p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{uiT("ui.6f7b7d782dd0")}</h3>
                {!isEditing && canModifyKey && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    {uiT("ui.cddc5824575b")}
                  </Button>
                )}
              </div>

              {isEditing ? (
                <KeyEditView
                  keyData={currentKeyData}
                  onCancel={() => setIsEditing(false)}
                  onSubmit={handleKeyUpdate}
                  teams={teams}
                  accessToken={accessToken}
                  userID={userID}
                  userRole={userRole}
                  premiumUser={premiumUser}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">{uiT("ui.d54d56ee0a42")}</p>
                    <p className="text-sm font-mono">{currentKeyData.token_id || currentKeyData.token}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.1e7044ffa52d")}</p>
                    <p className="text-sm">{currentKeyData.key_alias || uiT("ui.8290035d4cf4")}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.eeefa4cae35a")}</p>
                    <p className="text-sm font-mono">{currentKeyData.key_name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.fa2758a6173a")}</p>
                    <p className="text-sm">
                      {currentKeyData.team_id ? (
                        <EntityLink href={teamDetailHref(currentKeyData.team_id)} className="font-normal">
                          {currentKeyData.team_id}
                        </EntityLink>
                      ) : (
                        uiT("ui.8290035d4cf4")
                      )}
                    </p>
                  </div>

                  {enableProjectsUI && (
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.985959785319")}</p>
                      <p className="text-sm">
                        {currentKeyData.project_id
                          ? (() => {
                              const project = projects?.find((p) => p.project_id === currentKeyData.project_id);
                              return project?.project_alias
                                ? `${project.project_alias} (${currentKeyData.project_id})`
                                : currentKeyData.project_id;
                            })()
                          : uiT("ui.8290035d4cf4")}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.d764d42592fc")}</p>
                    <p className="text-sm">
                      {(currentKeyData.organization_id ?? currentKeyData.org_id) || uiT("ui.8290035d4cf4")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.d70b9e24bca2")}</p>
                    <p className="text-sm">{translateText(formatTimestamp(currentKeyData.created_at))}</p>
                  </div>

                  {lastRegeneratedAt && (
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.f7775915d1ba")}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{translateText(formatTimestamp(lastRegeneratedAt))}</p>
                        <Badge variant="secondary">{uiT("ui.690dbe9dc099")}</Badge>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.f6725f3af08a")}</p>
                    <p className="text-sm">
                      {currentKeyData.expires ? formatTimestamp(currentKeyData.expires) : uiT("ui.6300ef800bb8")}
                    </p>
                  </div>

                  {Boolean(currentKeyData.metadata?.enable_prompt_caching) && (
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.1823d9572582")}</p>
                      <p className="text-sm">{uiT("ui.4a5172c246ca")}</p>
                    </div>
                  )}

                  <AutoRotationView
                    autoRotate={currentKeyData.auto_rotate}
                    rotationInterval={currentKeyData.rotation_interval}
                    lastRotationAt={currentKeyData.last_rotation_at}
                    keyRotationAt={currentKeyData.key_rotation_at}
                    nextRotationAt={currentKeyData.next_rotation_at}
                    variant="inline"
                    className="pt-4 border-t border-border"
                  />

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.85f3d558db12")}</p>
                    <p className="text-sm">
                      {formatMoney(currentKeyData.spend, 4)} {uiT("ui.a26cdf3a6e709124")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.eac3d121beb3")}</p>
                    <p className="text-sm">
                      {formatMoney(currentKeyData.total_spend ?? 0, 4)} {uiT("ui.a26cdf3a6e709124")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.1c6225ec7092")}</p>
                    <p className="text-sm">
                      {currentKeyData.max_budget !== null
                        ? formatMoney(currentKeyData.max_budget, 2)
                        : uiT("ui.11dde17d6c3e")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.26479c1937fc")}</p>
                    <p data-testid="budget-reset-value" className="text-sm">
                      {currentKeyData.budget_reset_at
                        ? `${currentKeyData.budget_duration ? `Every ${currentKeyData.budget_duration}, next ` : ""}${formatTimestamp(currentKeyData.budget_reset_at)}`
                        : uiT("ui.6300ef800bb8")}
                    </p>
                  </div>

                  {currentKeyData.budget_fallbacks && Object.keys(currentKeyData.budget_fallbacks).length > 0 && (
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.a0e9a1ac2373")}</p>
                      <div className="mt-1 space-y-1">
                        {Object.entries(currentKeyData.budget_fallbacks).map(([model, fallbacks]) => (
                          <div key={model} className="text-xs text-muted-foreground">
                            <span className="font-medium">{model}</span>
                            <span className="mx-1 text-muted-foreground">{uiT("ui.71b37b9a8a57b848")}</span>
                            {fallbacks.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasRouterSettings(currentKeyData.router_settings) && (
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.c4b306b8f296")}</p>
                      <div className="mt-1">
                        <RouterSettingsSummary routerSettings={currentKeyData.router_settings} />
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.1331275bc537")}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(currentKeyData.metadata?.tags) && currentKeyData.metadata.tags.length > 0
                        ? currentKeyData.metadata.tags.map((tag, index) => (
                            <span key={index} className="px-2 mr-2 py-1 bg-info/15 rounded-sm text-xs">
                              {tag}
                            </span>
                          ))
                        : uiT("ui.0379a0650f8b")}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.5f2e66e65397")}</p>
                    <p className="text-sm">
                      {Array.isArray(currentKeyData.metadata?.prompts) && currentKeyData.metadata.prompts.length > 0
                        ? currentKeyData.metadata.prompts.map((prompt, index) => (
                            <span key={index} className="px-2 mr-2 py-1 bg-info/15 rounded-sm text-xs">
                              {prompt}
                            </span>
                          ))
                        : uiT("ui.2493ceda3ed3")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.92f4d0afb3d0")}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(currentKeyData.allowed_routes) && currentKeyData.allowed_routes.length > 0 ? (
                        currentKeyData.allowed_routes.map((route, index) => (
                          <span key={index} className="px-2 py-1 bg-info/15 rounded-sm text-xs">
                            {route}
                          </span>
                        ))
                      ) : (
                        <Badge variant="secondary">{uiT("ui.890501e4b414")}</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.c46eae929e67")}</p>
                    <p className="text-sm">
                      {Array.isArray(currentKeyData.metadata?.allowed_passthrough_routes) &&
                      currentKeyData.metadata.allowed_passthrough_routes.length > 0
                        ? currentKeyData.metadata.allowed_passthrough_routes.map((route, index) => (
                            <span key={index} className="px-2 mr-2 py-1 bg-info/15 rounded-sm text-xs">
                              {route}
                            </span>
                          ))
                        : uiT("ui.799bc1acc010")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.c98d9cde3398")}</p>
                    <p className="text-sm">
                      {currentKeyData.metadata?.disable_global_guardrails === true ? (
                        <Badge variant="destructive">{uiT("ui.bc9161cb2060")}</Badge>
                      ) : (
                        <Badge variant="secondary">{uiT("ui.fc9d31d9417b")}</Badge>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.d17d2d78d76e")}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentKeyData.models && currentKeyData.models.length > 0 ? (
                        currentKeyData.models.map((model, index) => (
                          <BadgeLink
                            key={index}
                            href={modelOrAccessGroupHref(model, accessGroupNames)}
                            className="min-w-0 break-words"
                          >
                            {model}
                          </BadgeLink>
                        ))
                      ) : (
                        <p className="text-sm">{uiT("ui.80b25d2084c3")}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.ed129d234fd4")}</p>
                    <p className="text-sm">
                      {uiT("ui.22506bb2e2fc9c02")}{" "}
                      {currentKeyData.tpm_limit !== null ? currentKeyData.tpm_limit : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.0a9c9fab18f38f0e")}{" "}
                      {currentKeyData.rpm_limit !== null ? currentKeyData.rpm_limit : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.1dbc7e398eaa09e7")} {currentKeyData.tpd_limit ?? uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.ee5508890a86")}{" "}
                      {currentKeyData.max_parallel_requests !== null
                        ? currentKeyData.max_parallel_requests
                        : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.b61dd5427570a908")}{" "}
                      {currentKeyData.metadata?.model_tpm_limit
                        ? JSON.stringify(currentKeyData.metadata.model_tpm_limit)
                        : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.8c264593f8b6150b")}{" "}
                      {currentKeyData.metadata?.model_rpm_limit
                        ? JSON.stringify(currentKeyData.metadata.model_rpm_limit)
                        : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.de2dca0cb6dcc697")}{" "}
                      {currentKeyData.metadata?.tag_rpm_limit &&
                      Object.keys(currentKeyData.metadata.tag_rpm_limit).length > 0
                        ? JSON.stringify(currentKeyData.metadata.tag_rpm_limit)
                        : uiT("ui.11dde17d6c3e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.2b33e281c6644dde")}{" "}
                      {currentKeyData.metadata?.default_estimated_output_tokens != null
                        ? String(currentKeyData.metadata.default_estimated_output_tokens)
                        : uiT("ui.21b111cbfe6e")}
                    </p>
                    <p className="text-sm">
                      {uiT("ui.4416c9ba78d22c25")}{" "}
                      {currentKeyData.metadata?.default_estimated_output_tokens_per_model
                        ? JSON.stringify(currentKeyData.metadata.default_estimated_output_tokens_per_model)
                        : uiT("ui.21b111cbfe6e")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">{uiT("ui.9eddf573cb50")}</p>
                    <pre className="bg-muted p-2 rounded-sm text-xs overflow-auto mt-1">
                      {formatMetadataForDisplay(stripTagsFromMetadata(currentKeyData.metadata))}
                    </pre>
                  </div>

                  <ObjectPermissionsView
                    objectPermission={currentKeyData.object_permission}
                    variant="inline"
                    className="pt-4 border-t border-border"
                    accessToken={accessToken}
                  />

                  <LoggingSettingsView
                    loggingConfigs={extractLoggingSettings(currentKeyData.metadata)}
                    disabledCallbacks={
                      Array.isArray(currentKeyData.metadata?.litellm_disabled_callbacks)
                        ? mapInternalToDisplayNames(currentKeyData.metadata.litellm_disabled_callbacks)
                        : []
                    }
                    variant="inline"
                    className="pt-4 border-t border-border"
                  />
                </div>
              )}
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
