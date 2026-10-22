"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { DurationInput } from "@/components/shared/DurationInput";
import type { InvestigationInput } from "../investigationSchema";
import { AnalysisModelField, type AnalysisModelFieldProps } from "./AnalysisModelField";

export function RunFields({ models, gate }: AnalysisModelFieldProps) {
  const { t: uiT } = useDashboardLanguage();

  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<InvestigationInput>();
  const repeat = useWatch({ control, name: "repeat" });
  return (
    <>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="size-4 rounded border-input accent-foreground" {...register("repeat")} />
          {uiT("ui.a9cfc27b9827ab57")}
        </label>
        {repeat && (
          <Controller
            control={control}
            name="interval"
            render={({ field }) => (
              <DurationInput
                label={uiT("ui.a0b9aa23865d3a8f")}
                value={field.value}
                onChange={field.onChange}
                base="minutes"
              />
            )}
          />
        )}
        {errors.interval?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.interval.message}
          </p>
        )}
      </div>
      <details open={!gate.modelValid || undefined}>
        <summary className="cursor-pointer text-sm font-medium">{uiT("ui.9443ff69463ef46b")}</summary>
        <div className="mt-4 space-y-5">
          <AnalysisModelField models={models} gate={gate} />
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid content-start gap-2 text-sm font-medium">
              {uiT("ui.c9b788259011e66d")}
              <Input
                {...register("selection.sample_size", {
                  setValueAs: (value: unknown) => (value == null || value === "" ? null : Number(value)),
                })}
                type="number"
                min="1"
                placeholder={uiT("ui.f7fcff0d8feaf039")}
              />
              {errors.selection?.sample_size?.message && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.selection.sample_size.message}
                </p>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("manualSelection", {
                  onChange: () => setValue("selection.execution_ids", [], { shouldValidate: true }),
                })}
              />
              {uiT("ui.443b29db47946a62")}
            </label>
          </div>
          {errors.selection?.execution_ids?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.selection.execution_ids.message}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid content-start gap-2 text-sm font-medium">
              {uiT("ui.4d4578b6f9235495")}
              <Input {...register("budget", { valueAsNumber: true })} type="number" min="0.01" step="any" />
              {errors.budget?.message && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.budget.message}
                </p>
              )}
            </label>
          </div>
        </div>
      </details>
    </>
  );
}
