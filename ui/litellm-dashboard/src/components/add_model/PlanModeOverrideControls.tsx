"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/shared/MultiSelect";
import TierRowSelect from "./TierRowSelect";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const PlanModeOverrideControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  planModeTierOptions: { value: string; label: string }[];
}> = ({ value, onChange, planModeTierOptions }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.plan_mode_min_tier !== undefined}
          disabled={planModeTierOptions.length === 0}
          onCheckedChange={(enabled) =>
            onChange({
              ...value,
              plan_mode_min_tier: enabled ? planModeTierOptions.at(-1)?.value : undefined,
            })
          }
          aria-label={uiT("ui.b8333af3d9cd9f03")}
        />
        <strong className="font-semibold">{uiT("ui.b8333af3d9cd9f03")}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {uiT("ui.0214d6a639fc5b3c")}
        {planModeTierOptions.length === 0 && " Add models to a tier to enable this."}
      </span>
      {value.plan_mode_min_tier !== undefined && (
        <div style={{ maxWidth: 320 }}>
          <TierRowSelect
            label={uiT("ui.327420f9106c1b27")}
            options={planModeTierOptions}
            value={value.plan_mode_min_tier ?? null}
            onValueChange={(tier) => onChange({ ...value, plan_mode_min_tier: tier })}
          />
        </div>
      )}
      <div className="mt-4">
        <strong className="mb-1 block font-semibold">{uiT("ui.6d1167e0df2ee6c8")}</strong>
        <MultiSelect
          options={(value.plan_mode_patterns ?? []).map((pattern) => ({ label: pattern, value: pattern }))}
          value={value.plan_mode_patterns ?? []}
          onValueChange={(patterns) =>
            onChange({ ...value, plan_mode_patterns: patterns.length > 0 ? patterns : undefined })
          }
          placeholder={uiT("ui.f35e496602860b9f")}
          emptyText={uiT("ui.19cf9ba3084cd348")}
          allowCustomValues
          className="w-full"
        />
        <span className="mt-1 block text-xs text-muted-foreground">{uiT("ui.e485827f33ad7df3")}</span>
      </div>
    </>
  );
};

export default PlanModeOverrideControls;
