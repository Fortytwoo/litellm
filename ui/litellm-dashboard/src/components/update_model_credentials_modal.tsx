"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { modelPatchUpdateCall } from "./networking";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Alert, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";

const updateCredentialsSchema = z.object({
  api_key: z.string().min(1, "Enter a new API key"),
});

type UpdateCredentialsValues = z.infer<typeof updateCredentialsSchema>;

const EMPTY_VALUES: UpdateCredentialsValues = { api_key: "" };

interface UpdateModelCredentialsModalProps {
  open: boolean;
  onCancel: () => void;
  accessToken: string;
  modelId: string;
  onUpdated: () => void;
}

export default function UpdateModelCredentialsModal({
  open,
  onCancel,
  accessToken,
  modelId,
  onUpdated,
}: UpdateModelCredentialsModalProps) {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(updateCredentialsSchema, { defaultValues: EMPTY_VALUES });
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    form.reset(EMPTY_VALUES);
    onCancel();
  };

  const handleSubmit = async (values: UpdateCredentialsValues) => {
    const apiKey = values.api_key?.trim();
    if (!apiKey) {
      toast.fromError("Enter a new API key");
      return;
    }
    setIsSaving(true);
    try {
      await modelPatchUpdateCall(
        accessToken,
        { litellm_params: { api_key: apiKey }, model_info: { id: modelId } },
        modelId,
      );
      toast.success(translateUi("ui.abf784b9d79a6d7c"));
      form.reset(EMPTY_VALUES);
      onUpdated();
      onCancel();
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.fromError("Failed to update API key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.3cb3f696572cff3d")}</DialogTitle>
        </DialogHeader>
        <span className="block mb-4 text-sm text-muted-foreground">{uiT("ui.74c154758f2c61f4")}</span>
        <Alert variant="warning" className="mb-4">
          <TriangleAlert />
          <AlertTitle>{uiT("ui.89f642e3e0bbad0d")}</AlertTitle>
        </Alert>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <FormField control={form.control} name="api_key" label={uiT("ui.431b43ab89e7a6a7")}>
              {({ ref, ...field }) => (
                <PasswordInput
                  {...field}
                  ref={ref}
                  placeholder={uiT("ui.29eacc356152dd76")}
                  autoComplete="new-password"
                />
              )}
            </FormField>
          </FieldGroup>
          <div className="flex justify-end items-center mt-4 gap-2.5">
            <Button type="button" variant="outline" onClick={close}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <UiLoadingSpinner className="size-4" />}
              {uiT("ui.3cb3f696572cff3d")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
