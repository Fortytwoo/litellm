"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import React from "react";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const ResponseFormatControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.return_raw_model_name ?? false}
          onCheckedChange={(returnRawModelName) => onChange({ ...value, return_raw_model_name: returnRawModelName })}
          aria-label={uiT("ui.d011b6f1cf940be8")}
        />
        <strong className="font-semibold">{uiT("ui.d011b6f1cf940be8")}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">{uiT("ui.55f96384469cadbe")}</span>
      <div className="mt-4 flex items-center gap-2 mb-2">
        <Switch
          checked={value.max_tokens_from_tier_model ?? true}
          onCheckedChange={(enabled) => onChange({ ...value, max_tokens_from_tier_model: enabled })}
          aria-label={uiT("ui.1419a8569a1183e8")}
        />
        <strong className="font-semibold">{uiT("ui.1419a8569a1183e8")}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">{uiT("ui.a9dbb7d2d3c0f0c1")}</span>
    </>
  );
};

export default ResponseFormatControls;
