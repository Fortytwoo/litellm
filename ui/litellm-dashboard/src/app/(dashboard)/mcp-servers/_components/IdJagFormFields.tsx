"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requiredUnlessSiblingSet, tagsControl, textControl } from "./mcpFieldRules";

interface IdJagFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const PRIVATE_KEY_PATH = ["credentials", "client_private_key"] as const;

const IdJagFormFields: React.FC<IdJagFormFieldsProps> = ({ isEditing = false }) => {
  const { t: uiT } = useDashboardLanguage();

  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.a8f03b7a2a8201ef")} tooltip={uiT("ui.78e034473ff14ecf")} />}
        name="token_exchange_endpoint"
        required={!isEditing}
        rules={requiredWhenCreating("The org token endpoint is required for ID-JAG")}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://your-org.okta.com/oauth2/v1/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.8a3ae4981447adc3")} tooltip={uiT("ui.0977474fd1921db4")} />}
        name={["credentials", "id_jag_resource_token_endpoint"]}
        required={!isEditing}
        rules={requiredWhenCreating("The resource token endpoint is required for ID-JAG")}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://upstream.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.8726db013948f070")} tooltip={uiT("ui.b748db3110e8a06f")} />}
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating("Client ID is required for ID-JAG")}
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
        label={<FieldLabel label={uiT("ui.ae21cf6d24b8ca46")} tooltip={uiT("ui.fcb01d935e74f12b")} />}
        name={["credentials", "client_secret"]}
        rules={
          isEditing
            ? undefined
            : {
                deps: ["credentials.client_private_key"],
                validate: {
                  secretOrPrivateKey: requiredUnlessSiblingSet(
                    PRIVATE_KEY_PATH,
                    "Provide either a client secret or a client private key",
                  ),
                },
              }
        }
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.6e151f13f14c3024", { v0: String(placeholderSuffix) })}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.7596f1fa1d0317ee")} tooltip={uiT("ui.e2f4048bfe003ddc")} />}
        name={PRIVATE_KEY_PATH}
      >
        {(control) => (
          <Textarea
            {...textControl(control)}
            rows={3}
            placeholder={uiT("ui.800b41ad20937cb4", { v0: String(placeholderSuffix) })}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.4cc5f76cdaf217a0")} tooltip={uiT("ui.406bdb8f14125316")} />}
        name={["credentials", "client_private_key_id"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.4189ceeb05630baa")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.2fcb524fc5aa1a33")} tooltip={uiT("ui.effd20afce1af5b0")} />}
        name={["credentials", "client_assertion_signing_alg"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.72b885d85336f6b4")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.c007a2b98203a7ad")} tooltip={uiT("ui.4e303866bf5b6842")} />}
        name="audience"
      >
        {(control) => (
          <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.e1bf731a2a4aaac7")} tooltip={uiT("ui.39f00af229a69f86")} />}
        name={["credentials", "id_jag_resource"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder="https://upstream.example.com/mcp" className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.7e7c6c142ed71283")} tooltip={uiT("ui.d76813956d3fea7e")} />}
        name="subject_token_type"
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.bf3728e2a202a759")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.f4d09ff950d6c0e1")} tooltip={uiT("ui.79c26a78b643a4dd")} />}
        name={["credentials", "scopes"]}
      >
        {(control) => (
          <MultiSelect {...tagsControl(control)} placeholder={uiT("ui.f4426894f89e20f7")} className="rounded-lg" />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default IdJagFormFields;
