"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const fields = [
  ["code_keywords", "Code keywords"],
  ["reasoning_keywords", "Reasoning keywords"],
  ["technical_keywords", "Technical keywords"],
  ["simple_keywords", "Simple keywords"],
] as const;

const HeuristicKeywordOverrides: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{uiT("ui.ef91be55cf1c80ce")}</p>
      {fields.map(([key, label]) => {
        const keywords = value[key] ?? [];
        return (
          <div key={key}>
            <strong className="mb-1 block font-semibold">{label}</strong>
            <MultiSelect
              options={keywords.map((keyword) => ({ label: keyword, value: keyword }))}
              value={keywords}
              onValueChange={(next) => onChange({ ...value, [key]: next.length > 0 ? next : undefined })}
              placeholder={uiT("ui.b69dceff3cf83afd", { v0: String(label.toLowerCase()) })}
              emptyText={uiT("ui.7635c2806654fb2d")}
              allowCustomValues
              className="w-full"
            />
          </div>
        );
      })}
    </div>
  );
};

export default HeuristicKeywordOverrides;
