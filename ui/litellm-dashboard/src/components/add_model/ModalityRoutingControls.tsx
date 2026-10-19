"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";

import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

export const ModalityRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const modalityRouting = value.modality_routing ?? false;
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={modalityRouting}
          onCheckedChange={(nextModalityRouting) => onChange({ ...value, modality_routing: nextModalityRouting })}
          aria-label={uiT("ui.2db699d4dbc6a7af")}
        />
        <strong className="font-semibold">{uiT("ui.2db699d4dbc6a7af")}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">{uiT("ui.df6901913b39e322")}</span>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.modality_pin_override ?? false}
          onCheckedChange={(modalityPinOverride) => onChange({ ...value, modality_pin_override: modalityPinOverride })}
          disabled={!modalityRouting}
          aria-label={uiT("ui.979f8cc2b58c5ba1")}
        />
        <strong className="font-semibold">{uiT("ui.979f8cc2b58c5ba1")}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">{uiT("ui.211326c1334a5b1e")}</span>
    </>
  );
};
