"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Switch } from "@/components/ui/switch";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const HousekeepingRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const enabled = value.route_housekeeping_to_cheapest_tier ?? true;
  const patterns = value.housekeeping_patterns ?? [];
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={(next) => onChange({ ...value, route_housekeeping_to_cheapest_tier: next })}
          aria-label={uiT("ui.41237de99345d723")}
        />
        <strong className="font-semibold">{uiT("ui.41237de99345d723")}</strong>
      </div>
      <span className="mb-3 block text-xs text-muted-foreground">{uiT("ui.9e54e20afafcd4e7")}</span>
      <strong className="mb-1 block font-semibold">{uiT("ui.429cdf18d521489b")}</strong>
      <MultiSelect
        options={patterns.map((pattern) => ({ label: pattern, value: pattern }))}
        value={patterns}
        onValueChange={(next) => onChange({ ...value, housekeeping_patterns: next.length > 0 ? next : undefined })}
        placeholder={uiT("ui.9f5856d5c9c944a6")}
        emptyText={uiT("ui.19cf9ba3084cd348")}
        allowCustomValues
        disabled={!enabled}
        className="w-full"
      />
      <span className="mt-1 block text-xs text-muted-foreground">
        {uiT("ui.c73c8fb709e1d122")}
        {!enabled && " Turn housekeeping routing on for these to take effect."}
      </span>
    </>
  );
};

export default HousekeepingRoutingControls;
