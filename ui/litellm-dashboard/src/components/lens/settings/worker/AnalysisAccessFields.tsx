"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Controller, useFormContext } from "react-hook-form";
import { lensQueries } from "../../data/queries";

import { useQuery } from "@tanstack/react-query";
import { useLensApi } from "../../data/LensServices";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Input } from "@/components/ui/input";
import type { WorkerFormInput } from "./workerSchema";

export function AnalysisAccessFields() {
  const { t: uiT } = useDashboardLanguage();

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<WorkerFormInput>();
  const api = useLensApi();
  const models = useQuery(lensQueries.models(api));
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="analysis-access-model" className="block text-sm font-medium">
          {uiT("ui.87c669f5de0c5c4e")}
        </label>
        <Controller
          control={control}
          name="access.model"
          render={({ field }) => (
            <SearchSelect
              inputId="analysis-access-model"
              options={(models.data?.data ?? []).map(({ id }) => ({ label: id, value: id }))}
              value={field.value}
              onValueChange={field.onChange}
              placeholder={models.isLoading ? uiT("ui.cc8b4624f7659c68") : uiT("ui.fad7a5ffc4902bc2")}
            />
          )}
        />
        {errors.access?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.access.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="analysis-access-budget" className="block text-sm font-medium">
          {uiT("ui.4d4578b6f9235495")}
        </label>
        <Input {...register("access.budget")} id="analysis-access-budget" type="number" min="0.01" step="0.01" />
        <p className="text-xs text-muted-foreground">{uiT("ui.39d0cf59d73bea78")}</p>
      </div>
      {models.error && (
        <p role="alert" className="text-sm text-destructive">
          {models.error.message}
        </p>
      )}
    </div>
  );
}
