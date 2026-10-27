"use client";
import { userDisplayLabel } from "@/utils/userDisplay";
import { formatMoney } from "@/utils/currency";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useResetTeamMemberBudget } from "@/app/(dashboard)/hooks/teams/useResetTeamMemberBudget";
import { useResetTeamMemberSpend } from "@/app/(dashboard)/hooks/teams/useResetTeamMemberSpend";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleTooltip } from "@/components/ui/tooltip";
import MemberTable from "@/components/common_components/MemberTable";
import { Member } from "@/components/networking";
import { parseErrorMessage } from "@/components/shared/errorUtils";
import { DateCell, MoneyCell } from "@/components/shared/table_cells";
import { toast } from "@/lib/toast";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { isProxyAdminRole, isUserTeamAdminForSingleTeam } from "@/utils/roles";
import { CircleHelp } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { TeamData, TeamMemberBudgetSource, TeamMembership } from "./TeamInfo";

const BUDGET_SOURCE_LABELS: Record<Exclude<TeamMemberBudgetSource, "none">, string> = {
  get team_default() {
    return translateUi("ui.a8ff2bee9c29984e");
  },
  get custom() {
    return translateUi("ui.494ca78f7374");
  },
};

const formatBudget = (value: number | null): string => (value === null ? "Unlimited" : formatMoney(value, 2));

export const seedMemberBudgetFields = (
  record: Member,
  budget: TeamMembership["litellm_budget_table"] | undefined,
): Member => ({
  ...record,
  max_budget_in_team: budget?.max_budget ?? null,
  tpm_limit: budget?.tpm_limit ?? null,
  rpm_limit: budget?.rpm_limit ?? null,
  budget_duration: budget?.budget_duration || null,
  allowed_models: budget?.allowed_models || [],
  temp_budget_increase: budget?.temp_budget_increase ?? null,
  temp_budget_expiry: budget?.temp_budget_expiry ?? null,
});

interface TeamMemberTabProps {
  teamData: TeamData;
  canEditTeam: boolean;
  handleMemberDelete: (member: Member) => void;
  setSelectedEditMember: (member: Member) => void;
  setIsEditMemberModalVisible: (visible: boolean) => void;
  setIsAddMemberModalVisible: (visible: boolean) => void;
  onMemberSpendReset: () => void;
  onMemberBudgetReset: () => void;
}

export default function TeamMemberTab({
  teamData,
  canEditTeam,
  handleMemberDelete,
  setSelectedEditMember,
  setIsEditMemberModalVisible,
  setIsAddMemberModalVisible,
  onMemberSpendReset,
  onMemberBudgetReset,
}: TeamMemberTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const [memberToResetSpend, setMemberToResetSpend] = useState<Member | null>(null);
  const [memberToResetBudget, setMemberToResetBudget] = useState<Member | null>(null);
  const { mutate: resetMemberSpend, isPending: isResettingSpend } = useResetTeamMemberSpend();
  const { mutate: resetMemberBudget, isPending: isResettingBudget } = useResetTeamMemberBudget();
  const teamDefaultBudget = teamData.team_info.team_member_budget_table?.max_budget ?? null;

  const formatNumber = (value: number | null): string => {
    if (value === null || value === undefined) return "0";

    if (typeof value === "number") {
      // Convert scientific notation to normal decimal
      const normalNumber = Number(value);

      // If it's a whole number, return it without decimals
      if (normalNumber === Math.floor(normalNumber)) {
        return normalNumber.toString();
      }

      // For decimal numbers, use toFixed and remove trailing zeros
      return formatNumberWithCommas(normalNumber, 8).replace(/\.?0+$/, "");
    }

    return "0";
  };

  const getUserCurrentCycleSpend = (userId: string | null): number => {
    if (!userId) return 0;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.spend ?? 0;
  };

  const getUserTotalSpend = (userId: string | null): number => {
    if (!userId) return 0;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.total_spend ?? 0;
  };

  const getUserBudgetSource = (userId: string | null): TeamMemberBudgetSource => {
    if (!userId) return "none";
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.budget_source ?? "none";
  };

  const getUserBudget = (userId: string | null): number | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.litellm_budget_table?.max_budget ?? teamDefaultBudget;
  };

  // Helper function to get rate limits for a user
  const getUserRateLimits = (userId: string | null): string => {
    if (!userId) return "No Limits";
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    const rpmLimit = membership?.litellm_budget_table?.rpm_limit;
    const tpmLimit = membership?.litellm_budget_table?.tpm_limit;

    const rpmText = rpmLimit != null ? `${formatNumber(rpmLimit)} RPM` : null;
    const tpmText = tpmLimit != null ? `${formatNumber(tpmLimit)} TPM` : null;

    const limits = [rpmText, tpmText].filter(Boolean);
    return limits.length > 0 ? limits.join(" / ") : "No Limits";
  };

  const { data: uiSettingsData } = useUISettings();
  const { userId, userRole } = useAuthorized();
  const disableTeamAdminDeleteTeamUser = Boolean(uiSettingsData?.values?.disable_team_admin_delete_team_user);
  const isUserTeamAdmin = isUserTeamAdminForSingleTeam(teamData.team_info.members_with_roles, userId || "");
  const isProxyAdmin = isProxyAdminRole(userRole || "");

  const getUserAllowedModels = (userId: string | null): string[] | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    const models = membership?.litellm_budget_table?.allowed_models;
    return models && models.length > 0 ? models : null;
  };

  const getUserBudgetReset = (userId: string | null): string | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.litellm_budget_table?.budget_reset_at ?? null;
  };

  const extraColumns: NonNullable<ComponentProps<typeof MemberTable>["extraColumns"]> = [
    {
      title: (
        <span className="flex items-center gap-1">
          {uiT("ui.053213da727a1846")}
          <SimpleTooltip content={uiT("ui.40ba0e86987b2485")}>
            <CircleHelp className="size-4" aria-label={uiT("ui.a123d4e3bb5a57a8")} />
          </SimpleTooltip>
        </span>
      ),
      key: "model_scope",
      render: (record: Member) => {
        const models = getUserAllowedModels(record.user_id);
        if (!models) {
          return <span className="text-muted-foreground">{uiT("ui.6e13218a52d4e80b")}</span>;
        }
        const displayed = models.slice(0, 2);
        const remaining = models.length - displayed.length;
        return (
          <div className="flex flex-wrap gap-1">
            {displayed.map((m) => (
              <code key={m} className="rounded bg-muted px-1 py-0.5 text-xs">
                {m}
              </code>
            ))}
            {remaining > 0 && (
              <SimpleTooltip content={models.slice(2).join(", ")}>
                <span className="text-muted-foreground">
                  +{remaining} {uiT("ui.187897ce0afc")}
                </span>
              </SimpleTooltip>
            )}
          </div>
        );
      },
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {uiT("ui.f88d6068bd0bd49c")}
          <SimpleTooltip content={uiT("ui.3abd0f29f03e47ee")}>
            <CircleHelp className="size-4" aria-label={uiT("ui.de16cc75700dc234")} />
          </SimpleTooltip>
        </span>
      ),
      key: "spend",
      numeric: true,
      sortValue: (record: Member) => getUserCurrentCycleSpend(record.user_id),
      render: (record: Member) => <MoneyCell value={getUserCurrentCycleSpend(record.user_id)} decimals={2} />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {uiT("ui.c33ab4e98f55")}
          <SimpleTooltip content={uiT("ui.7f48d018ff9eb79f")}>
            <CircleHelp className="size-4" aria-label={uiT("ui.a9e4d1d566890262")} />
          </SimpleTooltip>
        </span>
      ),
      key: "total_spend",
      numeric: true,
      sortValue: (record: Member) => getUserTotalSpend(record.user_id),
      render: (record: Member) => <MoneyCell value={getUserTotalSpend(record.user_id)} decimals={2} />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {uiT("ui.257da8bedcb0b6f1")}
          <SimpleTooltip content={uiT("ui.90fe82dfa540d1c3")}>
            <CircleHelp className="size-4" aria-label={uiT("ui.3cc84373a18eed36")} />
          </SimpleTooltip>
        </span>
      ),
      key: "budget",
      numeric: true,
      sortValue: (record: Member) => getUserBudget(record.user_id),
      render: (record: Member) => {
        const source = getUserBudgetSource(record.user_id);
        return (
          <span className="flex items-center justify-end gap-2">
            <MoneyCell value={getUserBudget(record.user_id)} decimals={2} emptyText={uiT("ui.11dde17d6c3e")} showZero />
            {source !== "none" && (
              <Badge variant={source === "custom" ? "outline" : "secondary"} data-testid="member-budget-source">
                {BUDGET_SOURCE_LABELS[source]}
              </Badge>
            )}
            {source === "custom" && canEditTeam && (
              <Button
                variant="link"
                size="xs"
                className="h-auto p-0"
                data-testid="reset-member-budget"
                onClick={() => setMemberToResetBudget(record)}
              >
                {uiT("ui.8532f22efcdb73c9")}
              </Button>
            )}
          </span>
        );
      },
    },
    {
      title: uiT("ui.26479c1937fc"),
      key: "budget_reset",
      sortValue: (record: Member) => getUserBudgetReset(record.user_id),
      render: (record: Member) => <DateCell value={getUserBudgetReset(record.user_id)} precision="date" />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {uiT("ui.94e09b1c09b751f6")}
          <SimpleTooltip content={uiT("ui.32e30791e2306f59")}>
            <CircleHelp className="size-4" aria-label={uiT("ui.90e69dd96e21ab8f")} />
          </SimpleTooltip>
        </span>
      ),
      key: "rate_limits",
      render: (record: Member) => <span>{translateText(getUserRateLimits(record.user_id))}</span>,
    },
  ];

  const handleResetSpend = () => {
    if (!memberToResetSpend?.user_id) return;
    resetMemberSpend(
      { teamId: teamData.team_id, userId: memberToResetSpend.user_id },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.3ef23a183225b79b"));
          setMemberToResetSpend(null);
          onMemberSpendReset();
        },
        onError: (error) => toast.fromError(parseErrorMessage(error)),
      },
    );
  };

  const handleResetBudget = () => {
    if (!memberToResetBudget?.user_id) return;
    resetMemberBudget(
      { teamId: teamData.team_id, userId: memberToResetBudget.user_id },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.7cda5fab4178f869"));
          setMemberToResetBudget(null);
          onMemberBudgetReset();
        },
        onError: (error) => toast.fromError(parseErrorMessage(error)),
      },
    );
  };

  const resetSpendDisabledReason = (member: Member): string | null => {
    if (!isProxyAdmin && member.user_id === userId) return "Ask a proxy admin to reset your own spend";
    if (getUserCurrentCycleSpend(member.user_id) <= 0) return "No current cycle spend to reset";
    return null;
  };

  return (
    <>
      <MemberTable
        key={teamData.team_id}
        members={teamData.team_info.members_with_roles}
        canEdit={canEditTeam}
        onEdit={(record) => {
          const membership = teamData.team_memberships.find((tm) => tm.user_id === record.user_id);
          setSelectedEditMember(seedMemberBudgetFields(record, membership?.litellm_budget_table));
          setIsEditMemberModalVisible(true);
        }}
        onDelete={handleMemberDelete}
        onAddMember={() => setIsAddMemberModalVisible(true)}
        roleColumnTitle="Team Role"
        roleTooltip="This role applies only to this team and is independent from the user's proxy-level role."
        extraColumns={extraColumns}
        showDeleteForMember={() =>
          isProxyAdmin || (canEditTeam && !isUserTeamAdmin) || (isUserTeamAdmin && !disableTeamAdminDeleteTeamUser)
        }
        onResetSpend={setMemberToResetSpend}
        resetSpendDisabledReason={resetSpendDisabledReason}
      />
      <Dialog open={memberToResetSpend !== null} onOpenChange={(open) => !open && setMemberToResetSpend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiT("ui.2bf0f1976cb32162")}</DialogTitle>
          </DialogHeader>
          <p>
            {uiT("ui.9fc9ceeeff2ab00f")}{" "}
            <strong>{memberToResetSpend ? userDisplayLabel(memberToResetSpend) : ""}</strong>{" "}
            {uiT("ui.760d12382f4b41ab")} <strong>¥0</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            {uiT("ui.1e3ffcea4c611430")}{" "}
            <strong>{formatMoney(getUserCurrentCycleSpend(memberToResetSpend?.user_id ?? null), 4)}</strong>
            {uiT("ui.71676fb9330ef42a")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToResetSpend(null)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button variant="destructive" onClick={handleResetSpend} disabled={isResettingSpend}>
              {uiT("ui.daee7606b339")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={memberToResetBudget !== null} onOpenChange={(open) => !open && setMemberToResetBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{uiT("ui.8c98fdb41f08539e")}</DialogTitle>
          </DialogHeader>
          <p>
            {uiT("ui.d8d9a18a18585e5e")}{" "}
            <strong>{memberToResetBudget ? userDisplayLabel(memberToResetBudget) : ""}</strong>{" "}
            {uiT("ui.ad1019646e8d8d4a")} <strong>{translateText(formatBudget(teamDefaultBudget))}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            {uiT("ui.1e08b8b31269873f")}{" "}
            <strong>{translateText(formatBudget(getUserBudget(memberToResetBudget?.user_id ?? null)))}</strong>
            {uiT("ui.a1a8e69db9bdf81b")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToResetBudget(null)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button onClick={handleResetBudget} disabled={isResettingBudget}>
              {uiT("ui.8532f22efcdb73c9")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
