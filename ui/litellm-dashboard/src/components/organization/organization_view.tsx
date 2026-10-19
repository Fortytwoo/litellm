"use client";
import { getFormattingLocale } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { organizationKeys, useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import { useUrlTab } from "@/hooks/useUrlTab";
import { useVisitedTabs } from "@/hooks/useVisitedTabs";
import { MoneyCell } from "@/components/shared/table_cells";
import CopyButton from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { teamDetailHref } from "@/utils/entityLinks";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { BadgeLink } from "@/components/shared/BadgeLink";
import { ArrowLeft } from "lucide-react";
import React, { useMemo, useState } from "react";
import MemberTable, { type MemberTableColumn } from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import { toast } from "@/lib/toast";
import {
  Member,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import MemberModal from "../team/EditMembership";
import { OrgSettingsForm } from "./org-settings/OrgSettingsForm";
import { ORGANIZATION_TAB_URL_KEY, ORGANIZATION_TABS, type OrganizationTab } from "./organizationTabs";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const { data: orgData, isLoading: loading } = useOrganization(organizationId);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();
  const [tab, setTab] = useUrlTab(ORGANIZATION_TABS, "overview", ORGANIZATION_TAB_URL_KEY);
  const { onTabChange, hasVisited } = useVisitedTabs(tab);

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const handleTabChange = (value: OrganizationTab) => {
    setTab(value);
    onTabChange(value);
  };

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      await organizationMemberAddCall(accessToken, organizationId, member);

      toast.success(translateUi("ui.ed21bd66a150e09b"));
      setIsAddMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError("Failed to add organization member");
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      await organizationMemberUpdateCall(accessToken, organizationId, member);
      toast.success(translateUi("ui.20b6042a44a29b68"));
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError("Failed to update organization member");
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      toast.success(translateUi("ui.72ce7c50245b5642"));
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError("Failed to delete organization member");
      console.error("Error deleting organization member:", error);
    }
  };

  if (loading) {
    return <div className="p-4">{uiT("ui.47d2a515ef2f")}</div>;
  }

  if (!orgData) {
    return <div className="p-4">{uiT("ui.00c50f7a04046267")}</div>;
  }

  const orgMemberById = new Map((orgData.members || []).map((m) => [m.user_id, m]));
  const orgMemberFor = (record: Member) => (record.user_id != null ? orgMemberById.get(record.user_id) : undefined);

  const orgExtraColumns: MemberTableColumn[] = [
    {
      title: uiT("ui.d1b5ad72df63"),
      key: "spend",
      numeric: true,
      sortValue: (record: Member) => orgMemberFor(record)?.spend ?? null,
      render: (record: Member) => <MoneyCell value={orgMemberFor(record)?.spend} decimals={4} />,
    },
    {
      title: uiT("ui.3d44337010bf"),
      key: "created_at",
      sortValue: (record: Member) => orgMemberFor(record)?.created_at ?? null,
      render: (record: Member) => {
        const createdAt = orgMemberFor(record)?.created_at;
        return <span>{createdAt ? new Date(createdAt).toLocaleString() : "-"}</span>;
      },
    },
  ];

  return (
    <div className="h-screen w-full bg-background p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onClose} className="mb-4">
            <ArrowLeft className="size-4" />
            {uiT("ui.739abb2c74bf5b43")}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{orgData.organization_alias}</h1>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-muted-foreground">{orgData.organization_id}</span>
            <CopyButton value={orgData.organization_id} label={uiT("ui.517701ed806dc061")} iconClassName="size-3" />
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="mb-4">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.d4b1ea5708dd")}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.1044a4c056d0")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.74a883a037bc")}
          </TabsTrigger>
        </TabsList>

        <TabsContent keepMounted={hasVisited("overview")} value="overview" className="pt-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uiT("ui.7616a02a25e9ffbf")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p>
                    {uiT("ui.22d435a3711855db")}{" "}
                    {new Date(orgData.created_at).toLocaleDateString(getFormattingLocale())}
                  </p>
                  <p>
                    {uiT("ui.29d0051ddd1928e6")}{" "}
                    {new Date(orgData.updated_at).toLocaleDateString(getFormattingLocale())}
                  </p>
                  <p>
                    {uiT("ui.b9a6204c897efd6d")} {orgData.created_by}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uiT("ui.d29bae05649668aa")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p className="text-xl font-semibold">${formatNumberWithCommas(orgData.spend, 4)}</p>
                  <p>
                    {uiT("ui.28391d3bc64ec15c")}{" "}
                    {orgData.litellm_budget_table.max_budget === null
                      ? uiT("ui.11dde17d6c3e")
                      : `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`}
                  </p>
                  {orgData.litellm_budget_table.budget_duration && (
                    <p className="text-muted-foreground">
                      {uiT("ui.19a37a6d2b12fe28")} {orgData.litellm_budget_table.budget_duration}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uiT("ui.ed129d234fd4")}</p>
                <div className="mt-2 text-sm text-foreground">
                  <p>
                    {uiT("ui.22506bb2e2fc9c02")} {orgData.litellm_budget_table.tpm_limit ?? uiT("ui.11dde17d6c3e")}
                  </p>
                  <p>
                    {uiT("ui.0a9c9fab18f38f0e")} {orgData.litellm_budget_table.rpm_limit ?? uiT("ui.11dde17d6c3e")}
                  </p>
                  {orgData.litellm_budget_table.max_parallel_requests && (
                    <p>
                      {uiT("ui.ee5508890a86")} {orgData.litellm_budget_table.max_parallel_requests}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uiT("ui.d17d2d78d76e")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.models.length === 0 ? (
                    <BadgeLink>{uiT("ui.1fcb7b9aa888")}</BadgeLink>
                  ) : (
                    orgData.models.map((model, index) => <BadgeLink key={index}>{model}</BadgeLink>)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">{uiT("ui.1e1a1c078af2")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.teams?.map((team, index) => (
                    <BadgeLink key={index} href={teamDetailHref(team.team_id)}>
                      {teamAliasMap[team.team_id] || team.team_id}
                    </BadgeLink>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ObjectPermissionsView
              objectPermission={orgData.object_permission}
              variant="card"
              accessToken={accessToken}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("members")} value="members" className="pt-4">
          <div className="space-y-4">
            <MemberTable
              key={orgData.organization_id}
              members={(orgData.members || []).map((m) => ({
                role: m.user_role || "",
                user_id: m.user_id,
                user_email: m.user_email,
                user_alias: m.user?.user_alias ?? null,
              }))}
              canEdit={canEditOrg}
              onEdit={(member) => {
                setSelectedEditMember(member);
                setIsEditMemberModalVisible(true);
              }}
              onDelete={(member) => handleMemberDelete(member)}
              onAddMember={() => setIsAddMemberModalVisible(true)}
              roleColumnTitle="Organization Role"
              extraColumns={orgExtraColumns}
              emptyText={uiT("ui.a4e937d25742e760")}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("settings")} value="settings" className="pt-4">
          <Card className="max-h-[65vh] overflow-y-auto">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{uiT("ui.cc1d9e616539ee4b")}</h2>
                {canEditOrg && !isEditing && (
                  <Button onClick={() => setIsEditing(true)}>{uiT("ui.cddc5824575b")}</Button>
                )}
              </div>

              {isEditing ? (
                <OrgSettingsForm
                  organizationId={organizationId}
                  org={orgData}
                  accessToken={accessToken || ""}
                  onCancel={() => setIsEditing(false)}
                  onSaved={() => setIsEditing(false)}
                />
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.4cbd90732447a928")}</p>
                    <div>{orgData.organization_alias}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.1f466322634e2d85")}</p>
                    <div className="font-mono">{orgData.organization_id}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.3d44337010bf")}</p>
                    <div>{new Date(orgData.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.d17d2d78d76e")}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {orgData.models.map((model, index) => (
                        <BadgeLink key={index}>{model}</BadgeLink>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.ed129d234fd4")}</p>
                    <div>
                      {uiT("ui.22506bb2e2fc9c02")} {orgData.litellm_budget_table.tpm_limit ?? uiT("ui.11dde17d6c3e")}
                    </div>
                    <div>
                      {uiT("ui.0a9c9fab18f38f0e")} {orgData.litellm_budget_table.rpm_limit ?? uiT("ui.11dde17d6c3e")}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uiT("ui.1c6225ec7092")}</p>
                    <div>
                      {uiT("ui.ef2840cc402ef492")}{" "}
                      {orgData.litellm_budget_table.max_budget !== null
                        ? `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`
                        : uiT("ui.366c2707df5c3c52")}
                    </div>
                    <div>
                      {uiT("ui.19a37a6d2b12fe28")}{" "}
                      {orgData.litellm_budget_table.budget_duration || uiT("ui.6300ef800bb8")}
                    </div>
                  </div>

                  <ObjectPermissionsView
                    objectPermission={orgData.object_permission}
                    variant="inline"
                    className="border-t pt-4"
                    accessToken={accessToken}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title={uiT("ui.3c189bde62b6b2d5")}
        roles={[
          {
            label: "org_admin",
            value: "org_admin",
            description: uiT("ui.72c6127535f9e3e8"),
          },
          {
            label: "internal_user",
            value: "internal_user",
            description: uiT("ui.4cfc93a13a0ca63b"),
          },
          {
            label: "internal_user_viewer",
            value: "internal_user_viewer",
            description: uiT("ui.115f2b1d9686b271"),
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: uiT("ui.41d3aafd7a40222c"),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: uiT("ui.1eef9046d967a91d"), value: "org_admin" },
            { label: uiT("ui.4a5a8d129e4b"), value: "internal_user" },
            { label: uiT("ui.2e9b2996eb97"), value: "internal_user_viewer" },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
