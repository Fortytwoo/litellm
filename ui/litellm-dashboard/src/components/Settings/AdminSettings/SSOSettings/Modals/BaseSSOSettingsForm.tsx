"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import React from "react";
import { FormProvider, useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { ssoProviderLogoMap, ssoProviderDisplayNames } from "../constants";
import { Logo } from "@/components/molecules/logo/Logo";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";

export interface SSOSettingsFormValues {
  sso_provider?: string;
  google_client_id?: string;
  google_client_secret?: string;
  microsoft_client_id?: string;
  microsoft_client_secret?: string;
  microsoft_tenant?: string;
  generic_client_id?: string;
  generic_client_secret?: string;
  generic_authorization_endpoint?: string;
  generic_token_endpoint?: string;
  generic_userinfo_endpoint?: string;
  generic_scope?: string;
  saml_idp_metadata_url?: string;
  saml_idp_metadata_xml?: string;
  saml_sp_entity_id?: string;
  saml_allow_unsolicited?: boolean;
  user_email?: string;
  proxy_base_url?: string;
  use_role_mappings?: boolean;
  group_claim?: string;
  default_role?: string;
  proxy_admin_teams?: string;
  admin_viewer_teams?: string;
  internal_user_teams?: string;
  internal_viewer_teams?: string;
  use_team_mappings?: boolean;
  team_ids_jwt_field?: string;
}

export interface BaseSSOSettingsFormProps {
  form: UseFormReturn<SSOSettingsFormValues>;
  onFormSubmit: (formValues: SSOSettingsFormValues) => Promise<void>;
}

export interface SSOProviderConfig {
  envVarMap: Record<string, string>;
  fields: Array<{
    label: string;
    name: keyof SSOSettingsFormValues;
    placeholder?: string;
    required?: boolean;
    type?: "password" | "textarea" | "checkbox";
  }>;
}

export const ssoProviderConfigs: Record<string, SSOProviderConfig> = {
  google: {
    envVarMap: {
      google_client_id: "GOOGLE_CLIENT_ID",
      google_client_secret: "GOOGLE_CLIENT_SECRET",
    },
    fields: [
      {
        get label() {
          return translateUi("ui.a78e39005aeb8489");
        },
        name: "google_client_id",
      },
      {
        get label() {
          return translateUi("ui.00dfadc86b97d634");
        },
        name: "google_client_secret",
      },
    ],
  },
  microsoft: {
    envVarMap: {
      microsoft_client_id: "MICROSOFT_CLIENT_ID",
      microsoft_client_secret: "MICROSOFT_CLIENT_SECRET",
      microsoft_tenant: "MICROSOFT_TENANT",
    },
    fields: [
      {
        get label() {
          return translateUi("ui.45da5e67af1e0bdb");
        },
        name: "microsoft_client_id",
      },
      {
        get label() {
          return translateUi("ui.f387f3fd465b8941");
        },
        name: "microsoft_client_secret",
      },
      {
        get label() {
          return translateUi("ui.bd044e43c63ab7b4");
        },
        name: "microsoft_tenant",
      },
    ],
  },
  okta: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
      generic_scope: "GENERIC_SCOPE",
    },
    fields: [
      {
        get label() {
          return translateUi("ui.d0df10df260c6c99");
        },
        name: "generic_client_id",
      },
      {
        get label() {
          return translateUi("ui.c19f7a953d468c16");
        },
        name: "generic_client_secret",
      },
      {
        get label() {
          return translateUi("ui.b42b956f5a0c7cad");
        },
        name: "generic_authorization_endpoint",
        placeholder: "https://your-domain/authorize",
      },
      {
        get label() {
          return translateUi("ui.5738a2a41aa46bae");
        },
        name: "generic_token_endpoint",
        placeholder: "https://your-domain/token",
      },
      {
        get label() {
          return translateUi("ui.592b3c7ff3040229");
        },
        name: "generic_userinfo_endpoint",
        placeholder: "https://your-domain/userinfo",
      },
      {
        get label() {
          return translateUi("ui.0d5644ff52ce2ba3");
        },
        name: "generic_scope",
        get placeholder() {
          return translateUi("ui.9a8090dad4623cf5");
        },
        required: false,
      },
    ],
  },
  generic: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
      generic_scope: "GENERIC_SCOPE",
    },
    fields: [
      {
        get label() {
          return translateUi("ui.d0df10df260c6c99");
        },
        name: "generic_client_id",
      },
      {
        get label() {
          return translateUi("ui.c19f7a953d468c16");
        },
        name: "generic_client_secret",
      },
      {
        get label() {
          return translateUi("ui.b42b956f5a0c7cad");
        },
        name: "generic_authorization_endpoint",
      },
      {
        get label() {
          return translateUi("ui.5738a2a41aa46bae");
        },
        name: "generic_token_endpoint",
      },
      {
        get label() {
          return translateUi("ui.592b3c7ff3040229");
        },
        name: "generic_userinfo_endpoint",
      },
      {
        get label() {
          return translateUi("ui.0d5644ff52ce2ba3");
        },
        name: "generic_scope",
        get placeholder() {
          return translateUi("ui.9a8090dad4623cf5");
        },
        required: false,
      },
    ],
  },
  saml: {
    envVarMap: {
      saml_idp_metadata_url: "SAML_IDP_METADATA_URL",
      saml_idp_metadata_xml: "SAML_IDP_METADATA_XML",
      saml_sp_entity_id: "SAML_SP_ENTITY_ID",
      saml_allow_unsolicited: "SAML_ALLOW_UNSOLICITED",
    },
    fields: [
      {
        get label() {
          return translateUi("ui.4ebe47eb8d93e7a1");
        },
        name: "saml_idp_metadata_url",
        required: false,
        placeholder: "https://idp.example.com/metadata (use this or the metadata XML below)",
      },
      {
        get label() {
          return translateUi("ui.b0fb4eb3acd7eca2");
        },
        name: "saml_idp_metadata_xml",
        required: false,
        type: "textarea",
        get placeholder() {
          return translateUi("ui.bbf49775b323ea12");
        },
      },
      {
        get label() {
          return translateUi("ui.1994b6869b9702eb");
        },
        name: "saml_sp_entity_id",
        required: false,
        get placeholder() {
          return translateUi("ui.3ec26bde37de0b03");
        },
      },
      {
        get label() {
          return translateUi("ui.78768d201dd377bb");
        },
        name: "saml_allow_unsolicited",
        required: false,
        type: "checkbox",
      },
    ],
  },
};

const ROLE_MAPPING_TEAM_FIELDS = [
  "proxy_admin_teams",
  "admin_viewer_teams",
  "internal_user_teams",
  "internal_viewer_teams",
] as const;

const supportsMappings = (provider: string | undefined): boolean => provider === "okta" || provider === "generic";

const providerFieldNames = (provider: string | undefined): readonly string[] =>
  provider ? ssoProviderConfigs[provider]?.fields.map((field) => field.name) ?? [] : [];

export type SSOFormVariant = "sso-settings" | "admin-panel";

export const mountedSSOFieldNames = (values: SSOSettingsFormValues, variant: SSOFormVariant): readonly string[] => {
  const provider = values.sso_provider;
  const showMappingToggles = supportsMappings(provider);
  const roleFieldsVisible =
    variant === "sso-settings"
      ? Boolean(values.use_role_mappings) && showMappingToggles
      : Boolean(values.use_role_mappings);
  const teamFieldsVisible = variant === "sso-settings" && Boolean(values.use_team_mappings) && showMappingToggles;

  return [
    "sso_provider",
    ...providerFieldNames(provider),
    "user_email",
    "proxy_base_url",
    ...(showMappingToggles ? ["use_role_mappings"] : []),
    ...(roleFieldsVisible ? ["group_claim", "default_role", ...ROLE_MAPPING_TEAM_FIELDS] : []),
    ...(variant === "sso-settings" && showMappingToggles ? ["use_team_mappings"] : []),
    ...(teamFieldsVisible ? ["team_ids_jwt_field"] : []),
  ];
};

export const pickMountedSSOValues = (values: SSOSettingsFormValues, variant: SSOFormVariant): SSOSettingsFormValues =>
  Object.fromEntries(
    mountedSSOFieldNames(values, variant).map((name) => [name, values[name as keyof SSOSettingsFormValues]]),
  );

export const submitMountedSSOValues =
  (
    form: UseFormReturn<SSOSettingsFormValues>,
    variant: SSOFormVariant,
    onFormSubmit: (formValues: SSOSettingsFormValues) => Promise<void> | void,
  ) =>
  () =>
    void form.handleSubmit((values) => onFormSubmit(pickMountedSSOValues(values, variant)))();

const REQUIRED_MESSAGES: Record<string, string> = {
  sso_provider: "Please select an SSO provider",
  user_email: "Please enter the email of the proxy admin",
  proxy_base_url: "Please enter the proxy base url",
  group_claim: "Please enter the group claim",
  team_ids_jwt_field: "Please enter the team IDs JWT field",
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

export const buildSSOSettingsSchema = (variant: SSOFormVariant) =>
  z.custom<SSOSettingsFormValues>().superRefine((values, ctx) => {
    const mounted = new Set(mountedSSOFieldNames(values, variant));

    const requireField = (name: string) => {
      if (mounted.has(name) && isBlank(values[name as keyof SSOSettingsFormValues])) {
        ctx.addIssue({ code: "custom", path: [name], message: REQUIRED_MESSAGES[name] });
      }
    };

    requireField("sso_provider");
    requireField("user_email");
    requireField("group_claim");
    requireField("team_ids_jwt_field");

    const providerConfig = values.sso_provider ? ssoProviderConfigs[values.sso_provider] : undefined;
    providerConfig?.fields.forEach((field) => {
      if (field.required === false) return;
      if (!isBlank(values[field.name])) return;
      ctx.addIssue({
        code: "custom",
        path: [field.name],
        get message() {
          return translateUi("ui.3d1764b14b68f4fe", undefined, { v0: String(field.label.toLowerCase()) });
        },
      });
    });

    const proxyBaseUrl = values.proxy_base_url;
    if (isBlank(proxyBaseUrl)) {
      ctx.addIssue({ code: "custom", path: ["proxy_base_url"], message: REQUIRED_MESSAGES.proxy_base_url });
      return;
    }
    if (!/^https?:\/\/.+/.test(proxyBaseUrl as string)) {
      ctx.addIssue({
        code: "custom",
        path: ["proxy_base_url"],
        get message() {
          return translateUi("ui.bd6dcfaaa23f4577");
        },
      });
      return;
    }
    if ((proxyBaseUrl as string).endsWith("/")) {
      ctx.addIssue({
        code: "custom",
        path: ["proxy_base_url"],
        get message() {
          return translateUi("ui.39d5dc65f81a246c");
        },
      });
    }
  });

export const emptySSOSettingsFormValues: SSOSettingsFormValues = {
  sso_provider: "",
  google_client_id: "",
  google_client_secret: "",
  microsoft_client_id: "",
  microsoft_client_secret: "",
  microsoft_tenant: "",
  generic_client_id: "",
  generic_client_secret: "",
  generic_authorization_endpoint: "",
  generic_token_endpoint: "",
  generic_userinfo_endpoint: "",
  user_email: "",
  proxy_base_url: "",
  default_role: "internal_user",
};

export const useSSOSettingsForm = (
  variant: SSOFormVariant,
  values?: SSOSettingsFormValues,
): UseFormReturn<SSOSettingsFormValues> =>
  useZodForm(buildSSOSettingsSchema(variant), {
    mode: "onChange",
    defaultValues: emptySSOSettingsFormValues,
    ...(values ? { values } : {}),
  });

const SSOProviderField = ({ field }: { field: SSOProviderConfig["fields"][number] }) => {
  const { control } = useFormContext<SSOSettingsFormValues>();

  if (field.type === "checkbox") {
    return (
      <FormField control={control} name={field.name} label={field.label} orientation="horizontal">
        {({ value, onChange, onBlur, id, ...rest }) => (
          <Checkbox
            id={id}
            checked={Boolean(value)}
            onCheckedChange={onChange}
            onBlur={onBlur}
            aria-invalid={rest["aria-invalid"]}
            aria-describedby={rest["aria-describedby"]}
          />
        )}
      </FormField>
    );
  }

  return (
    <FormField control={control} name={field.name} label={field.label}>
      {({ ref, value, ...rest }) => {
        const shared = { placeholder: field.placeholder, value: (value as string) ?? "", ...rest };
        if (field.type === "textarea") return <Textarea ref={ref} rows={4} {...shared} />;
        if (field.type === "password" || field.name.includes("client")) return <PasswordInput ref={ref} {...shared} />;
        return <Input ref={ref} {...shared} />;
      }}
    </FormField>
  );
};

export const renderProviderFields = (provider: string) => {
  const config = ssoProviderConfigs[provider];
  if (!config) return null;

  return config.fields.map((field) => <SSOProviderField key={field.name} field={field} />);
};

export const SSOProviderSelectField = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name="sso_provider" label={uiT("ui.c2d1900ec08d5ba3")}>
      {({ value, onChange, onBlur, id, ...rest }) => (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            onBlur={onBlur}
            aria-invalid={rest["aria-invalid"]}
            aria-describedby={rest["aria-describedby"]}
            className="w-full"
          >
            <SelectValue>{(provider: string) => (provider ? providerOptionLabel(provider) : "")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ssoProviderLogoMap).map(([optionValue, logo]) => (
              <SelectItem key={optionValue} value={optionValue}>
                <span className="flex items-center py-1">
                  {logo && (
                    <Logo
                      src={logo}
                      label={ssoProviderDisplayNames[optionValue] || optionValue}
                      className="h-6 w-6 mr-3 object-contain"
                    />
                  )}
                  <span>{providerOptionLabel(optionValue)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
};

export const ProxyAdminEmailField = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name="user_email" label={uiT("ui.7f2ab196532d9b59")}>
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

export const ProxyBaseUrlField = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name="proxy_base_url" label={uiT("ui.82b56622ef7ec48f")}>
      {({ ref, value, onChange, ...rest }) => (
        <Input
          ref={ref}
          placeholder="https://example.com"
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value.trim())}
          {...rest}
        />
      )}
    </FormField>
  );
};

export const MappingToggleField = ({
  name,
  label,
}: {
  name: "use_role_mappings" | "use_team_mappings";
  label: string;
}) => {
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name={name} label={label} orientation="horizontal">
      {({ value, onChange, onBlur, id, ...rest }) => (
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={onChange}
          onBlur={onBlur}
          aria-invalid={rest["aria-invalid"]}
          aria-describedby={rest["aria-describedby"]}
        />
      )}
    </FormField>
  );
};

export const GroupClaimField = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name="group_claim" label={uiT("ui.378aa2871b706de1")}>
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

const DEFAULT_ROLE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  {
    value: "internal_user_viewer",
    get label() {
      return translateUi("ui.fbaff5b3da83dc94");
    },
  },
  {
    value: "internal_user",
    get label() {
      return translateUi("ui.4a5a8d129e4b");
    },
  },
  {
    value: "proxy_admin_viewer",
    get label() {
      return translateUi("ui.fa769b182bc0c61d");
    },
  },
  {
    value: "proxy_admin",
    get label() {
      return translateUi("ui.a9d8d98fc06c");
    },
  },
];

const providerOptionLabel = (value: string) =>
  ssoProviderDisplayNames[value] || value.charAt(0).toUpperCase() + value.slice(1) + " SSO";

export const RoleMappingTeamFields = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <>
      <FormField control={control} name="default_role" label={uiT("ui.5bcfbd6bd78a")}>
        {({ value, onChange, onBlur, id, ...rest }) => (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger
              id={id}
              onBlur={onBlur}
              aria-invalid={rest["aria-invalid"]}
              aria-describedby={rest["aria-describedby"]}
              className="w-full"
            >
              <SelectValue>
                {(role: string) => DEFAULT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField control={control} name="proxy_admin_teams" label={uiT("ui.515288d6d12415b8")}>
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField control={control} name="admin_viewer_teams" label={uiT("ui.66b9e06fbf9f8954")}>
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField control={control} name="internal_user_teams" label={uiT("ui.c101d6aaf12648a7")}>
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField control={control} name="internal_viewer_teams" label={uiT("ui.83061f7ae1bfa7aa")}>
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>
    </>
  );
};

export const TeamIdsJwtFieldField = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name="team_ids_jwt_field" label={uiT("ui.5eeac1c989a710a1")}>
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

const BaseSSOSettingsForm: React.FC<BaseSSOSettingsFormProps> = ({ form, onFormSubmit }) => {
  const { t: uiT } = useDashboardLanguage();

  const provider = useWatch({ control: form.control, name: "sso_provider" });
  const useRoleMappings = useWatch({ control: form.control, name: "use_role_mappings" });
  const useTeamMappings = useWatch({ control: form.control, name: "use_team_mappings" });
  const showMappingToggles = supportsMappings(provider);

  return (
    <div>
      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitMountedSSOValues(form, "sso-settings", onFormSubmit)();
          }}
        >
          <FieldGroup>
            <SSOProviderSelectField />
            {provider ? renderProviderFields(provider) : null}
            <ProxyAdminEmailField />
            <ProxyBaseUrlField />
            {showMappingToggles && <MappingToggleField name="use_role_mappings" label={uiT("ui.7eddcdfb17de2879")} />}
            {useRoleMappings && showMappingToggles && (
              <>
                <GroupClaimField />
                <RoleMappingTeamFields />
              </>
            )}
            {showMappingToggles && <MappingToggleField name="use_team_mappings" label={uiT("ui.1d9e11d3f00e8b59")} />}
            {useTeamMappings && showMappingToggles && <TeamIdsJwtFieldField />}
          </FieldGroup>
        </form>
      </FormProvider>
    </div>
  );
};

export default BaseSSOSettingsForm;
