"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { textControl } from "./mcpFieldRules";

const UpstreamTokenHeaderField: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <MountedFormField
      label={
        <span className="text-sm font-medium text-foreground flex items-center">
          {uiT("ui.deea90c85bea0e63")}
          <SimpleTooltip content={uiT("ui.a89bb6b9db347d4d")}>
            <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
          </SimpleTooltip>
        </span>
      }
      name={["credentials", "upstream_token_header"]}
    >
      {(control) => (
        <Input
          {...textControl(control)}
          placeholder="Authorization"
          className="rounded-lg border-border focus:border-info focus:ring-ring"
        />
      )}
    </MountedFormField>
  );
};

export default UpstreamTokenHeaderField;
