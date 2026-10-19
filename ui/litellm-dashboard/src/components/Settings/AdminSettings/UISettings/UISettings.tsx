"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { useUpdateUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUpdateUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { uiHref } from "@/utils/uiHref";
import PageVisibilitySettings from "./PageVisibilitySettings";

interface SettingRowProps {
  ariaLabel: string;
  checked: boolean;
  description?: string;
  disabled: boolean;
  indented?: boolean;
  label: string;
  muted?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({
  ariaLabel,
  checked,
  description,
  disabled,
  indented = false,
  label,
  muted = false,
  onCheckedChange,
}: SettingRowProps) {
  return (
    <div className={indented ? "ml-8 flex items-start gap-3" : "flex items-start gap-3"}>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />
      <div className="space-y-1">
        <p className={muted ? "text-sm font-medium text-muted-foreground" : "text-sm font-medium text-foreground"}>
          {label}
        </p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export default function UISettings() {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useUISettings();
  const { mutate: updateSettings, isPending: isUpdating, error: updateError } = useUpdateUISettings(accessToken);

  const schema = data?.field_schema;
  const property = schema?.properties?.disable_model_add_for_internal_users;
  const disableTeamAdminDeleteProperty = schema?.properties?.disable_team_admin_delete_team_user;
  const requireAuthForPublicAIHubProperty = schema?.properties?.require_auth_for_public_ai_hub;
  const forwardClientHeadersProperty = schema?.properties?.forward_client_headers_to_llm_api;
  const forwardLLMProviderAuthHeadersProperty = schema?.properties?.forward_llm_provider_auth_headers;
  const enableProjectsUIProperty = schema?.properties?.enable_projects_ui;
  const enableChatUIProperty = schema?.properties?.enable_chat_ui;
  const enabledPagesProperty = schema?.properties?.enabled_ui_pages_internal_users;
  const disableAgentsProperty = schema?.properties?.disable_agents_for_internal_users;
  const allowAgentsTeamAdminsProperty = schema?.properties?.allow_agents_for_team_admins;
  const disableVectorStoresProperty = schema?.properties?.disable_vector_stores_for_internal_users;
  const allowVectorStoresTeamAdminsProperty = schema?.properties?.allow_vector_stores_for_team_admins;
  const scopeUserSearchProperty = schema?.properties?.scope_user_search_to_org;
  const disableCustomApiKeysProperty = schema?.properties?.disable_custom_api_keys;
  const values = data?.values ?? {};
  const moyaiUrl = (values.moyai_url as string | undefined) ?? null;
  const isDisabledForInternalUsers = Boolean(values.disable_model_add_for_internal_users);
  const isDisabledTeamAdminDeleteTeamUser = Boolean(values.disable_team_admin_delete_team_user);
  const isAgentsDisabled = Boolean(values.disable_agents_for_internal_users);
  const isVectorStoresDisabled = Boolean(values.disable_vector_stores_for_internal_users);

  const handleToggle = (checked: boolean) => {
    updateSettings(
      { disable_model_add_for_internal_users: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleTeamAdminDelete = (checked: boolean) => {
    updateSettings(
      { disable_team_admin_delete_team_user: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleUpdatePageVisibility = (settings: { enabled_ui_pages_internal_users: string[] | null }) => {
    updateSettings(settings, {
      onSuccess: () => {
        toast.success(translateUi("ui.60867f6cd4734b63"));
      },
      onError: (error) => {
        toast.fromError(error);
      },
    });
  };

  const handleToggleForwardClientHeaders = (checked: boolean) => {
    updateSettings(
      { forward_client_headers_to_llm_api: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleForwardLLMProviderAuthHeaders = (checked: boolean) => {
    updateSettings(
      { forward_llm_provider_auth_headers: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleEnableProjectsUI = (checked: boolean) => {
    updateSettings(
      { enable_projects_ui: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.a319e935a259f7b9"));
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleEnableChatUI = (checked: boolean) => {
    updateSettings(
      { enable_chat_ui: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.a319e935a259f7b9"));
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleRequireAuthForPublicAIHub = (checked: boolean) => {
    updateSettings(
      { require_auth_for_public_ai_hub: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleDisableAgents = (checked: boolean) => {
    updateSettings(
      { disable_agents_for_internal_users: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleAllowAgentsTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_agents_for_team_admins: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleDisableVectorStores = (checked: boolean) => {
    updateSettings(
      { disable_vector_stores_for_internal_users: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleAllowVectorStoresTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_vector_stores_for_team_admins: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleScopeUserSearch = (checked: boolean) => {
    updateSettings(
      { scope_user_search_to_org: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleDisconnectMoyai = () => {
    updateSettings(
      { moyai_url: null },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  const handleToggleDisableCustomApiKeys = (checked: boolean) => {
    updateSettings(
      { disable_custom_api_keys: checked },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.ec30c4a2ba5ca8b5"));
        },
        onError: (error) => {
          toast.fromError(error);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{uiT("ui.2042b39a60a69db1")}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div role="status" aria-label={uiT("ui.c537e3a93ce05481")} className="space-y-3">
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="error">
            <AlertTitle>{uiT("ui.5fa699ec662ac07b")}</AlertTitle>
            {error instanceof Error && <AlertDescription>{error.message}</AlertDescription>}
          </Alert>
        ) : (
          <div className="space-y-6">
            {schema?.description && <p className="text-sm text-foreground">{schema.description}</p>}
            {updateError && (
              <Alert variant="error">
                <AlertTitle>{uiT("ui.20c14df2da358b9b")}</AlertTitle>
                {updateError instanceof Error && <AlertDescription>{updateError.message}</AlertDescription>}
              </Alert>
            )}

            <SettingRow
              checked={isDisabledForInternalUsers}
              disabled={isUpdating}
              onCheckedChange={handleToggle}
              ariaLabel={property?.description ?? "Disable model add for internal users"}
              label={uiT("ui.b1e599605ba9f7f4")}
              description={property?.description}
            />
            <SettingRow
              checked={isDisabledTeamAdminDeleteTeamUser}
              disabled={isUpdating}
              onCheckedChange={handleToggleTeamAdminDelete}
              ariaLabel={disableTeamAdminDeleteProperty?.description ?? "Disable team admin delete team user"}
              label={uiT("ui.7816626489a270ea")}
              description={disableTeamAdminDeleteProperty?.description}
            />
            <SettingRow
              checked={Boolean(values.require_auth_for_public_ai_hub)}
              disabled={isUpdating}
              onCheckedChange={handleToggleRequireAuthForPublicAIHub}
              ariaLabel={requireAuthForPublicAIHubProperty?.description ?? "Require authentication for public AI Hub"}
              label={uiT("ui.f3090005d9973c04")}
              description={requireAuthForPublicAIHubProperty?.description}
            />
            <SettingRow
              checked={Boolean(values.forward_client_headers_to_llm_api)}
              disabled={isUpdating}
              onCheckedChange={handleToggleForwardClientHeaders}
              ariaLabel={forwardClientHeadersProperty?.description ?? "Forward client headers to LLM API"}
              label={uiT("ui.a2368dc8419ff2d5")}
              description={forwardClientHeadersProperty?.description ?? uiT("ui.97127c34b859cd30")}
            />
            <SettingRow
              checked={Boolean(values.forward_llm_provider_auth_headers)}
              disabled={isUpdating}
              onCheckedChange={handleToggleForwardLLMProviderAuthHeaders}
              ariaLabel={forwardLLMProviderAuthHeadersProperty?.description ?? "Forward LLM provider auth headers"}
              label={uiT("ui.787401c5edb956c0")}
              description={forwardLLMProviderAuthHeadersProperty?.description ?? uiT("ui.42201dc408e7cbf1")}
            />
            {enableProjectsUIProperty && (
              <SettingRow
                checked={Boolean(values.enable_projects_ui)}
                disabled={isUpdating}
                onCheckedChange={handleToggleEnableProjectsUI}
                ariaLabel={enableProjectsUIProperty.description ?? "Enable Projects UI"}
                label={uiT("ui.59d43d3906ff4364")}
                description={enableProjectsUIProperty.description ?? uiT("ui.03f6e33fecc873d6")}
              />
            )}
            <SettingRow
              checked={Boolean(values.enable_chat_ui)}
              disabled={isUpdating}
              onCheckedChange={handleToggleEnableChatUI}
              ariaLabel={enableChatUIProperty?.description ?? "Enable Chat page"}
              label={uiT("ui.af5f46305ec5fafb")}
              description={enableChatUIProperty?.description ?? uiT("ui.16e16f7c63873620")}
            />

            <Separator />
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{uiT("ui.a3b951e5e352050e")}</p>
                <p className="text-sm text-muted-foreground">
                  {moyaiUrl ? uiT("ui.2d4f3a0521f98c26", { v0: String(moyaiUrl) }) : uiT("ui.0303e18246708180")}
                </p>
              </div>
              {moyaiUrl ? (
                <Button variant="outline" size="sm" disabled={isUpdating} onClick={handleDisconnectMoyai}>
                  {uiT("ui.acfc5be785a9bb3d")}
                </Button>
              ) : (
                <a href={uiHref("moyai")} className="text-sm text-primary underline underline-offset-4">
                  {uiT("ui.08d0f4e279261d8b")}
                </a>
              )}
            </div>

            <Separator />
            <SettingRow
              checked={isAgentsDisabled}
              disabled={isUpdating}
              onCheckedChange={handleToggleDisableAgents}
              ariaLabel={disableAgentsProperty?.description ?? "Disable agents for internal users"}
              label={uiT("ui.fe2535fea0a78f5a")}
              description={disableAgentsProperty?.description}
            />
            <SettingRow
              checked={Boolean(values.allow_agents_for_team_admins)}
              disabled={isUpdating || !isAgentsDisabled}
              onCheckedChange={handleToggleAllowAgentsTeamAdmins}
              ariaLabel={allowAgentsTeamAdminsProperty?.description ?? "Allow agents for team admins"}
              label={uiT("ui.a230de81329db629")}
              description={allowAgentsTeamAdminsProperty?.description}
              indented
              muted={!isAgentsDisabled}
            />

            <Separator />
            <SettingRow
              checked={isVectorStoresDisabled}
              disabled={isUpdating}
              onCheckedChange={handleToggleDisableVectorStores}
              ariaLabel={disableVectorStoresProperty?.description ?? "Disable vector stores for internal users"}
              label={uiT("ui.e4d5c699188640c6")}
              description={disableVectorStoresProperty?.description}
            />
            <SettingRow
              checked={Boolean(values.allow_vector_stores_for_team_admins)}
              disabled={isUpdating || !isVectorStoresDisabled}
              onCheckedChange={handleToggleAllowVectorStoresTeamAdmins}
              ariaLabel={allowVectorStoresTeamAdminsProperty?.description ?? "Allow vector stores for team admins"}
              label={uiT("ui.522d91eb3bcb5b6a")}
              description={allowVectorStoresTeamAdminsProperty?.description}
              indented
              muted={!isVectorStoresDisabled}
            />

            <Separator />
            <SettingRow
              checked={Boolean(values.scope_user_search_to_org)}
              disabled={isUpdating}
              onCheckedChange={handleToggleScopeUserSearch}
              ariaLabel={scopeUserSearchProperty?.description ?? "Scope user search to organization"}
              label={uiT("ui.a73015a67c3981ce")}
              description={scopeUserSearchProperty?.description ?? uiT("ui.dee053189fdc8476")}
            />

            <Separator />
            <SettingRow
              checked={Boolean(values.disable_custom_api_keys)}
              disabled={isUpdating}
              onCheckedChange={handleToggleDisableCustomApiKeys}
              ariaLabel={disableCustomApiKeysProperty?.description ?? "Disable custom Virtual key values"}
              label={uiT("ui.767ec7ddbded853c")}
              description={disableCustomApiKeysProperty?.description ?? uiT("ui.b6106df9af453284")}
            />

            <Separator />
            <PageVisibilitySettings
              enabledPagesInternalUsers={values.enabled_ui_pages_internal_users}
              enabledPagesPropertyDescription={enabledPagesProperty?.description}
              isUpdating={isUpdating}
              onUpdate={handleUpdatePageVisibility}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
