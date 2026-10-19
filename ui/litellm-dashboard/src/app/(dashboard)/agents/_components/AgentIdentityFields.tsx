"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React, { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { apiClient } from "@/components/networking";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentFormField, type AgentFormValues } from "./AgentFormKit";
import { entraTenantFromIssuer, IDENTITY_UUID_PATTERN } from "./agent_identity";

const PROVIDER_OPTIONS = [
  {
    value: "none",
    get label() {
      return translateUi("ui.49ad9e3f26c02027");
    },
  },
  {
    value: "microsoft_entra",
    get label() {
      return translateUi("ui.eda567f3ec45bd45");
    },
  },
];
const EXECUTION_MODE_OPTIONS = [
  {
    value: "autonomous",
    get label() {
      return translateUi("ui.a8aa1f6bfe53cc97");
    },
  },
  {
    value: "delegated",
    get label() {
      return translateUi("ui.1c745751f7b9676b");
    },
  },
  {
    value: "both",
    get label() {
      return translateUi("ui.b6c1d862f9f75ec3");
    },
  },
];
const EXECUTION_OPTIONS = [
  {
    value: "enabled",
    get label() {
      return translateUi("ui.92c1cdfdf4cb");
    },
  },
  {
    value: "disabled",
    get label() {
      return translateUi("ui.75081b593d15");
    },
  },
];

export const AgentIdentityFields = ({ accessToken }: { accessToken: string | null }) => {
  const { t: uiT } = useDashboardLanguage();

  const provider = useWatch<AgentFormValues>({ name: "identity_provider" });
  const mode = useWatch<AgentFormValues>({ name: "execution_mode" });
  const showScopes = mode !== "autonomous" && mode !== undefined;
  const [tenants, setTenants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || provider !== "microsoft_entra") return;
    let active = true;
    apiClient
      .get<string[]>("/v1/agents/identity/providers", { accessToken })
      .then((issuers) => {
        if (active) {
          setError(null);
          setTenants(
            issuers.flatMap((issuer) => {
              const tenant = entraTenantFromIssuer(issuer);
              return tenant ? [tenant] : [];
            }),
          );
        }
      })
      .catch(() => {
        if (active) setError("Could not load the gateway's trusted identity providers");
      });
    return () => {
      active = false;
    };
  }, [accessToken, provider]);

  return (
    <>
      <section aria-label={uiT("ui.7a23ac9bb939a97e")} className="my-6 space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="font-medium">{uiT("ui.7a23ac9bb939a97e")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.51108e7cb0e43afa")}</p>
        </div>
        <AgentFormField name="identity_provider" label={uiT("ui.69be2c96c261ddbb")} defaultValue="none">
          {({ value, onChange, id }) => (
            <Select
              items={PROVIDER_OPTIONS}
              value={typeof value === "string" ? value : "none"}
              onValueChange={onChange}
            >
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </AgentFormField>
        {provider === "microsoft_entra" && (
          <>
            <AgentFormField
              name="identity_tenant_id"
              label={uiT("ui.262ceb73d6f4c74c")}
              rules={{ required: "Select a trusted tenant" }}
            >
              {({ value, onChange, id }) => (
                <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
                  <SelectTrigger id={id}>
                    <SelectValue placeholder={uiT("ui.ff12b264bbe799e2")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant} value={tenant}>
                        {tenant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {!error && tenants.length === 0 && (
              <p className="text-sm text-muted-foreground">{uiT("ui.ce9234c16baa4cc5")}</p>
            )}
            <AgentFormField
              name="identity_client_id"
              label={uiT("ui.a7168cfe83fa5085")}
              rules={{
                required: "Enter the Entra application client ID",
                pattern: { value: IDENTITY_UUID_PATTERN, message: uiT("ui.1a2ee936442ca370") },
              }}
              description={
                <>
                  {uiT("ui.3a28e4166b2178bf")}{" "}
                  <a className="underline" href="https://entra.microsoft.com/" target="_blank" rel="noreferrer">
                    {uiT("ui.e1527e75446eda43")}
                  </a>
                  {uiT("ui.283df0afdfaa6fe5")}
                </>
              }
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                  placeholder={uiT("ui.e1b185d5d88e6646")}
                />
              )}
            </AgentFormField>
            <AgentFormField name="execution_mode" label={uiT("ui.ff7892f74d89b2ab")} defaultValue="autonomous">
              {({ value, onChange, id }) => (
                <Select
                  items={EXECUTION_MODE_OPTIONS}
                  value={typeof value === "string" ? value : "autonomous"}
                  onValueChange={onChange}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            <AgentFormField
              name="identity_service_principal_id"
              label={uiT("ui.c40e102af55633a2")}
              rules={{
                required: mode !== "delegated" ? "Enter the service principal Object ID" : false,
                pattern: { value: IDENTITY_UUID_PATTERN, message: uiT("ui.b183fd9e8767b3c2") },
              }}
              description={
                <>
                  {uiT("ui.ed077f3d8125")}{" "}
                  <a
                    className="underline"
                    href="https://entra.microsoft.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {uiT("ui.a099b7cd7ef7b83f")}
                  </a>
                  {uiT("ui.6511ca59ac961391")}
                </>
              }
            >
              {({ value, onChange, ref, ...control }) => (
                <Input {...control} ref={ref} value={typeof value === "string" ? value : ""} onChange={onChange} />
              )}
            </AgentFormField>

            <AgentFormField
              name="identity_required_roles"
              label={uiT("ui.728fd51d750ab0f6")}
              description={uiT("ui.bc5b1d45249f86fe")}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                  placeholder={uiT("ui.d230588953eefced")}
                />
              )}
            </AgentFormField>

            {showScopes && (
              <>
                <AgentFormField
                  name="identity_required_scopes"
                  label={uiT("ui.ead4b42308de1333")}
                  defaultValue="user_impersonation"
                  rules={{ required: "Enter a delegated scope" }}
                >
                  {({ value, onChange, ref, ...control }) => (
                    <Input
                      {...control}
                      ref={ref}
                      value={typeof value === "string" ? value : "user_impersonation"}
                      onChange={onChange}
                    />
                  )}
                </AgentFormField>
                <p className="text-sm text-muted-foreground">{uiT("ui.6e3a06d812b18698")}</p>
              </>
            )}
            <AgentFormField name="enabled" label={uiT("ui.a45cd4bd0998e568")} defaultValue={true}>
              {({ value, onChange, id }) => (
                <Select
                  items={EXECUTION_OPTIONS}
                  value={value === false ? "disabled" : "enabled"}
                  onValueChange={(next) => onChange(next === "enabled")}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            <p className="text-sm text-muted-foreground">{uiT("ui.8573521a6245b675")}</p>
          </>
        )}
      </section>
    </>
  );
};
