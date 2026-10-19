"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { z } from "zod";

import { useCloudZeroCreate } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroCreate";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";

import { CloudZeroApiKeyInput, labelWithHint } from "./CloudZeroFormControls";
import { buildCloudZeroPayload, EMPTY_CLOUDZERO_FORM_VALUES, type CloudZeroFormValues } from "./cloudZeroPayload";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloudZeroCreationModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
}

const createSchema = z.object({
  api_key: z.string().min(1, "Please enter your CloudZero API key"),
  connection_id: z.string().min(1, "Please enter your CloudZero connection ID"),
  timezone: z.string(),
});

export default function CloudZeroCreationModal({ open, onOk, onCancel }: CloudZeroCreationModalProps) {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const form = useZodForm(createSchema, { defaultValues: EMPTY_CLOUDZERO_FORM_VALUES });
  const createMutation = useCloudZeroCreate(accessToken || "");

  useEffect(() => {
    if (open) {
      form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
    }
  }, [open, form]);

  const handleSubmit = (values: CloudZeroFormValues) => {
    createMutation.mutate(buildCloudZeroPayload(values), {
      onSuccess: () => {
        toast.success(translateUi("ui.de9b5067856fb1e3"));
        form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
        onOk();
      },
      onError: (error: Error) => {
        toast.error(error.message || translateUi("ui.bd5267b3714b4f81"));
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
          <DialogTitle>{uiT("ui.ee2bf34d70f5cba4")}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            <FieldGroup>
              <FormField control={form.control} name="api_key" label={uiT("ui.ddd319b68c840b74")}>
                {({ ref, ...field }) => (
                  <CloudZeroApiKeyInput {...field} ref={ref} placeholder={uiT("ui.3c6f2a7255c5de7f")} />
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
          <Button variant="outline" onClick={handleCancel} disabled={createMutation.isPending}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button
            onClick={() => void form.handleSubmit(handleSubmit)()}
            disabled={createMutation.isPending}
            aria-busy={createMutation.isPending}
          >
            {createMutation.isPending ? uiT("ui.def70944c9bb") : uiT("ui.4759498ac2a7")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
