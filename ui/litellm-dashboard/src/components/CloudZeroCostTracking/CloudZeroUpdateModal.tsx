"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { z } from "zod";

import { useCloudZeroUpdateSettings } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";

import { CloudZeroApiKeyInput, labelWithHint } from "./CloudZeroFormControls";
import { buildCloudZeroPayload, EMPTY_CLOUDZERO_FORM_VALUES, type CloudZeroFormValues } from "./cloudZeroPayload";
import { CloudZeroSettings } from "./types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloudZeroUpdateModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  settings: CloudZeroSettings;
}

const updateSchema = z.object({
  api_key: z.string(),
  connection_id: z.string().min(1, "Please enter your CloudZero connection ID"),
  timezone: z.string(),
});

export default function CloudZeroUpdateModal({ open, onOk, onCancel, settings }: CloudZeroUpdateModalProps) {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const form = useZodForm(updateSchema, { defaultValues: EMPTY_CLOUDZERO_FORM_VALUES });
  const updateMutation = useCloudZeroUpdateSettings(accessToken || "");

  useEffect(() => {
    if (open && settings) {
      form.reset({
        connection_id: settings.connection_id ?? "",
        timezone: settings.timezone || "UTC",
        api_key: "",
      });
    } else if (open) {
      form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
    }
  }, [open, settings, form]);

  const handleSubmit = (values: CloudZeroFormValues) => {
    updateMutation.mutate(buildCloudZeroPayload(values), {
      onSuccess: () => {
        toast.success(translateUi("ui.ab7f2a093525a95e"));
        form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
        onOk();
      },
      onError: (error: Error) => {
        toast.error(error.message || translateUi("ui.6d4050f4ee6182c1"));
      },
    });
  };

  const handleCancel = () => {
    form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{uiT("ui.5ce42145ad96882c")}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            <FieldGroup>
              <FormField
                control={form.control}
                name="api_key"
                label={labelWithHint("CloudZero API Key", "Leave empty to keep the existing API key")}
              >
                {({ ref, ...field }) => (
                  <CloudZeroApiKeyInput {...field} ref={ref} placeholder={uiT("ui.7b1185101ff56048")} />
                )}
              </FormField>
              <FormField control={form.control} name="connection_id" label={uiT("ui.f8ca8ad99b78ad5d")}>
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={uiT("ui.3d5b23ee264ab0e9")} />}
              </FormField>
              <FormField
                control={form.control}
                name="timezone"
                label={labelWithHint("Timezone", "Timezone for date handling (defaults to UTC if not provided)")}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="UTC" />}
              </FormField>
            </FieldGroup>
          </form>
        </TooltipProvider>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button
            onClick={() => void form.handleSubmit(handleSubmit)()}
            disabled={updateMutation.isPending}
            aria-busy={updateMutation.isPending}
          >
            {updateMutation.isPending ? uiT("ui.0a4e0b71b7f35837") : uiT("ui.c1c1009d3f37ec05")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
