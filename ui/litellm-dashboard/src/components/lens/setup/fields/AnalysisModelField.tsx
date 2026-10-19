"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { analysisModelOptions, type ModelGate } from "./analysisModels";
import type { AnalysisModels } from "./useAnalysisModels";
import type { InvestigationInput } from "../investigationSchema";

export interface AnalysisModelFieldProps {
  readonly models: AnalysisModels;
  readonly gate: ModelGate;
}

export function AnalysisModelField({ models, gate }: AnalysisModelFieldProps) {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<InvestigationInput>();
  const model = useWatch({ control, name: "selectedModel" });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{uiT("ui.87c669f5de0c5c4e")}</p>
      <Controller
        control={control}
        name="selectedModel"
        render={({ field }) => (
          <SearchSelect
            aria-label={uiT("ui.87c669f5de0c5c4e")}
            options={analysisModelOptions(models.models, models.modelDetails)}
            value={field.value ?? ""}
            onValueChange={(value) => field.onChange(value ?? "")}
            placeholder={models.modelsLoading ? uiT("ui.cc8b4624f7659c68") : uiT("ui.78a7ab5e314ab1a5")}
            disabled={models.modelsLoading}
            emptyText={uiT("ui.9dce1124ee56de55")}
          />
        )}
      />
      {models.modelsError && (
        <p role="alert" className="text-sm text-destructive">
          {uiT("ui.89815fa78fb41e43")} {models.modelsError}
        </p>
      )}
      {gate.unavailable && (
        <p role="alert" className="text-sm text-destructive">
          {model} {uiT("ui.cecb499655bb23c7")}
        </p>
      )}
      {gate.unsupported && (
        <p role="alert" className="text-sm text-destructive">
          {uiT("ui.7b5000e5c51b0230")}
        </p>
      )}
    </div>
  );
}
