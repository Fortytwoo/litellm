"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { switchControl, tagsControl, textControl } from "./mcpFieldRules";

const AUTH_HEADER_FORMATS: Readonly<Record<string, string>> = {
  bearer_token: "Authorization: Bearer {key}",
  token: "Authorization: token {key}",
  api_key: "x-api-key: {key}",
  basic: "Authorization: Basic {key}",
  authorization: "Authorization: {key}",
};

const OpenApiByokFields: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const isByok = Boolean(useWatch({ name: "is_byok" }));
  const authType = useWatch({ name: "auth_type" }) as string | undefined;
  const hasAuthType = Boolean(authType) && authType !== "none";

  return (
    <>
      <MountedFormField
        label={
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            {uiT("ui.d2785200b5225788")}
            <SimpleTooltip content={uiT("ui.f18461316f2af849")}>
              <Info className="size-4 text-info hover:text-info/80 cursor-help" />
            </SimpleTooltip>
          </span>
        }
        name="is_byok"
      >
        {(control) => <Switch {...switchControl(control)} />}
      </MountedFormField>

      {isByok && (
        <>
          {hasAuthType && (
            <div className="mb-4 p-3 bg-info/10 rounded-lg text-sm text-info flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                {uiT("ui.945e42fcc4dc1e41")}{" "}
                <code className="font-mono bg-info/15 px-1 rounded-sm">
                  {authType === undefined ? "" : AUTH_HEADER_FORMATS[authType]}
                </code>
              </span>
            </div>
          )}
          {!authType && (
            <div className="mb-4 p-3 bg-warning/10 rounded-lg text-sm text-warning flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                {uiT("ui.0c4aef9f2fba18cf")} <strong>{uiT("ui.53c90adec54ba399")}</strong> {uiT("ui.07ba8fc1150f590b")}
              </span>
            </div>
          )}
          <MountedFormField
            label={
              <span className="text-sm font-medium text-foreground">
                {uiT("ui.a45621819df344a5")}
                <SimpleTooltip content={uiT("ui.1d35a5b765b76255")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
            }
            name="byok_description"
          >
            {(control) => (
              <MultiSelect {...tagsControl(control)} placeholder={uiT("ui.009e1b576c77ea9c")} className="w-full" />
            )}
          </MountedFormField>

          <MountedFormField
            label={
              <span className="text-sm font-medium text-foreground">
                {uiT("ui.cbb883424f0cd3dc")}
                <SimpleTooltip content={uiT("ui.ad4a6e9e708f808b")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
            }
            name="byok_api_key_help_url"
          >
            {(control) => <Input {...textControl(control)} placeholder="https://docs.example.com/api-keys" />}
          </MountedFormField>
        </>
      )}
    </>
  );
};

export default OpenApiByokFields;
