"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { CircleHelp, Eye, EyeOff, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { CredentialItem, vectorStoreCreateCall } from "@/components/networking";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  getVectorStoreProviderLogoAndName,
  VectorStoreFieldConfig,
} from "@/components/vector_store_providers";
import { Logo } from "@/components/molecules/logo/Logo";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { credentialOptions } from "@/components/shared/credentialOptions";

const EMBEDDING_MODEL_RENAME_PROVIDERS = new Set(["milvus", "valkey", "mongodb"]);

export const buildVectorStoreLitellmParams = (
  provider: string,
  formValues: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    getProviderSpecificFields(provider)
      .filter(isSupportedProviderField)
      .map((field) => [
        EMBEDDING_MODEL_RENAME_PROVIDERS.has(provider) && field.name === "embedding_model"
          ? "litellm_embedding_model"
          : field.name,
        formValues[field.name],
      ]),
  );

interface VectorStoreFormProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  credentials: CredentialItem[];
}

const PROVIDER_FIELD_NAMES = [
  "api_base",
  "api_key",
  "vertex_project",
  "vertex_location",
  "vertex_collection_id",
  "vertex_engine_id",
  "embedding_model",
  "vector_bucket_name",
  "index_name",
  "aws_region_name",
  "mongodb_database",
  "mongodb_collection",
  "mongodb_embedding_field",
  "mongodb_text_field",
  "mongodb_num_candidates",
  "valkey_host",
  "valkey_port",
  "valkey_password",
  "valkey_ssl",
  "valkey_text_field",
  "valkey_embedding_field",
] as const;

type ProviderFieldName = (typeof PROVIDER_FIELD_NAMES)[number];

const isProviderFieldName = (name: string): name is ProviderFieldName =>
  (PROVIDER_FIELD_NAMES as readonly string[]).includes(name);

const optionalText = z.string().optional();

const vectorStoreShape = {
  custom_llm_provider: z.string().min(1, "Please select a provider"),
  vector_store_id: z.string().min(1, "Please input the vector store ID from your api provider"),
  vector_store_name: optionalText,
  vector_store_description: optionalText,
  litellm_credential_name: z.string().nullable().optional(),
  api_base: optionalText,
  api_key: optionalText,
  vertex_project: optionalText,
  vertex_location: optionalText,
  vertex_collection_id: optionalText,
  vertex_engine_id: optionalText,
  embedding_model: optionalText,
  vector_bucket_name: optionalText,
  index_name: optionalText,
  aws_region_name: optionalText,
  mongodb_database: optionalText,
  mongodb_collection: optionalText,
  mongodb_embedding_field: optionalText,
  mongodb_text_field: optionalText,
  mongodb_num_candidates: optionalText,
  valkey_host: optionalText,
  valkey_port: optionalText,
  valkey_password: optionalText,
  valkey_ssl: optionalText,
  valkey_text_field: optionalText,
  valkey_embedding_field: optionalText,
};

const vectorStoreSchema = z.object(vectorStoreShape).superRefine((values, ctx) => {
  getProviderSpecificFields(values.custom_llm_provider)
    .filter((field) => field.required && isProviderFieldName(field.name) && !values[field.name])
    .forEach((field) =>
      ctx.addIssue({
        code: "custom",
        path: [field.name],
        message:
          field.type === "select"
            ? translateUi("ui.a042cd4c346f6572", undefined, { v0: String(field.label.toLowerCase()) })
            : translateUi("ui.0a0d038c01323946", undefined, { v0: String(field.label.toLowerCase()) }),
      }),
    );
});

type VectorStoreFormValues = z.output<typeof vectorStoreSchema>;

const VECTOR_STORE_ID_PLACEHOLDERS: Record<string, string> = {
  vertex_rag_engine: '6917529027641081856 (corpus ID from Vertex AI / "RAG Engine" console)',
  "vertex_ai/search_api": 'my-datastore_1234567890 (data store ID from Vertex AI / "Agent Search" console)',
  valkey: "my-search-index (FT index name in Valkey)",
  mongodb: "my-vector-index (MongoDB Vector Search index name)",
};

const VERTEX_SEARCH_API_WITH_ENGINE_PLACEHOLDER = "Any identifier you'll use to reference this in LiteLLM";

const DEFAULT_VECTOR_STORE_ID_PLACEHOLDER = "Enter vector store ID from your provider";

const EMPTY_VALUES: VectorStoreFormValues = {
  custom_llm_provider: "bedrock",
  vector_store_id: "",
  vertex_location: "global",
  mongodb_embedding_field: "embedding",
  mongodb_text_field: "text",
  valkey_port: "6379",
  valkey_ssl: "false",
  valkey_text_field: "text",
  valkey_embedding_field: "embedding",
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

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<typeof InputGroupInput>>(
  (props, ref) => {
    const { t: uiT } = useDashboardLanguage();

    const [revealed, setRevealed] = useState(false);
    return (
      <InputGroup>
        <InputGroupInput {...props} ref={ref} type={revealed ? "text" : "password"} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={revealed ? uiT("ui.592b73ba488ad74f") : uiT("ui.81f33754fd8c1c35")}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

const VectorStoreForm: React.FC<VectorStoreFormProps> = ({
  isVisible,
  onCancel,
  onSuccess,
  accessToken,
  credentials,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(vectorStoreSchema, { defaultValues: EMPTY_VALUES });
  const [metadataJson, setMetadataJson] = useState("{}");
  const [selectedProvider, setSelectedProvider] = useState("bedrock");
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const vertexEngineId = useWatch({ control: form.control, name: "vertex_engine_id" });

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        if (uniqueModels.length > 0) {
          setModelInfo(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching model info:", error);
      }
    };

    loadModels();
  }, [accessToken]);

  const makeProviderChangeHandler = (onChange: (provider: string) => void) => (provider: string | null) => {
    if (provider === null) return;
    onChange(provider);
    setSelectedProvider(provider);
  };

  const handleCreate = async (formValues: VectorStoreFormValues) => {
    if (!accessToken) return;
    try {
      let metadata = {};
      try {
        metadata = metadataJson.trim() ? JSON.parse(metadataJson) : {};
      } catch (e) {
        toast.fromError("Invalid JSON in metadata field");
        return;
      }

      await vectorStoreCreateCall(accessToken, {
        vector_store_id: formValues.vector_store_id,
        custom_llm_provider: formValues.custom_llm_provider,
        vector_store_name: formValues.vector_store_name,
        vector_store_description: formValues.vector_store_description,
        vector_store_metadata: metadata,
        litellm_credential_name: formValues.litellm_credential_name,
        litellm_params: buildVectorStoreLitellmParams(formValues.custom_llm_provider, formValues),
      });
      toast.success(translateUi("ui.5e5c42994bdd1b12"));
      form.reset(EMPTY_VALUES);
      setMetadataJson("{}");
      onSuccess();
    } catch (error) {
      console.error("Error creating vector store:", error);
      toast.fromError("Error creating vector store: " + error);
    }
  };

  const handleCancel = () => {
    form.reset(EMPTY_VALUES);
    setMetadataJson("{}");
    setSelectedProvider("bedrock");
    onCancel();
  };

  const vectorStoreIdPlaceholder =
    selectedProvider === "vertex_ai/search_api" && vertexEngineId
      ? VERTEX_SEARCH_API_WITH_ENGINE_PLACEHOLDER
      : VECTOR_STORE_ID_PLACEHOLDERS[selectedProvider] ?? DEFAULT_VECTOR_STORE_ID_PLACEHOLDER;

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.8702c329a4dd0052")}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="custom_llm_provider"
                label={labelWithHint("Provider", "Select the provider for this vector store")}
              >
                {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                  <Select value={value} onValueChange={makeProviderChangeHandler(onChange)}>
                    <SelectTrigger
                      id={id}
                      aria-invalid={ariaInvalid}
                      aria-describedby={ariaDescribedBy}
                      className="w-full"
                    >
                      <SelectValue>
                        {(provider: string) => {
                          const { displayName, logo } = getVectorStoreProviderLogoAndName(provider);
                          return (
                            <>
                              <Logo src={logo} label={displayName} className="w-5 h-5" />
                              <span>{displayName}</span>
                            </>
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VectorStoreProviders).map(([providerEnum, providerDisplayName]) => (
                        <SelectItem key={providerEnum} value={vectorStoreProviderMap[providerEnum]}>
                          <Logo
                            src={vectorStoreProviderLogoMap[providerDisplayName]}
                            label={providerDisplayName}
                            className="w-5 h-5"
                          />
                          <span>{providerDisplayName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              {selectedProvider === "pg_vector" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{uiT("ui.91d9fed6b75abc31")}</AlertTitle>
                  <AlertDescription>
                    <p>{uiT("ui.45d40420aaa8158f")}</p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {uiT("ui.0c8c2630e3ed4486")}{" "}
                        <a href="https://github.com/BerriAI/litellm-pgvector" target="_blank" rel="noopener noreferrer">
                          https://github.com/BerriAI/litellm-pgvector
                        </a>
                      </li>
                      <li>{uiT("ui.5445a52f05e47bdb")}</li>
                      <li>{uiT("ui.d46d4f34b7e73669")}</li>
                      <li>{uiT("ui.d99f0a223ea328e9")}</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "valkey" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{uiT("ui.3dd7c9829628fd43")}</AlertTitle>
                  <AlertDescription>
                    <p>{uiT("ui.c0849ed71883fee7")}</p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>{uiT("ui.61d186ac56f179f0")}</li>
                      <li>{uiT("ui.724a4b099f070d2d")}</li>
                      <li>{uiT("ui.d928f0edb62cbcfc")}</li>
                      <li>{uiT("ui.c0cd5c1eb98b7255")}</li>
                    </ol>
                    <p style={{ marginTop: "8px" }}>{uiT("ui.05289e52f34d1d0c")}</p>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "vertex_rag_engine" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{uiT("ui.f8db79339faaf41d")}</AlertTitle>
                  <AlertDescription>
                    <p>{uiT("ui.6881783d221d7536")}</p>
                    <p style={{ marginTop: "4px", fontStyle: "italic" }}>{uiT("ui.a3a659aac838f44c")}</p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {uiT("ui.166fa757302cfa3f")}{" "}
                        <a
                          href="https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {uiT("ui.db7163e1b90df860")}
                        </a>
                      </li>
                      <li>{uiT("ui.d36464dd85d1d278")}</li>
                      <li>{uiT("ui.a7e4013cf5ef576c")}</li>
                      <li>{uiT("ui.4a3f64b9ceda54a7")}</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "vertex_ai/search_api" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{uiT("ui.cc31eee639730b85")}</AlertTitle>
                  <AlertDescription>
                    <p>{uiT("ui.3932a60e8dceed9f")}</p>
                    <p style={{ marginTop: "4px", fontStyle: "italic" }}>{uiT("ui.236ace4c946cfadf")}</p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {uiT("ui.bbe14b030f9cbeff")}{" "}
                        <a
                          href="https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "underline" }}
                        >
                          {uiT("ui.14c6e201d06315b2")}
                        </a>
                      </li>
                      <li>{uiT("ui.119634242b73435a")}</li>
                      <li>{uiT("ui.b88fa22af9987bbf")}</li>
                      <li>
                        {uiT("ui.f3168fa9070d1077")} <strong>{uiT("ui.3341eebca3600328")}</strong>{" "}
                        {uiT("ui.30d4ba183833af14")}
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="vector_store_id"
                label={labelWithHint("Vector Store ID", "Enter the vector store ID from your api provider")}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={vectorStoreIdPlaceholder} />}
              </FormField>

              {getProviderSpecificFields(selectedProvider)
                .filter(isSupportedProviderField)
                .map((field) => (
                  <ProviderField key={field.name} field={field} control={form.control} modelInfo={modelInfo} />
                ))}

              <FormField
                control={form.control}
                name="vector_store_name"
                label={labelWithHint(
                  "Vector Store Name",
                  "Custom name you want to give to the vector store, this name will be rendered on the LiteLLM UI",
                )}
              >
                {({ ref, value, ...field }) => <Input {...field} ref={ref} value={value ?? ""} />}
              </FormField>

              <FormField control={form.control} name="vector_store_description" label={uiT("ui.526e0087cc3f")}>
                {({ ref, value, ...field }) => <Textarea {...field} ref={ref} value={value ?? ""} rows={4} />}
              </FormField>

              <FormField
                control={form.control}
                name="litellm_credential_name"
                label={labelWithHint(
                  "Existing Credentials",
                  "Optionally select API provider credentials for this vector store eg. Bedrock API KEY",
                )}
              >
                {({ id, value, onChange }) => (
                  <SearchSelect
                    inputId={id}
                    placeholder={uiT("ui.1c1bd81a646a1fc6")}
                    options={credentialOptions(credentials)}
                    value={value ?? ""}
                    onValueChange={(selected) => onChange(selected === "" || selected === null ? undefined : selected)}
                  />
                )}
              </FormField>

              <div role="group" className="flex w-full flex-col gap-3">
                <span className="flex w-fit gap-2 text-sm leading-snug font-medium">
                  {labelWithHint("Metadata", "JSON metadata for the vector store (optional)")}
                </span>
                <Textarea
                  rows={4}
                  value={metadataJson}
                  onChange={(event) => setMetadataJson(event.target.value)}
                  placeholder='{"key": "value"}'
                />
              </div>
            </FieldGroup>

            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button type="submit">{uiT("ui.4759498ac2a7")}</Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

type SupportedProviderField = VectorStoreFieldConfig & { name: ProviderFieldName };

const isSupportedProviderField = (field: VectorStoreFieldConfig): field is SupportedProviderField =>
  isProviderFieldName(field.name);

interface ProviderFieldProps {
  field: SupportedProviderField;
  control: ReturnType<typeof useZodForm<VectorStoreFormValues, VectorStoreFormValues>>["control"];
  modelInfo: ModelGroup[];
}

const ProviderField: React.FC<ProviderFieldProps> = ({ field, control, modelInfo }) => {
  const { t: uiT } = useDashboardLanguage();

  const label = labelWithHint(field.label, field.tooltip);

  if (field.type === "select") {
    const selectOptions =
      field.options ??
      modelInfo
        .filter((option: ModelGroup) => option.mode === "embedding" || option.mode === null)
        .map((option: ModelGroup) => ({
          value: option.model_group,
          label: option.model_group,
        }));

    return (
      <FormField control={control} name={field.name} label={label}>
        {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
          <Combobox
            items={selectOptions}
            value={selectOptions.find((option) => option.value === value) ?? null}
            onValueChange={(option: { value: string; label: string } | null) => onChange(option?.value)}
            itemToStringLabel={(option: { value: string; label: string }) => option.label}
            isItemEqualToValue={(
              option: { value: string; label: string },
              selected: { value: string; label: string },
            ) => option.value === selected.value}
          >
            <ComboboxInput
              id={id}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              placeholder={field.placeholder}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxEmpty>{uiT("ui.39a118fc69d4f129")}</ComboboxEmpty>
              <ComboboxList>
                {(option: { value: string; label: string }) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </FormField>
    );
  }

  return (
    <FormField control={control} name={field.name} label={label}>
      {({ ref, value, ...controlProps }) =>
        field.type === "password" ? (
          <PasswordInput {...controlProps} ref={ref} value={value ?? ""} placeholder={field.placeholder} />
        ) : (
          <Input {...controlProps} ref={ref} value={value ?? ""} type="text" placeholder={field.placeholder} />
        )
      }
    </FormField>
  );
};

export default VectorStoreForm;
