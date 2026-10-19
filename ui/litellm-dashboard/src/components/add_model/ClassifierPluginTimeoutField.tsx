"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { getClassifierPluginTimeoutError } from "./build_complexity_router_config";

const CLASSIFIER_PLUGIN_TIMEOUT_ID = "classifier-plugin-timeout-ms";

interface ClassifierPluginTimeoutFieldProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  showValidationErrors?: boolean;
}

const ClassifierPluginTimeoutField: React.FC<ClassifierPluginTimeoutFieldProps> = ({
  value,
  onChange,
  showValidationErrors = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const error = getClassifierPluginTimeoutError("custom", value.classifier_plugin_timeout_ms);
  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm text-muted-foreground">{uiT("ui.1cf5a02c053bb88e")}</p>
      <Label htmlFor={CLASSIFIER_PLUGIN_TIMEOUT_ID} className="block font-semibold">
        {uiT("ui.9d8a33af4597e0fb")}
      </Label>
      <Input
        id={CLASSIFIER_PLUGIN_TIMEOUT_ID}
        inputMode="numeric"
        placeholder="3000"
        value={value.classifier_plugin_timeout_ms ?? ""}
        onChange={(event) =>
          onChange({
            ...value,
            classifier_plugin_timeout_ms: event.target.value.trim() === "" ? undefined : Number(event.target.value),
          })
        }
        aria-invalid={Boolean(showValidationErrors && error)}
      />
      <p className="text-sm text-muted-foreground">{uiT("ui.a50a5afc4d39c173")}</p>
      {showValidationErrors && error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default ClassifierPluginTimeoutField;
