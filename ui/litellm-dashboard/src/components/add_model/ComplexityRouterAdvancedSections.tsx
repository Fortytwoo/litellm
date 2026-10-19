"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { ModelGroup } from "@/components/llm_calls/fetch_models";
import {
  effectiveClassifierType,
  heuristicTuningType,
  usesClassifierContext,
  usesLlmClassifier,
  type ComplexityRouterConfigValue,
} from "./ComplexityRouterConfig";
import AdaptiveRoutingConfig from "./AdaptiveRoutingConfig";
import CacheAwareRoutingConfig from "./CacheAwareRoutingConfig";
import ClassificationMethodConfig from "./ClassificationMethodConfig";
import ForecastClassifierConfig from "./ForecastClassifierConfig";
import ContextWindowEscalationConfig from "./ContextWindowEscalationConfig";
import ResponseFormatControls from "./ResponseFormatControls";
import StallEscalationConfig from "./StallEscalationConfig";
import { Restricted, restrictedBy } from "./TierRestrictions";
import EscalationKeywords from "./EscalationKeywords";
import KeywordTierRules, { type KeywordTierRule } from "./KeywordTierRules";
import SemanticKeywordMatching from "./SemanticKeywordMatching";
import CompressionControls from "./CompressionControls";
import PlanModeOverrideControls from "./PlanModeOverrideControls";
import { AffinityControls } from "./AffinityControls";
import { ModalityRoutingControls } from "./ModalityRoutingControls";
import HousekeepingRoutingControls from "./HousekeepingRoutingControls";
import ReminderMarkers from "./ReminderMarkers";
import type { AutoRouterCompressionState } from "./buildAutoRouterCompression";
import { activeTierName, type TierRow } from "./tier_rows";

interface ComplexityRouterAdvancedSectionsProps {
  hideClassifier?: boolean;
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  forecast: boolean;
  modelOptions: { value: string; label: string }[];
  classifierEffortOptionsByModel: Record<string, string[] | null | undefined>;
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  showValidationErrors: boolean;
  defaultModel?: string;
  planModeTierOptions: { value: string; label: string }[];
  keywordTierRules: KeywordTierRule[];
  onKeywordTierRulesChange?: (rules: KeywordTierRule[]) => void;
  semanticMatchingEnabled: boolean;
  onSemanticMatchingEnabledChange?: (enabled: boolean) => void;
  embeddingModel?: string;
  onEmbeddingModelChange: (model: string) => void;
  matchThreshold: number;
  onMatchThresholdChange: (threshold: number) => void;
  escalationKeywords: string[];
  onEscalationKeywordsChange?: (keywords: string[]) => void;
  autoRouterCompression: AutoRouterCompressionState;
  onAutoRouterCompressionChange?: (state: AutoRouterCompressionState) => void;
  modelInfo: ModelGroup[];
  tierRows: TierRow[];
  customTierSet: ComplexityRouterConfigValue["custom_tier_set"];
}

const ComplexityRouterAdvancedSections: React.FC<ComplexityRouterAdvancedSectionsProps> = ({
  hideClassifier,
  value,
  onChange,
  forecast,
  modelOptions,
  classifierEffortOptionsByModel,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  showValidationErrors,
  defaultModel,
  planModeTierOptions,
  keywordTierRules,
  onKeywordTierRulesChange,
  semanticMatchingEnabled,
  onSemanticMatchingEnabledChange,
  embeddingModel,
  onEmbeddingModelChange,
  matchThreshold,
  onMatchThresholdChange,
  escalationKeywords,
  onEscalationKeywordsChange,
  autoRouterCompression,
  onAutoRouterCompressionChange,
  modelInfo,
  tierRows,
  customTierSet,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const classifierType = effectiveClassifierType(value);
  const classificationProps = {
    advancedOnly: true,
    value,
    onChange,
    modelOptions,
    effortOptionsByModel: classifierEffortOptionsByModel,
    customTechnicalKeywords,
    onCustomTechnicalKeywordsChange,
    showValidationErrors,
    defaultModel,
  };
  const sections = [
    ...(forecast
      ? [
          {
            key: "classifier",
            label: <strong className="text-foreground font-semibold">{uiT("ui.25cf9f63e90936ec")}</strong>,
            children: (
              <ForecastClassifierConfig
                section="advanced"
                value={value}
                onChange={onChange}
                modelOptions={modelOptions}
                effortOptionsByModel={classifierEffortOptionsByModel}
              />
            ),
          },
        ]
      : []),
    ...(!forecast && (usesClassifierContext(classifierType) || classifierType === "custom")
      ? [
          {
            key: "classifier",
            label: <strong className="text-foreground font-semibold">{uiT("ui.a7042e1364bd9768")}</strong>,
            children: <ClassificationMethodConfig {...classificationProps} section="classifier" />,
          },
        ]
      : []),
    ...(heuristicTuningType(value)
      ? [
          {
            key: "heuristic",
            label: <strong className="text-foreground font-semibold">{uiT("ui.18476df3cb7fbb41")}</strong>,
            children: <ClassificationMethodConfig {...classificationProps} section="heuristic" />,
          },
        ]
      : []),
    {
      key: "adaptive",
      label: <strong className="text-foreground font-semibold">{uiT("ui.1497a935a630e27e")}</strong>,
      children: (
        <Restricted by={restrictedBy(value, "adaptive")}>
          <AdaptiveRoutingConfig value={value} onChange={onChange} />
        </Restricted>
      ),
    },
    {
      key: "affinity",
      label: <strong className="text-foreground font-semibold">{uiT("ui.5a2e54bbcb99c026")}</strong>,
      children: <AffinityControls value={value} onChange={onChange} />,
    },
    {
      key: "cache-aware",
      label: <strong className="text-foreground font-semibold">{uiT("ui.d45c5045a8529734")}</strong>,
      children: <CacheAwareRoutingConfig value={value} onChange={onChange} />,
    },
    {
      key: "modality",
      label: <strong className="text-foreground font-semibold">{uiT("ui.94262bf3c4d30a5b")}</strong>,
      children: <ModalityRoutingControls value={value} onChange={onChange} />,
    },
    {
      key: "plan-mode",
      label: <strong className="text-foreground font-semibold">{uiT("ui.da7a99dffc4f66f7")}</strong>,
      children: (
        <PlanModeOverrideControls value={value} onChange={onChange} planModeTierOptions={planModeTierOptions} />
      ),
    },
    {
      key: "housekeeping",
      label: <strong className="text-foreground font-semibold">{uiT("ui.98a086d7e4c682d5")}</strong>,
      children: <HousekeepingRoutingControls value={value} onChange={onChange} />,
    },
    {
      key: "reminder-markers",
      label: <strong className="text-foreground font-semibold">{uiT("ui.c8a1f8dbe8b8fcee")}</strong>,
      children: <ReminderMarkers value={value} onChange={onChange} showValidationErrors={showValidationErrors} />,
    },
    {
      key: "context-window",
      label: <strong className="text-foreground font-semibold">{uiT("ui.0cd4e951476d4264")}</strong>,
      children: <ContextWindowEscalationConfig value={value} onChange={onChange} />,
    },
    {
      key: "stall-escalation",
      label: <strong className="text-foreground font-semibold">{uiT("ui.3f260a05d0c537ee")}</strong>,
      children: (
        <Restricted by={restrictedBy(value, "stallEscalation")}>
          <StallEscalationConfig value={value} onChange={onChange} />
        </Restricted>
      ),
    },
    {
      key: "response",
      label: <strong className="text-foreground font-semibold">{uiT("ui.26f1e31b9c70f5bb")}</strong>,
      children: <ResponseFormatControls value={value} onChange={onChange} />,
    },
    ...(onEscalationKeywordsChange
      ? [
          {
            key: "escalation",
            label: <strong className="text-foreground font-semibold">{uiT("ui.bed538d7dd9bc498")}</strong>,
            children: (
              <Restricted by={restrictedBy(value, "escalation")}>
                <EscalationKeywords keywords={escalationKeywords} onChange={onEscalationKeywordsChange} />
              </Restricted>
            ),
          },
        ]
      : []),
    ...(onAutoRouterCompressionChange
      ? [
          {
            key: "compression",
            label: <strong className="text-foreground font-semibold">{uiT("ui.278b1b2a9c84730f")}</strong>,
            children: <CompressionControls value={autoRouterCompression} onChange={onAutoRouterCompressionChange} />,
          },
        ]
      : []),
    ...(onKeywordTierRulesChange || onSemanticMatchingEnabledChange
      ? [
          {
            key: "keyword-semantic",
            label: <strong className="text-foreground font-semibold">{uiT("ui.e19881d337e822d1")}</strong>,
            children: (
              <>
                {onKeywordTierRulesChange && (
                  <KeywordTierRules
                    rules={keywordTierRules}
                    onChange={onKeywordTierRulesChange}
                    tierLabels={value.tier_labels}
                    tierNames={customTierSet || forecast ? tierRows.map(activeTierName).filter(Boolean) : undefined}
                  />
                )}
                {onKeywordTierRulesChange && onSemanticMatchingEnabledChange && <Separator className="my-4" />}
                {onSemanticMatchingEnabledChange && (
                  <SemanticKeywordMatching
                    enabled={semanticMatchingEnabled}
                    onEnabledChange={onSemanticMatchingEnabledChange}
                    embeddingModel={embeddingModel}
                    onEmbeddingModelChange={onEmbeddingModelChange}
                    matchThreshold={matchThreshold}
                    onMatchThresholdChange={onMatchThresholdChange}
                    modelInfo={modelInfo}
                    showValidationErrors={showValidationErrors}
                  />
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  const groups = [
    { label: uiT("ui.18476df3cb7fbb41"), keys: ["heuristic"] },
    {
      label: usesLlmClassifier(classifierType) ? uiT("ui.9d1ebe6c39407547") : uiT("ui.25cf9f63e90936ec"),
      keys: ["classifier"],
    },
    { label: uiT("ui.1b1797e1a04c03c3"), keys: ["reminder-markers"] },
    {
      label: uiT("ui.a5beb31f585070f6"),
      keys: [
        "modality",
        "plan-mode",
        "housekeeping",
        "context-window",
        "stall-escalation",
        "escalation",
        "keyword-semantic",
      ],
    },
    { label: uiT("ui.c94396a09b476de6"), keys: ["affinity", "adaptive", "cache-aware", "compression"] },
    { label: uiT("ui.b37ddf1f6e0fac69"), keys: ["response"] },
  ].filter(
    (group) =>
      !(hideClassifier && group.keys.includes("classifier")) && sections.some(({ key }) => group.keys.includes(key)),
  );
  const [openGroups, setOpenGroups] = React.useState<string[]>(() =>
    showValidationErrors ? groups.map((group) => group.label) : [],
  );
  const [previousValidation, setPreviousValidation] = React.useState(showValidationErrors);
  if (previousValidation !== showValidationErrors) {
    setPreviousValidation(showValidationErrors);
    if (showValidationErrors) setOpenGroups(groups.map((group) => group.label));
  }
  return (
    <div>
      {["llm", "heuristic_first", "hybrid"].includes(classifierType) && (
        <div className="px-4 py-3">
          <ClassificationMethodConfig {...classificationProps} section="selection" />
        </div>
      )}
      {groups.map((group) => (
        <Collapsible
          key={group.label}
          open={openGroups.includes(group.label)}
          onOpenChange={(open) =>
            setOpenGroups((current) =>
              open ? [...current, group.label] : current.filter((label) => label !== group.label),
            )
          }
          className="border-b border-border last:border-b-0"
        >
          <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left font-medium">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
            {group.label}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 px-4 pb-4">
            {sections
              .filter(
                ({ key }) =>
                  group.keys.includes(key) &&
                  (!forecast || !["adaptive", "context-window", "escalation"].includes(key)),
              )
              .map(({ key, label, children }) => (
                <section key={key} className="space-y-3">
                  {key !== "classifier" && key !== "heuristic" && <h4>{label}</h4>}
                  {children}
                </section>
              ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default ComplexityRouterAdvancedSections;
