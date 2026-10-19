"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { requiredWhenSiblingSet, textControl } from "./mcpFieldRules";

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const ACCESS_KEY_PATH = ["credentials", "aws_access_key_id"] as const;
const SECRET_KEY_PATH = ["credentials", "aws_secret_access_key"] as const;

const AwsSigV4Fields: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <p className="text-sm text-muted-foreground mb-2">
        {uiT("ui.6700678caccc5f48")}{" "}
        <a
          href="https://docs.litellm.ai/docs/mcp_aws_sigv4"
          target="_blank"
          rel="noopener noreferrer"
          className="text-info hover:text-info/80"
        >
          {uiT("ui.11e81a4ed9365eb5")}
        </a>
      </p>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.7e489ee639b80be4")} tooltip={uiT("ui.1b8c171b501e0d27")} />}
        name={["credentials", "aws_region_name"]}
        required
        rules={{ validate: { required: requiredRule("AWS region is required for SigV4 auth") } }}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.487d653406a6aebc")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.6c01c8104063b756")} tooltip={uiT("ui.904a468569cbd86e")} />}
        name={["credentials", "aws_service_name"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="bedrock-agentcore" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.d94af1632f735c9f")} tooltip={uiT("ui.29f8c64376f402f2")} />}
        name={ACCESS_KEY_PATH}
        rules={{
          deps: ["credentials.aws_secret_access_key"],
          validate: {
            pairedWithSecret: requiredWhenSiblingSet(
              SECRET_KEY_PATH,
              "Access Key ID is required when Secret Access Key is provided",
            ),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.0c897ca22f3bac1e")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.17348d774f151a4a")} tooltip={uiT("ui.a2a06b25f60332c0")} />}
        name={SECRET_KEY_PATH}
        rules={{
          deps: ["credentials.aws_access_key_id"],
          validate: {
            pairedWithAccessKey: requiredWhenSiblingSet(
              ACCESS_KEY_PATH,
              "Secret Access Key is required when Access Key ID is provided",
            ),
          },
        }}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.60eef0ccf8b8449f")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.e4e2473980cbb84e")} tooltip={uiT("ui.0b544daf4d2b0491")} />}
        name={["credentials", "aws_session_token"]}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={uiT("ui.f5b526d43469549d")}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.9e0560e3604828b7")} tooltip={uiT("ui.eedd57cd0ea9e2fe")} />}
        name={["credentials", "aws_role_name"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.8399f8958e0adb36")} className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.d238c30b2366ce5c")} tooltip={uiT("ui.a411b1da7a64b4fc")} />}
        name={["credentials", "aws_session_name"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder={uiT("ui.fbde12ad75defd9d")} className={fieldClassName} />
        )}
      </MountedFormField>
    </>
  );
};

export default AwsSigV4Fields;
