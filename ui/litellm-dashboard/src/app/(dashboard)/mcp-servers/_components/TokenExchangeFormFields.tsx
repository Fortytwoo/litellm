"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useWatch } from "react-hook-form";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { selectControl, selectTriggerControl, tagsControl, textControl } from "./mcpFieldRules";

interface TokenExchangeFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const TOKEN_EXCHANGE_PROFILE_ITEMS = [
  {
    value: "rfc8693",
    get label() {
      return translateUi("ui.11c583ad2c0af2fc");
    },
  },
  {
    value: "entra_obo",
    get label() {
      return translateUi("ui.7fcc6c1d7f2959dc");
    },
  },
];

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const TokenExchangeFormFields: React.FC<TokenExchangeFormFieldsProps> = ({ isEditing = false }) => {
  const { t: uiT } = useDashboardLanguage();

  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const isEntraObo = useWatch({ name: "token_exchange_profile" }) === "entra_obo";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.d696a35bdd1883da")} tooltip={uiT("ui.d96ae77b74e5404a")} />}
        name="token_exchange_profile"
        {...(isEditing ? {} : { defaultValue: "rfc8693" })}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={TOKEN_EXCHANGE_PROFILE_ITEMS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOKEN_EXCHANGE_PROFILE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="font-medium">{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.3ba48bd0028802e0")} tooltip={uiT("ui.b3af0cde82ec057f")} />}
        name="token_exchange_endpoint"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://idp.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.8726db013948f070")} tooltip={uiT("ui.8126fd9067d946bf")} />}
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating("Client ID is required for token exchange")}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.955e3aa90dfe35e7", { v0: String(placeholderSuffix) })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.ae21cf6d24b8ca46")} tooltip={uiT("ui.0119b14a5591c203")} />}
        name={["credentials", "client_secret"]}
        required={!isEditing}
        rules={requiredWhenCreating("Client Secret is required for token exchange")}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.6e151f13f14c3024", { v0: String(placeholderSuffix) })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      {!isEntraObo && (
        <>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.c007a2b98203a7ad")} tooltip={uiT("ui.b4ed6260589b692b")} />}
            name="audience"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.7e7c6c142ed71283")} tooltip={uiT("ui.8972f059e4dd0936")} />}
            name="subject_token_type"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder={uiT("ui.12d94a5574190a82")} className={fieldClassName} />
            )}
          </MountedFormField>
        </>
      )}
      <MountedFormField
        label={
          <FieldLabel
            label={isEntraObo ? uiT("ui.0d5644ff52ce2ba3") : uiT("ui.f4d09ff950d6c0e1")}
            tooltip={isEntraObo ? uiT("ui.fda839f248f2c424") : uiT("ui.e8d0cf698dcf43ac")}
          />
        }
        name={["credentials", "scopes"]}
        required={isEntraObo}
        rules={
          isEntraObo
            ? {
                validate: {
                  required: requiredRule("Microsoft Entra OBO requires a scope, e.g. api://<app-id>/.default"),
                },
              }
            : undefined
        }
      >
        {(control) => (
          <MultiSelect
            {...tagsControl(control)}
            placeholder={isEntraObo ? uiT("ui.7c1347508212dd27") : uiT("ui.f4426894f89e20f7")}
            className="rounded-lg"
          />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default TokenExchangeFormFields;
