"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useId } from "react";
import { AutoRouterAllowanceNote } from "./AutoRouterAvailability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultJevClassifierConfig, fixedClassifierModels } from "./jev_classifier_config";

const providerDescriptions = {
  get jev() {
    return translateUi("ui.d83744d206a7dc8b");
  },
  get laya() {
    return translateUi("ui.be904d2124c8186b");
  },
  get bespoke() {
    return translateUi("ui.9b0f632fc2d0724c");
  },
  get databricks() {
    return translateUi("ui.0abe53f5a5c906c2");
  },
};

export default function JevClassifierConfig({
  value,
  onChange,
  section = "all",
}: {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  section?: "all" | "model" | "advanced";
}) {
  const { t: uiT } = useDashboardLanguage();

  const id = useId();
  const config = value.jev_classifier_config ?? defaultJevClassifierConfig();
  const models = fixedClassifierModels(config.provider);
  const update = (patch: Partial<typeof config>) =>
    onChange({ ...value, jev_classifier_config: { ...config, ...patch } });

  return (
    <div className={section === "model" ? "space-y-3" : "mt-4 space-y-3"}>
      {section !== "advanced" && !config.deployment_name && (
        <>
          <p className="text-sm text-muted-foreground">{providerDescriptions[config.provider ?? "jev"]}</p>
          <div className="space-y-2">
            <Label htmlFor={`${id}-model`}>{uiT("ui.6493f94f0e0348f3")}</Label>
            {models ? (
              <Select value={config.model} onValueChange={(model) => model && update({ model })}>
                <SelectTrigger id={`${id}-model`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={`${id}-model`}
                value={config.model}
                placeholder={config.provider === "databricks" ? uiT("ui.bb2e460bae9860a5") : undefined}
                onChange={(event) => update({ model: event.target.value })}
              />
            )}
          </div>
        </>
      )}
      {section !== "model" && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${id}-timeout`}>{uiT("ui.e6420b7434d85823")}</Label>
            <Input
              id={`${id}-timeout`}
              type="number"
              min={1}
              step={1}
              value={config.timeout_ms}
              onChange={(event) => update({ timeout_ms: Number(event.target.value) })}
            />
          </div>
          <ClassifierCircuitBreakerConfig
            value={config}
            onChange={(next) =>
              update({
                circuit_breaker_enabled: next.circuit_breaker_enabled,
                circuit_breaker_cooldown_seconds: next.circuit_breaker_cooldown_seconds,
              })
            }
          />
          <div className="space-y-2">
            <Label htmlFor={`${id}-instructions`}>{uiT("ui.6348538146593203")}</Label>
            <AutoRouterAllowanceNote feature="tier_or_classifier_prompt" label={uiT("ui.caf1b1b01e3a6be4")} />
            <Textarea
              id={`${id}-instructions`}
              value={config.instructions ?? ""}
              placeholder={uiT("ui.2d2aaa0f4691e9a6")}
              onChange={(event) => update({ instructions: event.target.value || undefined })}
            />
            {config.instructions && (
              <Button variant="outline" type="button" onClick={() => update({ instructions: undefined })}>
                {uiT("ui.e6ca70f8529692a9")}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">{uiT("ui.6faa590590cad398")}</p>
          </div>
        </>
      )}
    </div>
  );
}
