"use client";
import { t as translateUi } from "@/i18n";

import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useCallback, useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGuardrailCall, getGuardrailsList } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";
import {
  buildCompressionGuardrailPayload,
  compressionGuardrailsOf,
  GuardrailListItem,
  GuardrailListResponse,
} from "./helpers";

interface PromptCompressionTabProps {
  accessToken: string | null;
}

const compressionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  apiBase: z.string().min(1, "API base is required"),
  defaultOn: z.boolean(),
});

type CompressionFormValues = z.infer<typeof compressionSchema>;

const EMPTY_VALUES: CompressionFormValues = {
  name: "",
  apiBase: "",
  defaultOn: true,
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    <LocalizedText>{label}</LocalizedText>
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>
        <LocalizedText>{hint}</LocalizedText>
      </TooltipContent>
    </Tooltip>
  </>
);

const PromptCompressionTab: React.FC<PromptCompressionTabProps> = ({ accessToken }) => {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(compressionSchema, { defaultValues: EMPTY_VALUES });
  const [guardrails, setGuardrails] = useState<GuardrailListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadGuardrails = useCallback(() => {
    if (!accessToken) {
      return;
    }
    getGuardrailsList(accessToken)
      .then((response) => setGuardrails(compressionGuardrailsOf(response as GuardrailListResponse)))
      .catch((error) => {
        console.error("Failed to load compression guardrails:", error);
        toast.fromError("Failed to load compression guardrails");
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadGuardrails();
  }, [loadGuardrails]);

  const handleAdd = async (values: CompressionFormValues) => {
    if (!accessToken) {
      return;
    }
    setIsSaving(true);
    try {
      await createGuardrailCall(
        accessToken,
        buildCompressionGuardrailPayload({
          name: values.name,
          apiBase: values.apiBase,
          defaultOn: values.defaultOn ?? true,
        }),
      );
      toast.success(translateUi("ui.58e966ed45a473cc"));
      form.reset(EMPTY_VALUES);
      await loadGuardrails();
    } catch (error) {
      console.error("Failed to create compression guardrail:", error);
      toast.fromError("Failed to create compression guardrail");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{uiT("ui.51a95ec9ec6361fd")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {uiT("ui.7e4d0dc99846a761")}{" "}
            <a
              href="https://docs.litellm.ai/docs/proxy/headroom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-info underline"
            >
              {uiT("ui.0a02f91542f4e5a7")}
            </a>
          </p>
          {isLoading && <p className="text-sm text-muted-foreground">{uiT("ui.47d2a515ef2f")}</p>}
          {!isLoading && guardrails.length === 0 && (
            <p className="text-sm text-muted-foreground">{uiT("ui.927e53d876c103aa")}</p>
          )}
          {!isLoading && guardrails.length > 0 && (
            <ul className="divide-y divide-border">
              {guardrails.map((guardrail) => (
                <li key={guardrail.guardrail_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{guardrail.guardrail_name}</p>
                    <p className="text-xs text-muted-foreground">{guardrail.litellm_params?.api_base ?? ""}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      guardrail.litellm_params?.default_on
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {guardrail.litellm_params?.default_on ? uiT("ui.044ba8a9ae43b296") : uiT("ui.b74b99727ed37f3a")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{uiT("ui.0ef708c2d52db794")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <form onSubmit={form.handleSubmit(handleAdd)} noValidate>
              <FieldGroup>
                <FormField control={form.control} name="name" label={uiT("ui.dcd1d5223f73")}>
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="headroom-compression" />}
                </FormField>
                <FormField
                  control={form.control}
                  name="apiBase"
                  label={labelWithHint(
                    "Headroom API base",
                    "Base URL of your Headroom compression service (LiteLLM calls its /v1/compress endpoint)",
                  )}
                  description={uiT("ui.f0447696675baf30")}
                >
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="https://your-headroom-endpoint" />}
                </FormField>
                <FormField control={form.control} name="defaultOn" label={uiT("ui.c73845d8982043d7")}>
                  {({ value, onChange, ref: _ref, ...field }) => (
                    <Switch
                      {...field}
                      nativeButton
                      render={<button type="button" />}
                      checked={value}
                      onCheckedChange={onChange}
                    />
                  )}
                </FormField>
              </FieldGroup>
              <div className="mt-6 mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm text-warning">
                  {uiT("ui.ec93aa93e5a796bb")}{" "}
                  <a
                    href="https://www.litellm.ai/#pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {uiT("ui.fcec91509759ad99")}
                  </a>
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <UiLoadingSpinner className="size-4" />}
                  {uiT("ui.ed380b4d7312ad2d")}
                </Button>
              </div>
            </form>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptCompressionTab;
