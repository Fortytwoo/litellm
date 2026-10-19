"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import {
  DECISIONS_DOCS_URL,
  SYSTEM_ONE_PLAYGROUND_ROUTE,
  isDecisionSelection,
  type DecisionCatalog,
} from "@/lib/decisionModels";
import { uiHref } from "@/utils/uiHref";
import type { MountedFormValues } from "../common_components/MountedFormField";

interface DecisionModelNoteProps {
  catalog: DecisionCatalog;
  litellmProvider: string | undefined;
}

const selectedModelNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((model): model is string => typeof model === "string");
  }
  return typeof value === "string" && value !== "" ? [value] : [];
};

export default function DecisionModelNote({ catalog, litellmProvider }: DecisionModelNoteProps) {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<MountedFormValues>();
  const model = useWatch({ control, name: "model" });

  if (!isDecisionSelection(catalog, litellmProvider, selectedModelNames(model))) {
    return null;
  }

  return (
    <Alert variant="info" role="note" aria-label={uiT("ui.61ff598dec622d27")} className="mb-4">
      <Info />
      <AlertTitle>{uiT("ui.1e7a941a0dab1722")}</AlertTitle>
      <AlertDescription>
        <p>
          {uiT("ui.f94379e9b327a0c5")} <code>/v1/decisions</code> {uiT("ui.d5f90b419d45feee")}{" "}
          <code>/v1/systemone</code> {uiT("ui.9cc5d8032e8a3b47")}{" "}
          <a href={DECISIONS_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline">
            {uiT("ui.7c42d83806a10c4f")}
          </a>
        </p>
        <p>
          {uiT("ui.f0ca89dd6941965c")}{" "}
          <a href={uiHref(SYSTEM_ONE_PLAYGROUND_ROUTE)} className="underline">
            {uiT("ui.f22356a598077ec3")}
          </a>
        </p>
      </AlertDescription>
    </Alert>
  );
}
