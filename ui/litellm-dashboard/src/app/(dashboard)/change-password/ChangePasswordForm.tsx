"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";
import { CircleAlert } from "lucide-react";
import { z } from "zod";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Alert, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { changePasswordCall, getProxyBaseUrl } from "@/components/networking";
import { extractProxyErrorMessage } from "@/lib/http/client";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";
import { revokeSessionAndClearClientState } from "@/app/(dashboard)/hooks/useLogout";
import { getLoginUrl } from "@/utils/returnUrlUtils";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(1, "New password is required"),
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    get message() {
      return translateUi("ui.c7d087ef477aaf9f");
    },
    path: ["confirmNewPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken, passwordResetRequired } = useAuthorized();
  const form = useZodForm(changePasswordSchema, {
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: ChangePasswordValues) => {
    if (!accessToken) return;
    setSubmitError(null);
    setIsPending(true);
    try {
      await changePasswordCall(accessToken, values.currentPassword, values.newPassword);
      if (passwordResetRequired) {
        // The session key was minted restricted; only a fresh login lifts it.
        // Revoke it server-side too (best-effort) so it doesn't sit valid
        // until the expiry reaper gets to it.
        toast.success(translateUi("ui.49327bc5b2a9fbb6"));
        await revokeSessionAndClearClientState(accessToken);
        window.location.replace(getLoginUrl(getProxyBaseUrl()));
        return;
      }
      toast.success(translateUi("ui.836b6b9bf46c1ebf"));
      form.reset();
    } catch (error) {
      setSubmitError(extractProxyErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <Card>
        <CardContent>
          <h3 className="text-2xl font-semibold text-foreground">{uiT("ui.a949f4623074")}</h3>
          <p className="text-sm text-muted-foreground">{uiT("ui.652b063b975c726e")}</p>

          {passwordResetRequired && (
            <Alert variant="warning" className="mt-4">
              <CircleAlert />
              <AlertTitle>{uiT("ui.babbbbb220eaf361")}</AlertTitle>
            </Alert>
          )}

          <form className="mb-2 mt-8" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <FormField control={form.control} name="currentPassword" label={uiT("ui.8ac76099cc6666b3")}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="current-password" />}
              </FormField>

              <FormField control={form.control} name="newPassword" label={uiT("ui.7c451e0f436d")}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="new-password" />}
              </FormField>

              <FormField control={form.control} name="confirmNewPassword" label={uiT("ui.642776c02c0d14a0")}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="new-password" />}
              </FormField>
            </FieldGroup>

            {submitError && (
              <Alert variant="error" className="mt-6">
                <CircleAlert />
                <AlertTitle>{submitError}</AlertTitle>
              </Alert>
            )}

            <div className="mt-8">
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <UiLoadingSpinner className="size-4" role="img" aria-label={uiT("ui.b4a070a2d341940c")} />
                )}
                {uiT("ui.a949f4623074")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChangePasswordForm;
