"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CircleAlert, Info } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { cn } from "@/lib/cva.config";
import { useZodForm } from "@/lib/forms/useZodForm";

type OnboardingFormBodyProps = {
  variant: "signup" | "reset_password";
  userEmail: string;
  isPending: boolean;
  claimError: string | null;
  onSubmit: (values: { password: string }) => void;
};

const onboardingSchema = z.object({
  password: z.string().min(1, "password required to sign up"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function OnboardingFormBody({ variant, userEmail, isPending, claimError, onSubmit }: OnboardingFormBodyProps) {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(onboardingSchema, { defaultValues: { password: "" } });
  const emailFieldId = React.useId();
  const isResetPassword = variant === "reset_password";
  const actionLabel = isResetPassword ? "Reset Password" : "Sign Up";

  const handleSubmit = (values: OnboardingFormValues) => onSubmit({ password: values.password });

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Card>
        <CardContent>
          <h5 className="text-center mb-5 text-base font-semibold text-foreground">{uiT("ui.118fffb377c529a3")}</h5>
          <h3 className="text-2xl font-semibold text-foreground">{translateText(actionLabel)}</h3>
          <p className="text-sm text-foreground">
            {isResetPassword ? uiT("ui.91de3a572736fd87") : uiT("ui.0d594ea3979d87cb")}
          </p>

          {variant === "signup" && (
            <Alert className="mt-4" variant="info">
              <Info />
              <AlertTitle>SSO</AlertTitle>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>{uiT("ui.28ecefeaef1069e9")}</span>
                  <a
                    className={cn(buttonVariants({ size: "sm" }))}
                    href="https://forms.gle/W3U4PZpJGFHWtHyA9"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {uiT("ui.dace4cae407d5a99")}
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form className="mt-10 mb-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={emailFieldId}>{uiT("ui.09bf25ef30833633")}</FieldLabel>
                <Input id={emailFieldId} type="email" value={userEmail} readOnly disabled />
              </Field>

              <FormField
                control={form.control}
                name="password"
                label={uiT("ui.e7cf3ef4f17c")}
                description={isResetPassword ? uiT("ui.606e3c1f2d8ac29a") : uiT("ui.3a64b370a8a4cd09")}
              >
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} />}
              </FormField>
            </FieldGroup>

            {claimError && (
              <Alert variant="error" className="mt-6 mb-4">
                <CircleAlert />
                <AlertTitle>{claimError}</AlertTitle>
              </Alert>
            )}

            <div className="mt-10">
              <Button type="submit" variant="outline" disabled={isPending}>
                {isPending && (
                  <UiLoadingSpinner className="size-4" role="img" aria-label={uiT("ui.b4a070a2d341940c")} />
                )}
                {translateText(actionLabel)}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
