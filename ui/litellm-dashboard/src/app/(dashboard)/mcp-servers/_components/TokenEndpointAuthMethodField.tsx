"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { Info } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { selectControl, selectTriggerControl } from "./mcpFieldRules";

const TOKEN_ENDPOINT_AUTH_METHOD_OPTIONS = [
  {
    value: "client_secret_basic",
    get label() {
      return translateUi("ui.0cf0588040ef8c45");
    },
  },
  {
    value: "client_secret_post",
    get label() {
      return translateUi("ui.5ccd008275fec84a");
    },
  },
];

interface TokenEndpointAuthMethodFieldProps {
  isEditing?: boolean;
}

const TokenEndpointAuthMethodField: React.FC<TokenEndpointAuthMethodFieldProps> = ({ isEditing = false }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <MountedFormField
      label={
        <span className="text-sm font-medium text-foreground flex items-center">
          {uiT("ui.902cf613f120b0ab")}
          <SimpleTooltip content={uiT("ui.ca2133829a8678f6")}>
            <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
          </SimpleTooltip>
        </span>
      }
      name={["credentials", "token_endpoint_auth_method"]}
    >
      {(control) => {
        const placeholder = isEditing
          ? "Leave blank to keep existing (default Client Secret Post)"
          : "Default (Client Secret Post)";
        return (
          <Select {...selectControl<string>(control)} items={TOKEN_ENDPOINT_AUTH_METHOD_OPTIONS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>{translateText(placeholder)}</SelectItem>
              {TOKEN_ENDPOINT_AUTH_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    </MountedFormField>
  );
};

export default TokenEndpointAuthMethodField;
