"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Copy, Edit, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

import { useSSOSettings, type SSOSettingsValues } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import { Logo } from "@/components/molecules/logo/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/utils/dataUtils";

import AddSSOSettingsModal from "./Modals/AddSSOSettingsModal";
import DeleteSSOSettingsModal from "./Modals/DeleteSSOSettingsModal";
import EditSSOSettingsModal from "./Modals/EditSSOSettingsModal";
import RedactableField from "./RedactableField";
import RoleMappings from "./RoleMappings";
import SSOSettingsEmptyPlaceholder from "./SSOSettingsEmptyPlaceholder";
import SSOSettingsLoadingSkeleton from "./SSOSettingsLoadingSkeleton";
import { ssoProviderDisplayNames, ssoProviderLogoMap } from "./constants";
import { detectSSOProvider } from "./utils";

function NotConfigured() {
  const { t: uiT } = useDashboardLanguage();

  return <span className="text-muted-foreground italic">{uiT("ui.dd1841d295024256")}</span>;
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

function EndpointValue({ value }: { value?: string | null }) {
  const { t: uiT } = useDashboardLanguage();

  if (!value) return <span className="font-mono text-muted-foreground">-</span>;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate font-mono text-sm text-muted-foreground">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={uiT("ui.c019c0f81132cb82")}
        onClick={() => void copyToClipboard(value, "Copied to clipboard")}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

export default function SSOSettings() {
  const { t: uiT } = useDashboardLanguage();

  const { data: ssoSettings, refetch, isLoading } = useSSOSettings();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isSSOConfigured = [
    ssoSettings?.values.google_client_id,
    ssoSettings?.values.microsoft_client_id,
    ssoSettings?.values.generic_client_id,
    ssoSettings?.values.saml_idp_metadata_url,
    ssoSettings?.values.saml_idp_metadata_xml,
  ].some(Boolean);
  const selectedProvider = ssoSettings?.values ? detectSSOProvider(ssoSettings.values) : null;
  const isRoleMappingsEnabled = Boolean(ssoSettings?.values.role_mappings);
  const isTeamMappingsEnabled = Boolean(ssoSettings?.values.team_mappings);

  const renderSimpleValue = (value?: string | null) => value || <NotConfigured />;
  const renderTeamMappingsField = (values: SSOSettingsValues) =>
    values.team_mappings?.team_ids_jwt_field ? (
      <Badge variant="secondary">{values.team_mappings.team_ids_jwt_field}</Badge>
    ) : (
      <NotConfigured />
    );

  const providerConfigs = {
    google: {
      providerText: ssoProviderDisplayNames.google,
      fields: [
        {
          label: uiT("ui.8726db013948f070"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_id} />,
        },
        {
          label: uiT("ui.ae21cf6d24b8ca46"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_secret} />,
        },
        {
          label: uiT("ui.82b56622ef7ec48f"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    microsoft: {
      providerText: ssoProviderDisplayNames.microsoft,
      fields: [
        {
          label: uiT("ui.8726db013948f070"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_id} />,
        },
        {
          label: uiT("ui.ae21cf6d24b8ca46"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_secret} />,
        },
        {
          label: uiT("ui.e23969d284c3424c"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.microsoft_tenant),
        },
        {
          label: uiT("ui.82b56622ef7ec48f"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    okta: {
      providerText: ssoProviderDisplayNames.okta,
      fields: [
        {
          label: uiT("ui.8726db013948f070"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: uiT("ui.ae21cf6d24b8ca46"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: uiT("ui.b42b956f5a0c7cad"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          label: uiT("ui.5738a2a41aa46bae"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          label: uiT("ui.b8b7cc288d5788ed"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          label: uiT("ui.0d5644ff52ce2ba3"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          label: uiT("ui.82b56622ef7ec48f"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              label: uiT("ui.5eeac1c989a710a1"),
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    generic: {
      providerText: ssoProviderDisplayNames.generic,
      fields: [
        {
          label: uiT("ui.8726db013948f070"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: uiT("ui.ae21cf6d24b8ca46"),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: uiT("ui.b42b956f5a0c7cad"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          label: uiT("ui.5738a2a41aa46bae"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          label: uiT("ui.b8b7cc288d5788ed"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          label: uiT("ui.0d5644ff52ce2ba3"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          label: uiT("ui.82b56622ef7ec48f"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              label: uiT("ui.5eeac1c989a710a1"),
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    saml: {
      providerText: ssoProviderDisplayNames.saml,
      fields: [
        {
          label: uiT("ui.4ebe47eb8d93e7a1"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_idp_metadata_url} />,
        },
        {
          label: uiT("ui.b0fb4eb3acd7eca2"),
          render: (values: SSOSettingsValues) =>
            values.saml_idp_metadata_xml ? (
              <Badge variant="secondary">{uiT("ui.96cbb6a396607bfe")}</Badge>
            ) : (
              <NotConfigured />
            ),
        },
        {
          label: uiT("ui.1994b6869b9702eb"),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_sp_entity_id} />,
        },
        {
          label: uiT("ui.78768d201dd377bb"),
          render: (values: SSOSettingsValues) => (
            <Badge variant={values.saml_allow_unsolicited === "true" ? "default" : "secondary"}>
              {values.saml_allow_unsolicited === "true" ? uiT("ui.92c1cdfdf4cb") : uiT("ui.75081b593d15")}
            </Badge>
          ),
        },
        {
          label: uiT("ui.82b56622ef7ec48f"),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
  };

  const renderSSOSettings = () => {
    if (!ssoSettings?.values || !selectedProvider) return null;
    const config = providerConfigs[selectedProvider as keyof typeof providerConfigs];
    if (!config) return null;

    return (
      <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
        <DetailRow label={uiT("ui.472590ae974d")}>
          <div className="flex items-center gap-2">
            {ssoProviderLogoMap[selectedProvider] && (
              <Logo
                src={ssoProviderLogoMap[selectedProvider]}
                label={ssoProviderDisplayNames[selectedProvider] || selectedProvider}
                className="size-6 object-contain"
              />
            )}
            <span>{config.providerText}</span>
          </div>
        </DetailRow>
        {config.fields.map(
          (field) =>
            field && (
              <DetailRow key={field.label} label={field.label}>
                {field.render(ssoSettings.values)}
              </DetailRow>
            ),
        )}
      </dl>
    );
  };

  return (
    <>
      {isLoading ? (
        <SSOSettingsLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-muted-foreground" />
                <div>
                  <CardTitle>
                    <h3>{uiT("ui.afd5751ed211f84e")}</h3>
                  </CardTitle>
                  <CardDescription>{uiT("ui.5f46184f85a8f87a")}</CardDescription>
                </div>
              </div>
              {isSSOConfigured && (
                <CardAction className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalVisible(true)}>
                    <Edit />
                    {uiT("ui.ca05b5e008d6b356")}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setIsDeleteModalVisible(true)}>
                    <Trash2 />
                    {uiT("ui.8a9f5abe87eb5a0d")}
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {isSSOConfigured ? (
                renderSSOSettings()
              ) : (
                <SSOSettingsEmptyPlaceholder onAdd={() => setIsAddModalVisible(true)} />
              )}
            </CardContent>
          </Card>
          {isRoleMappingsEnabled && <RoleMappings roleMappings={ssoSettings?.values.role_mappings} />}
        </div>
      )}

      <DeleteSSOSettingsModal
        isVisible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onSuccess={() => refetch()}
      />
      <AddSSOSettingsModal
        isVisible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          refetch();
        }}
      />
      <EditSSOSettingsModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false);
          refetch();
        }}
      />
    </>
  );
}
