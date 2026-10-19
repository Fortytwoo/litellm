"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { z } from "zod";
import { Controller } from "react-hook-form";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DurationInput } from "@/components/shared/DurationInput";
import { type Settings } from "../model/types";

const monitoringSchema = z.object({
  interval_minutes: z.number().int().min(1),
});

export function MonitoringDialog({
  settings,
  ready,
  onSave,
  onClose,
}: {
  settings: Settings;
  ready: boolean;
  onSave: (settings: Settings) => Promise<void>;
  onClose: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [error, setError] = useState("");
  const form = useZodForm(monitoringSchema, {
    defaultValues: { interval_minutes: settings.interval_minutes ?? 30 },
    mode: "onChange",
  });
  const { formState, control } = form;
  const save = form.handleSubmit(async ({ interval_minutes }) => {
    setError("");
    try {
      await onSave({ ...settings, enabled: true, interval_minutes });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not enable monitoring");
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !formState.isSubmitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{uiT("ui.23d90d915f8d2ec6")}</DialogTitle>
          <DialogDescription>{uiT("ui.78d86f919cc36045")}</DialogDescription>
        </DialogHeader>
        <Controller
          control={control}
          name="interval_minutes"
          render={({ field }) => (
            <DurationInput
              label={uiT("ui.a0b9aa23865d3a8f")}
              value={field.value}
              onChange={field.onChange}
              base="minutes"
            />
          )}
        />
        {formState.errors.interval_minutes?.message && (
          <p role="alert" className="text-sm text-destructive">
            {formState.errors.interval_minutes.message}
          </p>
        )}
        <p className="text-xs leading-5 text-muted-foreground">{uiT("ui.43cc8a53d031ebb6")}</p>
        {!ready && (
          <p role="status" className="text-sm text-warning">
            {uiT("ui.09548f3de5f6be17")}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button disabled={!formState.isValid || formState.isSubmitting || !ready} onClick={() => void save()}>
            {formState.isSubmitting ? uiT("ui.23e39291d6135814") : uiT("ui.8015a9029681f303")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
