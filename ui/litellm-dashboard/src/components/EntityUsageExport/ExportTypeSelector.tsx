"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExportType, EntityType } from "./types";

interface ExportTypeSelectorProps {
  value: ExportType;
  onChange: (value: ExportType) => void;
  entityType: EntityType;
}

const ExportTypeSelector: React.FC<ExportTypeSelectorProps> = ({ value, onChange, entityType }) => {
  const { t: uiT } = useDashboardLanguage();

  const allScopes: { value: ExportType; title: string; description: string }[] = [
    {
      value: "daily",
      title: uiT("ui.f5ae5d71a6f75561", { v0: String(entityType) }),
      description: uiT("ui.1f0dfcab74a6a0e1", { v0: String(entityType) }),
    },
    {
      value: "daily_with_keys",
      title: uiT("ui.6981b628f0b1ef11", { v0: String(entityType) }),
      description: uiT("ui.dbce9876d3ab00a5", { v0: String(entityType) }),
    },
    {
      value: "daily_with_models",
      title: uiT("ui.2b2107f6c311c1d1", { v0: String(entityType) }),
      description: uiT("ui.bd96ebe33fc90f0c"),
    },
    {
      value: "daily_with_users",
      title: uiT("ui.286e2a6392cc2aa6", { v0: String(entityType) }),
      description: uiT("ui.e470888ff7f65585", { v0: String(entityType) }),
    },
  ];
  const scopes = allScopes.filter((scope) => scope.value !== "daily_with_users" || entityType !== "user");

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{uiT("ui.f17d9d9e3fcbb749")}</label>
      <RadioGroup value={value} onValueChange={(next) => onChange(next as ExportType)} className="gap-2">
        {scopes.map((scope) => (
          <label
            key={scope.value}
            className="flex items-start p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <RadioGroupItem value={scope.value} className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{scope.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{scope.description}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ExportTypeSelector;
