"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";

import { DurationInput } from "@/components/shared/DurationInput";
import type { InvestigationInput } from "../investigationSchema";

export function SampleFields() {
  const { t: uiT } = useDashboardLanguage();

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvestigationInput>();
  return (
    <>
      <Controller
        control={control}
        name="selection.lookback_hours"
        render={({ field }) => (
          <DurationInput
            label={uiT("ui.d00a21bb8c82828c")}
            value={field.value ?? 24}
            base="hours"
            onChange={field.onChange}
          />
        )}
      />
      {errors.selection?.lookback_hours?.message && (
        <p role="alert" className="text-sm text-destructive">
          {errors.selection.lookback_hours.message}
        </p>
      )}
      <label className="grid gap-2 text-sm">
        {uiT("ui.f05a7282809edf6f")}
        <Input
          {...register("selection.sample_percent", { valueAsNumber: true })}
          type="number"
          min="0.01"
          max="100"
          step="any"
        />
        {errors.selection?.sample_percent?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.selection.sample_percent.message}
          </p>
        )}
      </label>
    </>
  );
}
