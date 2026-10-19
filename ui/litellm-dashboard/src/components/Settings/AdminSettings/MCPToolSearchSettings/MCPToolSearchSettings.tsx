"use client";
import { t as translateUi } from "@/i18n";

import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import {
  useMCPToolSearchSettings,
  useUpdateMCPToolSearchSettings,
} from "@/app/(dashboard)/hooks/mcpToolSearchSettings/useMCPToolSearchSettings";
import { toast } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleHelp, Info, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import {
  DEFAULT_FORM_VALUES,
  TOP_K_MAX,
  TOP_K_MIN,
  clampTopK,
  formToPayload,
  storedValuesToForm,
  ToolSearchFormValues,
} from "./toolSearchForm";

interface MCPToolSearchSettingsProps {
  accessToken: string | null;
}

const SIMILARITY_THRESHOLD_MARKS = [0, 0.3, 0.5, 0.7, 1];

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

export default function MCPToolSearchSettings({ accessToken }: MCPToolSearchSettingsProps) {
  const { t: uiT } = useDashboardLanguage();

  const { data, isLoading, isError, error } = useMCPToolSearchSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateMCPToolSearchSettings();
  const form = useForm<ToolSearchFormValues>({ defaultValues: DEFAULT_FORM_VALUES });
  const isDirty = form.formState.isDirty;
  const [embeddingModels, setEmbeddingModels] = useState<ModelGroup[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const storedValues = data?.values;

  useEffect(() => {
    if (!accessToken) return;
    fetchAvailableModels(accessToken)
      .then((models) => setEmbeddingModels(models.filter((model) => model.mode === "embedding")))
      .catch((fetchError: unknown) => console.error("Error fetching embedding models:", fetchError))
      .finally(() => setLoadingModels(false));
  }, [accessToken]);

  useEffect(() => {
    if (!storedValues) return;
    form.reset(storedValuesToForm(storedValues));
  }, [storedValues, form]);

  const handleSave = (formValues: ToolSearchFormValues) => {
    updateSettings(formToPayload(formValues), {
      onSuccess: () => {
        form.reset(formValues);
        toast.success(translateUi("ui.cd45e5e5d93f5315"));
      },
      onError: (saveError) => toast.fromError(saveError),
    });
  };

  if (!accessToken) {
    return <div className="p-6 text-center text-muted-foreground">{uiT("ui.fcb2e892adfa8962")}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error" className="mb-6">
        <AlertTitle>{uiT("ui.0c5b13908e6baf6b")}</AlertTitle>
        {error instanceof Error && <AlertDescription>{error.message}</AlertDescription>}
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <Alert variant="info" className="mb-6">
        <Info />
        <AlertTitle>{uiT("ui.60a18954a408eb60")}</AlertTitle>
        <AlertDescription>
          {uiT("ui.b56e07038cb30f2e")} <code>mcp_tool_search</code> {uiT("ui.32b0a71fedb66ffc")}
        </AlertDescription>
      </Alert>

      <TooltipProvider>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <Card className="mb-4">
            <CardHeader className="border-b">
              <CardTitle>{uiT("ui.2ef9d509bd5a5dff")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="embedding_model"
                  label={labelWithHint(
                    "Embedding Model",
                    "Embedding model from your model list used to rank tools by meaning. Clear it to fall back to keyword matching.",
                  )}
                >
                  {({ value, onChange, id }) => (
                    <SearchSelect
                      inputId={id}
                      options={embeddingModels.map((model) => ({ label: model.model_group, value: model.model_group }))}
                      value={value}
                      onValueChange={onChange}
                      allowClear
                      placeholder={loadingModels ? uiT("ui.802435241f0ac4f5") : uiT("ui.d40bb73d630ca78f")}
                      emptyText={loadingModels ? uiT("ui.47d2a515ef2f") : uiT("ui.0a6598c0e2ff62a0")}
                      disabled={isUpdating || loadingModels}
                    />
                  )}
                </FormField>

                <FormField
                  control={form.control}
                  name="top_k"
                  label={labelWithHint(
                    "Top K Results",
                    "Most ranked tools a search returns. A smaller top_k in the tool call wins. Core tools do not count.",
                  )}
                >
                  {({ ref, value, onChange, onBlur, id }) => (
                    <Input
                      id={id}
                      ref={ref}
                      type="number"
                      min={TOP_K_MIN}
                      max={TOP_K_MAX}
                      value={value}
                      onChange={(event) => onChange(event.target.valueAsNumber)}
                      onBlur={() => {
                        onChange(Number.isNaN(value) ? DEFAULT_FORM_VALUES.top_k : clampTopK(value));
                        onBlur();
                      }}
                      disabled={isUpdating}
                    />
                  )}
                </FormField>

                <FormField
                  control={form.control}
                  name="similarity_threshold"
                  label={labelWithHint(
                    "Similarity Threshold",
                    "Lowest cosine similarity a tool needs to appear in semantic results. 0 means no cutoff.",
                  )}
                >
                  {({ value, onChange, id }) => (
                    <div className="w-full">
                      <Slider
                        id={id}
                        min={0}
                        max={1}
                        step={0.05}
                        value={[value]}
                        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
                        disabled={isUpdating}
                      />
                      <div className="relative mt-2 h-4 text-xs text-muted-foreground">
                        {SIMILARITY_THRESHOLD_MARKS.map((mark) => (
                          <span key={mark} className="absolute -translate-x-1/2" style={{ left: `${mark * 100}%` }}>
                            {mark.toFixed(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </FormField>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader className="border-b">
              <CardTitle>{uiT("ui.7c7608de96a37406")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="core_tools_text"
                  label={labelWithHint(
                    "Always Returned First",
                    "One tool name per line, e.g. my_server-get_rates. Listed before ranked results whenever the caller is allowed to use them.",
                  )}
                >
                  {({ ref, value, onChange, onBlur, id }) => (
                    <Textarea
                      id={id}
                      ref={ref}
                      value={value}
                      placeholder={uiT("ui.27ae31bb38d67d59")}
                      onChange={(event) => onChange(event.target.value)}
                      onBlur={onBlur}
                      disabled={isUpdating}
                    />
                  )}
                </FormField>
              </FieldGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => void form.handleSubmit(handleSave)()}
              disabled={!isDirty || isUpdating}
            >
              {isUpdating ? <UiLoadingSpinner className="size-4" /> : <Save />}
              {uiT("ui.ec92e1dc9bb3bf7b")}
            </Button>
          </div>
        </form>
      </TooltipProvider>
    </div>
  );
}
