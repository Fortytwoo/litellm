"use client";
import { t as translateUi } from "@/i18n";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { all_admin_roles, internalUserRoles } from "@/utils/roles";
import { autoRouterCreationScope, canCreateModels } from "@/utils/modelPermissions";
import BetaBadge from "@/components/BetaBadge";
import DecisionModelsBanner from "@/components/molecules/DecisionModelsBanner";
import ModelInfoView from "@/components/model_info_view";
import TeamInfoView from "@/components/team/TeamInfo";
import { useModelDetailRouting } from "@/app/(dashboard)/models-and-endpoints/detailNavigation";
import { useModelDashboardData } from "@/app/(dashboard)/models-and-endpoints/useModelDashboardData";
import AllModelsPanel from "@/app/(dashboard)/models-and-endpoints/panels/AllModelsPanel";
import AutoRoutersTabPanel from "@/app/(dashboard)/models-and-endpoints/panels/AutoRoutersTabPanel";
import AddModelPanel from "@/app/(dashboard)/models-and-endpoints/panels/AddModelPanel";
import LlmCredentialsPanel from "@/app/(dashboard)/models-and-endpoints/panels/LlmCredentialsPanel";
import PassThroughPanel from "@/app/(dashboard)/models-and-endpoints/panels/PassThroughPanel";
import HealthStatusPanel from "@/app/(dashboard)/models-and-endpoints/panels/HealthStatusPanel";
import ModelRetrySettingsPanel from "@/app/(dashboard)/models-and-endpoints/panels/ModelRetrySettingsPanel";
import ModelGroupAliasPanel from "@/app/(dashboard)/models-and-endpoints/panels/ModelGroupAliasPanel";
import AccessGroupBudgetsPanel from "@/app/(dashboard)/models-and-endpoints/panels/AccessGroupBudgetsPanel";
import PriceDataPanel from "@/app/(dashboard)/models-and-endpoints/panels/PriceDataPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ModelTabSlug =
  | "add"
  | "auto-routers"
  | "llm-credentials"
  | "pass-through"
  | "health"
  | "retry-settings"
  | "model-group-alias"
  | "access-group-budgets"
  | "price-data";

const BASE_TAB_KEY = "all-models";

const TAB_LABELS: Record<ModelTabSlug, string> = {
  get add() {
    return translateUi("ui.7060e8240675f8ae");
  },
  get "auto-routers"() {
    return translateUi("ui.01f4ed9134449365");
  },
  get "llm-credentials"() {
    return translateUi("ui.2268595e97e747aa");
  },
  get "pass-through"() {
    return translateUi("ui.05255da7663b1829");
  },
  get health() {
    return translateUi("ui.97b7a73d47fd543e");
  },
  get "retry-settings"() {
    return translateUi("ui.a5b1f7ae7c1db826");
  },
  get "model-group-alias"() {
    return translateUi("ui.f58e1244e8d21ab5");
  },
  get "access-group-budgets"() {
    return translateUi("ui.72519ce4397bd6e7");
  },
  get "price-data"() {
    return translateUi("ui.f456111be20cdeb0");
  },
};

const renderPanel = (key: string) => {
  switch (key) {
    case BASE_TAB_KEY:
      return <AllModelsPanel />;
    case "auto-routers":
      return <AutoRoutersTabPanel />;
    case "add":
      return <AddModelPanel />;
    case "llm-credentials":
      return <LlmCredentialsPanel />;
    case "pass-through":
      return <PassThroughPanel />;
    case "health":
      return <HealthStatusPanel />;
    case "retry-settings":
      return <ModelRetrySettingsPanel />;
    case "model-group-alias":
      return <ModelGroupAliasPanel />;
    case "access-group-budgets":
      return <AccessGroupBudgetsPanel />;
    case "price-data":
      return <PriceDataPanel />;
    default:
      return null;
  }
};

export default function ModelsAndEndpointsPage() {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken, userRole, userId: userID, premiumUser, isViewOnly } = useAuthorized();
  const { data: teams } = useTeams();
  const { data: uiSettings } = useUISettings();
  const queryClient = useQueryClient();
  const { modelId, teamId, close } = useModelDetailRouting();
  const { availableModelAccessGroups, allModelsOnProxy } = useModelDashboardData();

  const [activeKey, setActiveKey] = useState<string>(BASE_TAB_KEY);
  const [lastRefreshed, setLastRefreshed] = useState("");

  const isInternalUser = userRole && internalUserRoles.includes(userRole);
  const canCreate = canCreateModels(
    { userRole, userID, isViewOnly },
    {
      teams: teams ?? null,
      disabledForInternalUsers:
        isInternalUser === true && uiSettings?.values?.disable_model_add_for_internal_users === true,
    },
  );
  const isAdmin = all_admin_roles.includes(userRole);
  const canViewAutoRouters =
    autoRouterCreationScope(
      { userRole, userID, isViewOnly },
      { teams: teams ?? null, disabledForInternalUsers: false },
    ) !== "forbidden";

  const visibleSlugs = useMemo<Array<"" | ModelTabSlug>>(
    () => [
      "",
      ...(canCreate ? (["add"] as const) : []),
      ...(isAdmin || canViewAutoRouters ? (["auto-routers"] as const) : []),
      // effectiveSessionRole reports proxy_admin_viewer as "Admin", so isAdmin alone would show a
      // viewer these write-only panels; only the raw-role isViewOnly separates them. Health Status
      // stays: it is the bucket's one read view, and viewers keep read parity with admins.
      ...(isAdmin && !isViewOnly ? (["llm-credentials", "pass-through"] as const) : []),
      ...(isAdmin ? (["health"] as const) : []),
      ...(isAdmin && !isViewOnly
        ? (["retry-settings", "model-group-alias", "access-group-budgets", "price-data"] as const)
        : []),
    ],
    [canCreate, canViewAutoRouters, isAdmin, isViewOnly],
  );

  const allModelsLabel = isAdmin ? "Deployed Models" : "Your Models";
  const tabLabel = (slug: "" | ModelTabSlug): React.ReactNode => {
    if (!slug) return translateText(allModelsLabel);
    if (slug === "auto-routers" || slug === "access-group-budgets") {
      return (
        <span className="flex items-center gap-2">
          {TAB_LABELS[slug]} <BetaBadge />
        </span>
      );
    }
    return TAB_LABELS[slug];
  };

  const handleRefreshClick = () => {
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    queryClient.invalidateQueries({ queryKey: ["models", "list"] });
  };

  const invalidateModels = () => queryClient.invalidateQueries({ queryKey: ["models", "list"] });

  if (teamId) {
    return (
      <div className="w-full h-full">
        <TeamInfoView
          teamId={teamId}
          onClose={close}
          accessToken={accessToken}
          is_team_admin={userRole === "Admin" && !isViewOnly}
          is_proxy_admin={userRole === "Admin" && !isViewOnly}
          userModels={allModelsOnProxy}
          editTeam={false}
          onUpdate={invalidateModels}
          premiumUser={premiumUser}
        />
      </div>
    );
  }

  return (
    <div className="mx-4">
      <div className="mt-2 flex w-full flex-col gap-2 p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{uiT("ui.2eb7bfd3de3b217a")}</h2>
            {isAdmin ? (
              <p className="text-sm text-muted-foreground">{uiT("ui.a4098d1d192f9d9d")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{uiT("ui.7d76dee31cf508a2")}</p>
            )}
          </div>
        </div>

        {!isViewOnly && <DecisionModelsBanner />}

        {modelId ? (
          <ModelInfoView
            modelId={modelId}
            onClose={close}
            accessToken={accessToken}
            userID={userID}
            userRole={userRole}
            isViewOnly={isViewOnly}
            onModelUpdate={invalidateModels}
            modelAccessGroups={availableModelAccessGroups}
          />
        ) : (
          <Tabs value={activeKey} onValueChange={setActiveKey}>
            <div className="flex min-w-0 flex-nowrap items-center gap-3 border-b">
              <div className="no-scrollbar scroll-fade-e -mb-1.5 min-w-0 flex-1 overflow-x-auto pb-1.5">
                <TabsList variant="line" className="w-max justify-start">
                  {visibleSlugs.map((slug) => {
                    const key = slug || BASE_TAB_KEY;
                    return (
                      <TabsTrigger key={key} value={key} className="flex-none">
                        {tabLabel(slug)}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              <div className="flex shrink-0 items-center gap-2 pb-1">
                {lastRefreshed && (
                  <span className="text-xs text-muted-foreground">
                    {uiT("ui.3b98c503fa688b18")} {lastRefreshed}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRefreshClick}
                  aria-label={uiT("ui.04903063b2fd6a42")}
                >
                  <RefreshCw />
                </Button>
              </div>
            </div>
            {visibleSlugs.map((slug) => {
              const key = slug || BASE_TAB_KEY;
              return (
                <TabsContent key={key} value={key} className="pt-4">
                  {renderPanel(key)}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
