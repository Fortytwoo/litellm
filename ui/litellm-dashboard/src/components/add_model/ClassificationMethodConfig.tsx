"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import ClassifierPrimarySettings from "./ClassifierPrimarySettings";
import { AutoRouterAllowanceNote } from "./AutoRouterAvailability";
import { transitionClassifierType } from "./classifier_type_transition";
import JevClassifierConfig from "./JevClassifierConfig";
import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import React from "react";
import ClassifierPromptEditor from "./ClassifierPromptEditor";
import OpeningPromptEditor, { type OpeningPromptSelection } from "./OpeningPromptEditor";
import { RestrictedSection, restrictedBy } from "./TierRestrictions";
import HeuristicScoringConfig from "./HeuristicScoringConfig";
import ClassifierReasoningEffortSelect from "./ClassifierReasoningEffortSelect";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import ClassifierVisionConfig from "./ClassifierVisionConfig";
import { getHeuristicV2SuccessThresholdError } from "./build_complexity_router_config";
import ClassifierPluginTimeoutField from "./ClassifierPluginTimeoutField";
import ClassifierTypeRadios from "./ClassifierTypeRadios";
import { ClassifierMenu, ClassifierOption } from "./AutoRouterClassifierTabs";
import { isHeuristicChain } from "./classifier_types";
import HeuristicKeywordOverrides from "./HeuristicKeywordOverrides";
import type { ReasoningEffort } from "./complexity_router_tiers";
import { useComplexityScorerDefaults } from "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults";
import {
  ClassifierFallback,
  ClassifierLLMConfig,
  ClassifierType,
  ComplexityRouterConfigValue,
  DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS,
  MIN_QUOTED_CONTEXT_TURN_CHARS,
  DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE,
  DEFAULT_CLASSIFIER_FALLBACK,
  DEFAULT_CLASSIFIER_TIMEOUT_MS,
  DEFAULT_CLASSIFICATION_RUBRIC,
  ClassificationRubric,
  localizedTierLabel,
  heuristicScoringRole,
  heuristicTuningType,
  usesHeuristicV2,
  usesLlmClassifier,
  usesClassifierContext,
  DEFAULT_HYBRID_BOUNDARY_MARGIN,
  HEURISTIC_FIRST_MAX_TIER_KEYS,
  effectiveClassifierType,
} from "./ComplexityRouterConfig";

const DEFAULT_SCORING_EXPLANATION =
  "The router scores each request across 7 built-in dimensions: token count, code presence, reasoning markers, technical " +
  "terms, simple indicators, multi-step patterns, and question complexity, plus any custom dimensions you add. " +
  "The weighted score determines the tier:";

const HEURISTIC_V2_EXPLANATION =
  "The router estimates success probability for all four tiers with its calibrated model, then selects " +
  "the first tier that meets the success threshold.";

const CLASSIFIER_TIMEOUT_ID = "classifier-timeout-ms";
const CLASSIFIER_CONTEXT_WINDOW_SIZE_ID = "classifier-context-window-size";
const CLASSIFIER_CONTEXT_BUDGET_CHARS_ID = "classifier-context-budget-chars";
const HYBRID_BOUNDARY_MARGIN_ID = "hybrid-boundary-margin";
const HEURISTIC_V2_SUCCESS_THRESHOLD_ID = "heuristic-v2-success-threshold";

/**
 * The three boundaries this card states, as displayed strings, or null until the proxy's shipped defaults
 * have arrived. Kept out of the component so the card cannot state a range the router stopped using, and
 * so the derivation does not add branches to an already dense render.
 */
const boundaryRanges = (
  shipped: Record<string, number> | undefined,
  overrides: Record<string, number> | undefined,
  reasoningOverrideMinScore: number | undefined,
): {
  simpleMedium: string;
  mediumComplex: string;
  complexReasoning: string;
  reasoningOverrideFloor: string;
} | null => {
  const effective: Record<string, number> = { ...shipped, ...overrides };
  const [low, mid, high] = [effective.simple_medium, effective.medium_complex, effective.complex_reasoning];
  if (low === undefined || mid === undefined || high === undefined) return null;
  return {
    simpleMedium: low.toFixed(2),
    mediumComplex: mid.toFixed(2),
    complexReasoning: high.toFixed(2),
    reasoningOverrideFloor: (reasoningOverrideMinScore ?? low).toFixed(2),
  };
};

const HowClassificationWorks: React.FC<{ value: ComplexityRouterConfigValue }> = ({ value }) => {
  const { t: uiT } = useDashboardLanguage();

  // The shipped boundaries come from the proxy, so this card cannot state ranges the router stopped using.
  const { data: scorerDefaults, isError } = useComplexityScorerDefaults();
  const scorerRuns = heuristicScoringRole(value) !== "never";
  const ranges = boundaryRanges(
    scorerDefaults?.tier_boundaries,
    value.tier_boundaries,
    value.reasoning_override_min_score,
  );
  const scorerDefaultsUnavailable = scorerRuns && !ranges && isError;

  if (value.custom_tier_set) return null;

  return (
    <Card className="bg-muted mt-4">
      <CardContent>
        <strong className="block mb-2 font-semibold">{uiT("ui.50a4962d2d11dda6")}</strong>
        <span className="text-[13px] text-muted-foreground">
          {usesHeuristicV2(value) ? HEURISTIC_V2_EXPLANATION : DEFAULT_SCORING_EXPLANATION}
          {usesHeuristicV2(value) &&
            (isHeuristicChain(value.classifier_type)
              ? " If no tier qualifies, or the local-check policy requires a judge, the judge chooses the tier."
              : " If none qualify, it selects Reasoning. It runs locally with no classifier API call.")}
        </span>
        {scorerRuns && ranges && (
          <ul className="mt-2 pl-5 text-[13px] text-muted-foreground">
            <li>
              <strong>{localizedTierLabel("SIMPLE", value.tier_labels)}</strong>
              {uiT("ui.5f83061b71d34f9d")} {ranges.simpleMedium}
            </li>
            <li>
              <strong>{localizedTierLabel("MEDIUM", value.tier_labels)}</strong>
              {uiT("ui.dd9d541dc71777da")} {ranges.simpleMedium} - {ranges.mediumComplex}
            </li>
            <li>
              <strong>{localizedTierLabel("COMPLEX", value.tier_labels)}</strong>
              {uiT("ui.dd9d541dc71777da")} {ranges.mediumComplex} - {ranges.complexReasoning}
            </li>
            <li>
              <strong>{localizedTierLabel("REASONING", value.tier_labels)}</strong>
              {uiT("ui.ead5c06e10eeb0ef")} {ranges.complexReasoning} {uiT("ui.452c501f07b2152d")}{" "}
              {ranges.reasoningOverrideFloor})
            </li>
          </ul>
        )}
        {scorerDefaultsUnavailable && (
          <span className="text-[13px] block mt-2 text-muted-foreground">{uiT("ui.0d8d5fa4e6626895")}</span>
        )}
      </CardContent>
    </Card>
  );
};

interface ClassificationMethodConfigProps {
  jevSection?: "all" | "advanced";
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  modelOptions: { value: string; label: string }[];
  effortOptionsByModel: Record<string, string[] | null | undefined>;
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  showValidationErrors?: boolean;
  /** The resolved default model - see resolveComplexityDefaultModel. Names and gates the radio. */
  defaultModel?: string;
  advancedOnly?: boolean;
  section?: "selection" | "classifier" | "heuristic";
}

export const InactiveHeuristicV2Threshold: React.FC<Pick<ClassificationMethodConfigProps, "value" | "onChange">> = ({
  value,
  onChange,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const threshold = value.heuristic_v2_success_threshold;
  if (usesHeuristicV2(value) || threshold === undefined) return null;
  const error = getHeuristicV2SuccessThresholdError(threshold);
  if (effectiveClassifierType(value) === "llm" && !error) return null;
  return (
    <section aria-label={uiT("ui.61764586321b87c8")} className="mb-4 space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">
        {uiT("ui.f7c00a7016fecde9")}{" "}
        <output aria-label={uiT("ui.65319994562cfc00")}>
          {Number.isFinite(threshold) ? threshold : uiT("ui.d3c7d623b5b17538")}
        </output>
      </p>
      <p className="text-sm text-muted-foreground">{uiT("ui.8980b13a9fda9a49")}</p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...value, heuristic_v2_success_threshold: undefined })}
      >
        {uiT("ui.0c321502a37d5da9")}
      </Button>
    </section>
  );
};

const ClassificationMethodConfig: React.FC<ClassificationMethodConfigProps> = ({
  value,
  onChange,
  modelOptions,
  effortOptionsByModel,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  showValidationErrors = false,
  defaultModel,
  advancedOnly = false,
  jevSection,
  section,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [draft, setDraft] = React.useState<{ id: string; raw: string } | null>(null);
  const hasDefaultModel = Boolean(defaultModel);
  const classifierType = effectiveClassifierType(value);
  const showSelection = section === undefined || section === "selection";
  const showClassifier = section === undefined || section === "classifier";
  const heuristic = heuristicTuningType(value);
  const showHeuristic = (section === undefined || section === "heuristic") && heuristic !== undefined;
  const showLocalChecks =
    showSelection && advancedOnly && ["llm", "heuristic_first", "hybrid"].includes(classifierType);
  const usesCustomPrompt = Boolean(value.classifier_llm_config?.system_prompt?.trim());
  const contextBudget = value.classifier_context_budget_chars ?? DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS;
  const contextBudgetQuotesNothing = contextBudget > 0 && contextBudget < MIN_QUOTED_CONTEXT_TURN_CHARS;
  const classificationRubric = value.classifier_llm_config?.classification_rubric ?? DEFAULT_CLASSIFICATION_RUBRIC;
  const classifierModel = value.classifier_llm_config?.model ?? "";
  const classifierReasoningEffort = value.classifier_llm_config?.reasoning_effort;
  const explicitlySupportedClassifierEfforts = effortOptionsByModel[classifierModel];
  const successThresholdError = getHeuristicV2SuccessThresholdError(value.heuristic_v2_success_threshold);
  const successThresholdDraft =
    draft?.id === HEURISTIC_V2_SUCCESS_THRESHOLD_ID &&
    Object.is(value.heuristic_v2_success_threshold, draft.raw.trim() === "" ? undefined : Number(draft.raw))
      ? draft.raw
      : null;

  const handleClassifierTypeChange = (classifierType: ClassifierType) => {
    onChange(transitionClassifierType(value, classifierType));
  };

  const handleHeuristicFirstMaxTierChange = (tier: string) => {
    onChange({ ...value, heuristic_first_max_tier: tier });
  };

  const handleHybridBoundaryMarginChange = (raw: string) => {
    setDraft({ id: HYBRID_BOUNDARY_MARGIN_ID, raw });
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    onChange({ ...value, hybrid_boundary_margin: Math.min(1, Math.max(0, parsed)) });
  };

  const handleSuccessThresholdChange = (raw: string) => {
    setDraft({ id: HEURISTIC_V2_SUCCESS_THRESHOLD_ID, raw });
    onChange({
      ...value,
      heuristic_v2_success_threshold: raw.trim() === "" ? undefined : Number(raw),
    });
  };

  // One write for everything the prompt dialog owns. The rubric arrives here rather than through the
  // rubric handler because two onChange calls in one tick would both spread this render's `value`,
  // so whichever landed second would drop the other's edit.
  const handleClassificationPromptChange = ({
    classificationPrompt,
    classificationExamples,
    classificationRubric: selectedRubric,
  }: OpeningPromptSelection) => {
    const rubricConfig: ClassifierLLMConfig = {
      ...value.classifier_llm_config,
      model: value.classifier_llm_config?.model ?? "",
      timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
      classification_rubric: selectedRubric,
    };
    const nextValue: ComplexityRouterConfigValue = {
      ...value,
      ...(selectedRubric && { classifier_llm_config: rubricConfig }),
      classification_prompt: classificationPrompt,
      classification_examples: classificationExamples,
    };
    onChange(nextValue);
  };

  const handleClassifierReasoningEffortChange = (reasoningEffort: ReasoningEffort | undefined) => {
    if (!value.classifier_llm_config) return;
    const { reasoning_effort: _reasoningEffort, ...classifierLlmConfig } = value.classifier_llm_config;
    onChange({
      ...value,
      classifier_llm_config:
        reasoningEffort === undefined
          ? classifierLlmConfig
          : { ...classifierLlmConfig, reasoning_effort: reasoningEffort },
    });
  };

  const handleClassifierTimeoutChange = (timeoutMs: number) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: timeoutMs,
      },
    });
  };

  const handleClassificationRubricChange = (classificationRubric: ClassificationRubric) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
        classification_rubric: classificationRubric,
      },
    });
  };

  const handleClassifierSystemPromptChange = (systemPrompt: string | undefined) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
        system_prompt: systemPrompt,
      },
    });
  };

  const handleClassifierFallbackChange = (fallback: ClassifierFallback) => {
    onChange({ ...value, classifier_fallback: fallback });
  };

  const handleClassifierContextWindowSizeChange = (windowSize: number) => {
    onChange({
      ...value,
      classifier_context_window_size: windowSize,
    });
  };

  const handleClassifierContextBudgetCharsChange = (budgetChars: number) => {
    onChange({
      ...value,
      classifier_context_budget_chars: budgetChars,
    });
  };

  const handleClassifierIntegerChange = (
    id: string,
    raw: string,
    minimum: number,
    onCommit: (value: number) => void,
  ) => {
    setDraft({ id, raw });
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    onCommit(Math.max(minimum, Math.round(parsed)));
  };

  const handleClassifierContextIncludeAssistantTurnsChange = (includeAssistantTurns: boolean) => {
    onChange({
      ...value,
      classifier_context_include_assistant_turns: includeAssistantTurns,
    });
  };

  return (
    <>
      {!advancedOnly && showSelection && (
        <>
          <ClassifierTypeRadios
            value={value}
            classifierType={classifierType}
            onTypeChange={handleClassifierTypeChange}
          />
          <ClassifierPrimarySettings
            value={value}
            onChange={onChange}
            modelOptions={modelOptions}
            showValidationErrors={showValidationErrors}
          />
        </>
      )}
      {showLocalChecks && (
        <div className="space-y-2">
          <Label htmlFor="auto-router-local-checks">{uiT("ui.587adbf0f83373fc")}</Label>
          <Select
            items={[
              { value: "llm", label: uiT("ui.96e8851fe8c01861") },
              { value: "heuristic_first", label: uiT("ui.8852895e39d1ef73") },
              { value: "hybrid", label: uiT("ui.6c67dc13f83949fe") },
            ]}
            value={classifierType}
            onValueChange={(next) => {
              if (next === "llm" || next === "heuristic_first" || next === "hybrid") handleClassifierTypeChange(next);
            }}
          >
            <SelectTrigger id="auto-router-local-checks" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llm">{uiT("ui.96e8851fe8c01861")}</SelectItem>
              <SelectItem value="heuristic_first" disabled={Boolean(value.custom_tier_set)}>
                {uiT("ui.8852895e39d1ef73")}
              </SelectItem>
              <SelectItem value="hybrid" disabled={Boolean(value.custom_tier_set)}>
                {uiT("ui.6c67dc13f83949fe")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showSelection && isHeuristicChain(classifierType) && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="auto-router-local-heuristic">{uiT("ui.012b740576c82492")}</Label>
          <ClassifierMenu
            id="auto-router-local-heuristic"
            label={uiT("ui.012b740576c82492")}
            selectedLabel={value.local_heuristic === "heuristic_v2" ? "Heuristic v2" : "Heuristic v1 (rule-based)"}
            feature={value.local_heuristic === "heuristic_v2" ? "heuristic_v2" : undefined}
            value={value.local_heuristic ?? "heuristic"}
            onValueChange={(next) => {
              if (next === "heuristic" || next === "heuristic_v2") onChange({ ...value, local_heuristic: next });
            }}
          >
            <ClassifierOption
              value="heuristic"
              label={uiT("ui.5d10fab28dab5733")}
              description={uiT("ui.40c9e9dc135697b6")}
            />
            <ClassifierOption
              value="heuristic_v2"
              label={uiT("ui.183bc446ae6a17b0")}
              description={uiT("ui.0159aabf8e87abea")}
              feature="heuristic_v2"
            />
          </ClassifierMenu>
        </div>
      )}

      {showClassifier && classifierType === "custom" && (
        <ClassifierPluginTimeoutField value={value} onChange={onChange} showValidationErrors={showValidationErrors} />
      )}

      {showHeuristic && heuristic === "heuristic_v2" && (
        <div className="mt-4 space-y-2">
          <Label htmlFor={HEURISTIC_V2_SUCCESS_THRESHOLD_ID} className="block font-semibold">
            {uiT("ui.1aa1464a1d10fbc5")}
          </Label>
          <Input
            id={HEURISTIC_V2_SUCCESS_THRESHOLD_ID}
            type="text"
            inputMode="decimal"
            placeholder={uiT("ui.240b4b80536bd321")}
            value={successThresholdDraft ?? value.heuristic_v2_success_threshold?.toString() ?? ""}
            onChange={(event) => handleSuccessThresholdChange(event.target.value)}
            onBlur={() => {
              if (!successThresholdError) setDraft(null);
            }}
            aria-invalid={Boolean(successThresholdError)}
            aria-describedby={`${HEURISTIC_V2_SUCCESS_THRESHOLD_ID}-help${successThresholdError ? ` ${HEURISTIC_V2_SUCCESS_THRESHOLD_ID}-error` : ""}`}
          />
          <p id={`${HEURISTIC_V2_SUCCESS_THRESHOLD_ID}-help`} className="text-sm text-muted-foreground">
            {uiT("ui.f02d8f5407ad8b3e")}
          </p>
          {successThresholdError && (
            <p id={`${HEURISTIC_V2_SUCCESS_THRESHOLD_ID}-error`} className="text-sm text-destructive" role="alert">
              {successThresholdError}
            </p>
          )}
        </div>
      )}

      {showSelection && classifierType === "heuristic_first" && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="auto-router-local-max-tier" className="block font-semibold">
            {uiT("ui.f1c4caeb6d8c3bed")}
          </Label>
          <Select
            value={value.heuristic_first_max_tier}
            onValueChange={(tier: unknown) => handleHeuristicFirstMaxTierChange(tier as string)}
          >
            <SelectTrigger id="auto-router-local-max-tier" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEURISTIC_FIRST_MAX_TIER_KEYS.map((tier) => (
                <SelectItem key={tier} value={tier}>
                  {localizedTierLabel(tier, value.tier_labels)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {usesHeuristicV2(value) ? uiT("ui.203f20d8e7cf95c1") : uiT("ui.3d16fbc44666cf9c")}
          </p>
        </div>
      )}

      {showSelection && classifierType === "hybrid" && (
        <div className="mt-4 space-y-2">
          <Label htmlFor={HYBRID_BOUNDARY_MARGIN_ID} className="block font-semibold">
            {usesHeuristicV2(value) ? uiT("ui.4a44de03fad9a515") : uiT("ui.956f5152d0693e6e")}
          </Label>
          <Input
            id={HYBRID_BOUNDARY_MARGIN_ID}
            type="text"
            inputMode="decimal"
            value={
              draft?.id === HYBRID_BOUNDARY_MARGIN_ID
                ? draft.raw
                : String(value.hybrid_boundary_margin ?? DEFAULT_HYBRID_BOUNDARY_MARGIN)
            }
            onChange={(event) => handleHybridBoundaryMarginChange(event.target.value)}
            onBlur={() => setDraft(null)}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            {usesHeuristicV2(value) ? uiT("ui.cbfcf0e2df381f11") : uiT("ui.36cfeb5b1aa1b852")}
          </p>
        </div>
      )}

      {showClassifier && classifierType === "jev" && (
        <JevClassifierConfig value={value} onChange={onChange} section={jevSection} />
      )}
      {showClassifier && usesLlmClassifier(classifierType) && (
        <div className="mt-4 space-y-3">
          <ClassifierReasoningEffortSelect
            model={classifierModel}
            value={classifierReasoningEffort}
            explicitlySupported={explicitlySupportedClassifierEfforts}
            onChange={handleClassifierReasoningEffortChange}
          />
          <div>
            <Label htmlFor={CLASSIFIER_TIMEOUT_ID} className="block mb-1 font-semibold">
              {uiT("ui.3b453bc8bd286be4")}
            </Label>
            <Input
              id={CLASSIFIER_TIMEOUT_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_TIMEOUT_ID
                  ? draft.raw
                  : String(value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_TIMEOUT_ID,
                  event.target.value,
                  1,
                  handleClassifierTimeoutChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{uiT("ui.7d23638c10f139b6")}</span>
          </div>
          <ClassifierCircuitBreakerConfig
            value={value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS }}
            onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
          />
          <ClassifierVisionConfig
            value={value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS }}
            onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="font-semibold">{uiT("ui.fd9a68dac9ec03a4")}</strong>
              <SimpleTooltip content={uiT("ui.9ffc313ca97bd907")}>
                <Info className="size-4 text-muted-foreground" />
              </SimpleTooltip>
            </div>
            <AutoRouterAllowanceNote feature="tier_or_classifier_prompt" label={uiT("ui.3010cb55c7170262")} />
            {!value.custom_tier_set && usesCustomPrompt ? (
              <ClassifierPromptEditor
                systemPrompt={value.classifier_llm_config?.system_prompt}
                onChange={handleClassifierSystemPromptChange}
                contextWindowSize={value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE}
                tierLabels={value.tier_labels}
                classificationRubric={classificationRubric}
              />
            ) : (
              <OpeningPromptEditor
                classificationPrompt={value.classification_prompt}
                classificationExamples={value.classification_examples}
                onChange={handleClassificationPromptChange}
                tierSource={
                  value.custom_tier_set
                    ? { kind: "custom", tierRows: value.custom_tier_set.tiers }
                    : {
                        kind: "builtIn",
                        tierLabels: value.tier_labels,
                        classificationRubric,
                        rubricRestriction: restrictedBy(value, "classificationRubric")?.reason,
                      }
                }
                contextWindowSize={value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE}
              />
            )}
          </div>
        </div>
      )}
      {showClassifier && usesClassifierContext(classifierType) && (
        <div className="mt-4 space-y-3">
          <RestrictedSection heading="If the classifier fails" by={restrictedBy(value, "classifierFallback")}>
            <RadioGroup
              value={value.classifier_fallback ?? DEFAULT_CLASSIFIER_FALLBACK}
              onValueChange={(fallback: unknown) => handleClassifierFallbackChange(fallback as ClassifierFallback)}
            >
              <div className="inline-flex flex-col gap-2">
                <Label className="items-start font-normal leading-normal">
                  <RadioGroupItem value="heuristic" className="mt-0.5" />
                  <span>
                    <span>{uiT("ui.e022796c82bebb25")}</span>{" "}
                    <span className="text-muted-foreground">{uiT("ui.c9c82df507f4a368")}</span>
                  </span>
                </Label>
                <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                  <RadioGroupItem value="default_model" disabled={!hasDefaultModel} className="mt-0.5" />
                  <SimpleTooltip content={hasDefaultModel ? uiT("ui.c7d0b5d2c0642e35") : uiT("ui.7b32635d6739a7da")}>
                    <span>
                      <span>
                        {uiT("ui.58fb4599caaf9b5f")}
                        {defaultModel ? ` (${defaultModel})` : ""}
                      </span>{" "}
                      <span className="text-muted-foreground">{uiT("ui.4face5692af7c4f3")}</span>
                    </span>
                  </SimpleTooltip>
                </Label>
              </div>
            </RadioGroup>
            <span className="block text-xs text-muted-foreground">{uiT("ui.5fee9477fe1cfcff")}</span>
          </RestrictedSection>
          <div>
            <Label htmlFor={CLASSIFIER_CONTEXT_WINDOW_SIZE_ID} className="block mb-1 font-semibold">
              {uiT("ui.c8275bc8cc032aa3")}
            </Label>
            <Input
              id={CLASSIFIER_CONTEXT_WINDOW_SIZE_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_CONTEXT_WINDOW_SIZE_ID
                  ? draft.raw
                  : String(value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_CONTEXT_WINDOW_SIZE_ID,
                  event.target.value,
                  0,
                  handleClassifierContextWindowSizeChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{uiT("ui.4331f72599aee93e")}</span>
          </div>
          <div>
            <Label htmlFor={CLASSIFIER_CONTEXT_BUDGET_CHARS_ID} className="block mb-1 font-semibold">
              {uiT("ui.398e12710615e685")}
            </Label>
            <Input
              id={CLASSIFIER_CONTEXT_BUDGET_CHARS_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_CONTEXT_BUDGET_CHARS_ID
                  ? draft.raw
                  : String(value.classifier_context_budget_chars ?? DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_CONTEXT_BUDGET_CHARS_ID,
                  event.target.value,
                  0,
                  handleClassifierContextBudgetCharsChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">{uiT("ui.a420446646e34757")}</span>
            {contextBudgetQuotesNothing && (
              <span className="block text-xs text-destructive">
                {uiT("ui.80e4ad056bd7eb90")} {MIN_QUOTED_CONTEXT_TURN_CHARS} {uiT("ui.56922d2dac0fe441")}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Switch
                checked={value.classifier_context_include_assistant_turns ?? false}
                onCheckedChange={handleClassifierContextIncludeAssistantTurnsChange}
                size="sm"
                aria-label={uiT("ui.03697ecba4ba218a")}
              />
              <strong className="font-semibold">{uiT("ui.03697ecba4ba218a")}</strong>
              <SimpleTooltip content={uiT("ui.4d76f8e9ec3cfaec")}>
                <Info className="size-4 text-muted-foreground" />
              </SimpleTooltip>
            </div>
            <span className="text-xs text-muted-foreground">{uiT("ui.4b8bdb7213e214b1")}</span>
          </div>
        </div>
      )}

      {showHeuristic && heuristic === "heuristic" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <strong className="font-semibold">{uiT("ui.a2c3df5830501c58")}</strong>
            <SimpleTooltip content={uiT("ui.44f474a7de92808c")}>
              <Info className="size-4 text-muted-foreground" />
            </SimpleTooltip>
          </div>
          <span className="block mb-2 text-xs text-muted-foreground">{uiT("ui.2f53bacf78286bba")}</span>
          <MultiSelect
            options={(customTechnicalKeywords ?? []).map((keyword) => ({ label: keyword, value: keyword }))}
            value={customTechnicalKeywords ?? []}
            onValueChange={(keywords: string[]) =>
              onCustomTechnicalKeywordsChange?.(
                Array.from(
                  new Set(keywords.flatMap((keyword) => keyword.split(",").map((part) => part.trim())).filter(Boolean)),
                ),
              )
            }
            placeholder={uiT("ui.544ab9e547a89ba4")}
            emptyText={uiT("ui.7635c2806654fb2d")}
            allowCustomValues
            className="w-full"
          />
        </div>
      )}

      {showHeuristic && heuristic === "heuristic" && (
        <>
          {heuristicScoringRole(value) === "decides" && (
            <AutoRouterAllowanceNote feature="heuristic_tuning" label={uiT("ui.258c2e89eaaac5dd")} />
          )}
          <HeuristicScoringConfig value={value} onChange={onChange} />
          <section className="mt-4 space-y-3">
            <h4 className="font-semibold">{uiT("ui.9af57fcb37dfa86f")}</h4>
            <HeuristicKeywordOverrides value={value} onChange={onChange} />
          </section>
        </>
      )}
      {showHeuristic && <HowClassificationWorks value={value} />}
    </>
  );
};

export default ClassificationMethodConfig;
