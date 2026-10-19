"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { CircleHelp, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface S3VectorsConfigProps {
  accessToken: string | null;
  providerParams: Record<string, unknown>;
  onParamsChange: (params: Record<string, unknown>) => void;
}

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

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

const S3VectorsConfig: React.FC<S3VectorsConfigProps> = ({ accessToken, providerParams, onParamsChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const [embeddingModels, setEmbeddingModels] = useState<ModelGroup[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await fetchAvailableModels(accessToken);
        const embeddingOnly = models.filter((model) => model.mode === "embedding");
        setEmbeddingModels(embeddingOnly);
      } catch (error) {
        console.error("Error fetching embedding models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [accessToken]);

  const handleFieldChange = (fieldName: string, value: string) => {
    onParamsChange({
      ...providerParams,
      [fieldName]: value,
    });
  };

  const bucketName = asText(providerParams.vector_bucket_name);
  const indexName = asText(providerParams.index_name);
  const bucketNameError = bucketName && bucketName.length < 3 ? "Bucket name must be at least 3 characters" : undefined;
  const indexNameError =
    indexName && indexName.length > 0 && indexName.length < 3
      ? "Index name must be at least 3 characters if provided"
      : undefined;

  return (
    <TooltipProvider>
      <Alert variant="info" className="mb-4">
        <Info />
        <AlertTitle>{uiT("ui.a7d723408e885625")}</AlertTitle>
        <AlertDescription>
          <div>
            <p>{uiT("ui.e94ba310fb88ff3a")}</p>
            <ul style={{ marginLeft: "16px", marginTop: "8px" }}>
              <li>{uiT("ui.885abc5d75cd21a4")}</li>
              <li>{uiT("ui.40c068b35f98e7a7")}</li>
              <li>{uiT("ui.d574ab74bdc92ca4")}</li>
              <li>
                {uiT("ui.f21fec1c2282ec82")}{" "}
                <a
                  href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vector-buckets.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {uiT("ui.adb3b3dcf8c7c9d4")}
                </a>
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <Field data-invalid={bucketNameError !== undefined || undefined}>
        <FieldLabel htmlFor="s3-vector-bucket-name">
          {labelWithHint(
            "Vector Bucket Name",
            "S3 bucket name for vector storage (must be at least 3 characters, lowercase letters, numbers, hyphens, and periods only)",
          )}
        </FieldLabel>
        <Input
          id="s3-vector-bucket-name"
          value={bucketName}
          onChange={(e) => handleFieldChange("vector_bucket_name", e.target.value)}
          placeholder={uiT("ui.eba8255f00ab9a16")}
          aria-invalid={bucketNameError !== undefined || undefined}
        />
        <FieldError>{bucketNameError}</FieldError>
      </Field>

      <Field data-invalid={indexNameError !== undefined || undefined}>
        <FieldLabel htmlFor="s3-index-name">
          {labelWithHint(
            "Index Name",
            "Name for the vector index (optional, will be auto-generated if not provided). If provided, must be at least 3 characters.",
          )}
        </FieldLabel>
        <Input
          id="s3-index-name"
          value={indexName}
          onChange={(e) => handleFieldChange("index_name", e.target.value)}
          placeholder={uiT("ui.601c9605f6cc3a6d")}
          aria-invalid={indexNameError !== undefined || undefined}
        />
        <FieldError>{indexNameError}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="s3-aws-region-name">
          {labelWithHint("AWS Region", "AWS region where the S3 bucket is located (e.g., us-west-2)")}
        </FieldLabel>
        <Input
          id="s3-aws-region-name"
          value={asText(providerParams.aws_region_name)}
          onChange={(e) => handleFieldChange("aws_region_name", e.target.value)}
          placeholder={uiT("ui.d8c0d0637775d579")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="s3-embedding-model">
          {labelWithHint("Embedding Model", "Select the embedding model to use for vector generation")}
        </FieldLabel>
        <Combobox
          value={asText(providerParams.embedding_model) || null}
          onValueChange={(value: string | null) => value !== null && handleFieldChange("embedding_model", value)}
          items={embeddingModels.map((model) => model.model_group)}
        >
          <ComboboxInput id="s3-embedding-model" placeholder={uiT("ui.e2a474683605763b")} />
          <ComboboxContent>
            <ComboboxEmpty>{isLoadingModels ? uiT("ui.802435241f0ac4f5") : uiT("ui.157f85ee0afe4124")}</ComboboxEmpty>
            <ComboboxList>
              {(model: string) => (
                <ComboboxItem key={model} value={model}>
                  {model}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </TooltipProvider>
  );
};

export default S3VectorsConfig;
