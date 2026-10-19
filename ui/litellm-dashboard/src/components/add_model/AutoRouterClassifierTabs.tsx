"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useContext, useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { ChevronDownIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  effectiveClassifierType,
  type ClassifierType,
  type ComplexityRouterConfigValue,
} from "./ComplexityRouterConfig";
import {
  defaultJevClassifierConfig,
  isOssClassifierProvider,
  normalizeJevClassifierConfig,
} from "./jev_classifier_config";
import { transitionClassifierType } from "./classifier_type_transition";
import { isForecastClassifier } from "./forecast_classifier_config";
import {
  AutoRouterAllowanceLabel,
  AutoRouterAvailabilityContext,
  AutoRouterLimits,
  AutoRouterContactLink,
  isAllowanceExhausted,
  AUTO_ROUTER_CONTACT_URL,
} from "./AutoRouterAvailability";

export function ClassifierOption({
  value,
  label,
  description,
  feature,
  disabled,
  unlimited = true,
}: {
  value: string;
  label: string;
  description: string;
  feature?: string;
  disabled?: boolean;
  unlimited?: boolean;
}) {
  const { t: uiT } = useDashboardLanguage();

  const state = useContext(AutoRouterAvailabilityContext);
  const allowance = state.data?.allowances.find((entry) => entry.key === feature);
  const fresh = !state.isPending && !state.isError && !state.isChecking;
  const exhausted = isAllowanceExhausted(allowance);
  return (
    <div className="relative">
      <DropdownMenuRadioItem value={value} disabled={disabled || exhausted} closeOnClick className="py-3">
        <span className="grid w-full min-w-0 gap-1 whitespace-normal">
          <span className="flex items-center justify-between gap-3">
            <span className="font-medium">{label}</span>
            {feature ? (
              <AutoRouterAllowanceLabel feature={feature} />
            ) : (
              unlimited && (
                <span className="shrink-0 text-xs leading-5 text-muted-foreground">{uiT("ui.11dde17d6c3e")}</span>
              )
            )}
          </span>
          <span className={`text-xs leading-5 text-muted-foreground ${exhausted ? "pr-28" : ""}`}>{description}</span>
        </span>
      </DropdownMenuRadioItem>
      {fresh && exhausted && (
        <DropdownMenuItem
          render={<a href={AUTO_ROUTER_CONTACT_URL} target="_blank" rel="noopener noreferrer" />}
          aria-label={uiT("ui.bcedb8f6645e09a5", { v0: String(label) })}
          className="absolute top-9 right-8 cursor-pointer px-0 py-0 text-xs leading-5 font-medium text-blue-600 focus:text-blue-600 hover:underline dark:text-blue-400 dark:focus:text-blue-400"
        >
          {uiT("ui.5fbc0ca89a619cb7")}
        </DropdownMenuItem>
      )}
    </div>
  );
}

export function ClassifierMenu({
  id,
  label,
  value,
  selectedLabel,
  feature,
  onValueChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  selectedLabel: string;
  feature?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        aria-label={label}
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        {feature ? (
          <AutoRouterAllowanceLabel feature={feature} />
        ) : (
          <span className="text-xs text-muted-foreground">{uiT("ui.11dde17d6c3e")}</span>
        )}
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {children}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AutoRouterClassifierTabsProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  children: React.ReactNode;
  judgeModel?: React.ReactNode;
  decisionModel?: React.ReactNode;
}

const AutoRouterClassifierTabs: React.FC<AutoRouterClassifierTabsProps> = ({
  value,
  onChange,
  children,
  judgeModel,
  decisionModel,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const id = useId();
  const availability = useContext(AutoRouterAvailabilityContext);
  const classifierType = effectiveClassifierType(value);
  const familyByType: Record<ClassifierType, string> = {
    heuristic: "heuristics",
    heuristic_v2: "heuristics",
    llm: "llm",
    heuristic_first: "llm",
    hybrid: "llm",
    capability: "llm",
    llm_v2: "llm",
    jev: "jev",
    custom: "custom",
  };
  const family = familyByType[classifierType];
  const hasCustomTiers = Boolean(value.custom_tier_set);
  const changeType = (next: ClassifierType) => {
    if (next !== classifierType) onChange(transitionClassifierType(value, next));
  };

  const changeFamily = (next: unknown) => {
    if (next === family) return;
    if (next === "heuristics") changeType("heuristic");
    if (next === "llm") changeType("llm");
    if (next === "jev") changeType("jev");
  };
  const changeProvider = (provider: unknown) => {
    if (!isOssClassifierProvider(provider)) return;
    const defaults = defaultJevClassifierConfig(provider);
    onChange({
      ...value,
      jev_classifier_config: { ...defaults, ...value.jev_classifier_config, provider, model: defaults.model },
    });
  };
  const approachLabels: Partial<Record<ClassifierType, string>> = {
    get capability() {
      return translateUi("ui.5faf58a69db59058");
    },
    get llm_v2() {
      return translateUi("ui.5de813e4d1c2970c");
    },
  };
  const approachDescription: Partial<Record<ClassifierType, string>> = {
    capability: "Use the efficient model when it is likely to succeed",
    llm_v2: "Use the efficient model when its predicted quality is close enough to the capable model",
  };
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-4 flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="m-0 text-xl font-semibold text-foreground">{uiT("ui.fd5c195bafa40f76")}</h4>
            <SimpleTooltip content={uiT("ui.dd50975989f48362")}>
              <button type="button" aria-label={uiT("ui.14d63cb58395f3e5")} className="text-muted-foreground">
                <Info className="size-4" />
              </button>
            </SimpleTooltip>
          </div>
          <AutoRouterLimits />
        </legend>
        <RadioGroup value={family} onValueChange={changeFamily} className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "heuristics", label: uiT("ui.fe610461f56daafb"), description: uiT("ui.ea13af3dadafb98e") },
            { value: "llm", label: "LLM", description: uiT("ui.a289ac3bf77d520f") },
            {
              value: "jev",
              label: uiT("ui.111ad5d311001f2c"),
              description: uiT("ui.c0076b4dbde95226"),
            },
          ].map((option) => (
            <Label
              key={option.value}
              className="cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
            >
              <RadioGroupItem
                aria-describedby={`${id}-${option.value}-description`}
                value={option.value}
                disabled={option.value === "heuristics" && hasCustomTiers}
              />
              <span className="space-y-1">
                <span className="block font-medium">{option.label}</span>
                <span
                  id={`${id}-${option.value}-description`}
                  aria-hidden="true"
                  className="block text-xs font-normal text-muted-foreground"
                >
                  {option.description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      {family === "jev" &&
        (decisionModel ?? (
          <div className="space-y-2">
            <Label htmlFor={`${id}-decision-model`}>{uiT("ui.1e7a941a0dab1722")}</Label>
            <Select
              items={[
                { value: "jev", label: uiT("ui.4b23c5040d02a920") },
                { value: "laya", label: uiT("ui.a4dcbd2a6a16a37d") },
                { value: "bespoke", label: uiT("ui.4af4225cfbce9548") },
                { value: "databricks", label: uiT("ui.5b5fea64c7467736") },
              ]}
              value={normalizeJevClassifierConfig(value.jev_classifier_config).provider}
              onValueChange={changeProvider}
            >
              <SelectTrigger id={`${id}-decision-model`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jev">{uiT("ui.4b23c5040d02a920")}</SelectItem>
                <SelectItem value="laya">{uiT("ui.a4dcbd2a6a16a37d")}</SelectItem>
                <SelectItem value="bespoke">{uiT("ui.4af4225cfbce9548")}</SelectItem>
                <SelectItem value="databricks">{uiT("ui.5b5fea64c7467736")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      {family === "custom" && <p className="text-sm text-muted-foreground">{uiT("ui.ad69c868ca335ab0")}</p>}
      {family === "heuristics" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-heuristic`}>{uiT("ui.8ea33c597e4ab376")}</Label>
          <ClassifierMenu
            id={`${id}-heuristic`}
            label={uiT("ui.8ea33c597e4ab376")}
            selectedLabel={classifierType === "heuristic_v2" ? "Heuristic v2" : "Rule-based"}
            feature={classifierType === "heuristic_v2" ? "heuristic_v2" : undefined}
            value={classifierType}
            onValueChange={(next) => {
              if (next === "heuristic" || next === "heuristic_v2") changeType(next);
            }}
          >
            <ClassifierOption
              value="heuristic"
              label={uiT("ui.6d80010aeb1c2847")}
              description={uiT("ui.458db9e5eacedb46")}
            />
            <ClassifierOption
              value="heuristic_v2"
              label={uiT("ui.183bc446ae6a17b0")}
              description={uiT("ui.cde73557925a9b6e")}
              feature="heuristic_v2"
            />
          </ClassifierMenu>
          <p className="text-xs text-muted-foreground">
            {classifierType === "heuristic_v2" ? uiT("ui.9a958446ad25aeb0") : uiT("ui.a4f6796d0639b2d4")}
          </p>
        </div>
      )}
      {family === "llm" && judgeModel}
      {family === "llm" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-approach`}>{uiT("ui.b34009618629384a")}</Label>
          <ClassifierMenu
            id={`${id}-approach`}
            label={uiT("ui.b34009618629384a")}
            selectedLabel={approachLabels[classifierType] ?? "Complexity"}
            feature={isForecastClassifier(classifierType) ? classifierType : undefined}
            value={isForecastClassifier(classifierType) ? classifierType : "llm"}
            onValueChange={(next) => {
              if (next === "llm" || next === "capability" || next === "llm_v2") {
                if (next === "llm" && !isForecastClassifier(classifierType)) return;
                changeType(next);
              }
            }}
          >
            <ClassifierOption value="llm" label={uiT("ui.2dcf78dcabca38ef")} description={uiT("ui.71e78862dc541cac")} />
            {family === "llm" && (
              <>
                <ClassifierOption
                  value="capability"
                  label={uiT("ui.5faf58a69db59058")}
                  description={uiT("ui.346f8d1cd9122c95")}
                  feature="capability"
                  disabled={hasCustomTiers}
                />
                <ClassifierOption
                  value="llm_v2"
                  label={uiT("ui.5de813e4d1c2970c")}
                  description={uiT("ui.6d7cd9b177ff64ba")}
                  feature="llm_v2"
                  disabled={hasCustomTiers}
                />
              </>
            )}
          </ClassifierMenu>
          <p className="text-xs text-muted-foreground">
            {approachDescription[classifierType] ?? uiT("ui.596616088f5c4f97")}
          </p>
        </div>
      )}
      {hasCustomTiers && <p className="text-xs text-muted-foreground">{uiT("ui.2beb4a4be84cdcfa")}</p>}
      {availability.data?.error && !availability.isChecking && (
        <div role="alert" className="space-y-1">
          <p className="text-sm text-destructive">{availability.data.error}</p>
          <AutoRouterContactLink />
        </div>
      )}
      {availability.isError && (
        <p className="text-xs text-muted-foreground">
          {uiT("ui.ed46d836213a2eb3")}{" "}
          <button type="button" className="underline" onClick={() => availability.refetch?.()}>
            {uiT("ui.942087cc2d41e013")}
          </button>
        </p>
      )}
      {children}
    </div>
  );
};

export default AutoRouterClassifierTabs;
