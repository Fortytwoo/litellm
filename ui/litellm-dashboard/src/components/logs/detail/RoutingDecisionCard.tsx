"use client";
import { formatMoney } from "@/utils/currency";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Waypoints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

export interface RoutingDecisionTierBoundaries {
  simple_medium?: number;
  medium_complex?: number;
  complex_reasoning?: number;
}

export interface RoutingDecision {
  router_model_name?: string;
  router_type?: string;
  routed_model?: string;
  cause?: string;
  tier?: string;
  tier_label?: string;
  request_type?: string;
  score?: number;
  signals?: string[];
  matched_keyword?: string;
  escalation_keyword?: string;
  classifier_model?: string;
  classifier_p_solve?: number;
  classifier_calibrated_p_solve?: number;
  classifier_threshold?: number;
  classifier_capability_boundary?: string;
  classifier_primary_rule?: string;
  classifier_calibration_version?: string;
  classifier_efficient_p_solve?: number;
  classifier_capable_p_solve?: number;
  classifier_calibrated_efficient_p_solve?: number;
  classifier_calibrated_capable_p_solve?: number;
  classifier_max_quality_gap?: number;
  classifier_confidence?: number;
  classifier_probabilities?: Record<string, number>;
  classifier_cost?: number;
  escalated?: boolean;
  tier_boundaries?: RoutingDecisionTierBoundaries;
  reasoning_override_min_score?: number;
  heuristic_v2_forecast?: {
    probabilities: Record<string, number>;
    threshold: number;
    predicted_tier: string;
    request_type: string;
  };
}

const ROUTER_TYPE_LABELS: Record<string, string> = {
  get complexity() {
    return translateUi("ui.faab7169e1ae2161");
  },
  get adaptive() {
    return translateUi("ui.740efff4f57d67b0");
  },
  get quality() {
    return translateUi("ui.ef82c41cae35f5ce");
  },
};

/**
 * The tier the score alone would have produced, given the boundaries in effect when
 * the decision was made. Rendered as the bracket that explains a score, so it must
 * use the snapshot rather than today's config.
 */
function describeScoreAgainstBoundaries(
  score: number,
  boundaries?: RoutingDecisionTierBoundaries,
  renamed?: boolean,
): string | null {
  if (!boundaries) return null;
  const {
    simple_medium: simpleMedium,
    medium_complex: mediumComplex,
    complex_reasoning: complexReasoning,
  } = boundaries;
  if (simpleMedium === undefined || mediumComplex === undefined || complexReasoning === undefined) return null;

  const named = (range: string, tier: string): string => (renamed ? range : `${range}, ${tier}`);
  if (score < simpleMedium) return named(`below ${simpleMedium}`, "SIMPLE");
  if (score < mediumComplex) return named(`${simpleMedium} to ${mediumComplex}`, "MEDIUM");
  if (score < complexReasoning) return named(`${mediumComplex} to ${complexReasoning}`, "COMPLEX");
  return named(`at or above ${complexReasoning}`, "REASONING");
}

function describePlanModeFloor(matchedKeyword: string | undefined): string {
  if (matchedKeyword === "exit_plan_mode") return "Plan-mode floor (exit_plan_mode tool)";
  if (matchedKeyword) return `Plan-mode floor: "${matchedKeyword}"`;
  return "Plan-mode floor";
}

/**
 * The sentinel is the whole reason this row is worth reading: it is the string an operator
 * would add to housekeeping_patterns to cover another client, so naming it turns the row into
 * the instruction. Without it the drawer says only that the classifier was skipped.
 */
function describeHousekeeping(matchedKeyword: string | undefined): string {
  if (matchedKeyword) return `Client housekeeping call: "${matchedKeyword}"`;
  return "Client housekeeping call, classifier skipped";
}

/** Rows logged before the floor was recorded name what it tracked back then instead of a number. */
function describeReasoningOverride(tierLabel: string | undefined, floor: number | undefined): string {
  const stated = floor === undefined ? "the Simple to Medium boundary" : String(floor);
  return `Heuristic, ${tierLabel ?? "REASONING"} override (2 or more reasoning markers, score of at least ${stated})`;
}

const CONSTANT_CAUSE_LABELS: Record<string, string> = {
  get heuristic_scorer() {
    return translateUi("ui.2ec42c3908060267");
  },
  get heuristic_v2() {
    return translateUi("ui.183bc446ae6a17b0");
  },
  get capability_classifier() {
    return translateUi("ui.5faf58a69db59058");
  },
  get capability_classifier_fallback() {
    return translateUi("ui.cdaf79afe10f85df");
  },
  get llm_v2_classifier() {
    return translateUi("ui.91797000a96044a6");
  },
  get llm_v2_fallback() {
    return translateUi("ui.fd9a42504fc2eebb");
  },
  get heuristic_first_short_circuit() {
    return translateUi("ui.ff36e4f99e7b9b60");
  },
  get hybrid_short_circuit() {
    return translateUi("ui.8824601590f28a1a");
  },
  get classifier_plugin() {
    return translateUi("ui.e047f28894106ca9");
  },
  get semantic_keyword_match() {
    return translateUi("ui.8e3060e2bfddf081");
  },
  get session_affinity_pin() {
    return translateUi("ui.775658f204b3776c");
  },
  get session_affinity_escalation() {
    return translateUi("ui.aeb20725e1cfeed3");
  },
  get user_turn_continuation() {
    return translateUi("ui.e8c04e0e4b3934c6");
  },
  get modality_escalation() {
    return translateUi("ui.df18f84e638695a6");
  },
  get modality_pin_override() {
    return translateUi("ui.7d6b5ad2bd9bbad8");
  },
  get quality_tier() {
    return translateUi("ui.7457f9479aae2a50");
  },
  get bandit() {
    return translateUi("ui.824dda5900a2f8c5");
  },
  get default_fallback() {
    return translateUi("ui.f531d70bb09ae1de");
  },
  get classifier_fallback() {
    return translateUi("ui.18d73b7a44ffa47f");
  },
  get default_model_fallback() {
    return translateUi("ui.b881fa4f2255c42b");
  },
};

function describeCause(decision: RoutingDecision): string {
  const {
    cause,
    classifier_model: classifierModel,
    matched_keyword: matchedKeyword,
    tier_label: tierLabel,
    reasoning_override_min_score: overrideFloor,
  } = decision;

  const constant = cause ? CONSTANT_CAUSE_LABELS[cause] : undefined;
  if (constant) return constant;

  switch (cause) {
    case "reasoning_override":
      return describeReasoningOverride(tierLabel, overrideFloor);
    case "llm_classifier":
      return classifierModel ? `LLM classifier (${classifierModel})` : "LLM classifier";
    case "jev_classifier":
      return "OSS classifier";
    case "literal_keyword_match":
    case "keyword":
      return matchedKeyword ? `Keyword match: "${matchedKeyword}"` : "Keyword match";
    case "plan_mode":
      return describePlanModeFloor(matchedKeyword);
    case "housekeeping":
      return describeHousekeeping(matchedKeyword);
    default:
      return cause ?? "Unknown";
  }
}

/**
 * A request can ask to escalate and get nowhere, when its tier is already the highest
 * one configured. That row still has to say the caller asked, otherwise it reads as an
 * ordinary route; it just must not claim a bump that did not happen. Only called when
 * the request escalated or asked to, so there is no "did not escalate" case.
 */
function describeEscalation(escalated: boolean, keyword: string | undefined): string {
  if (escalated) return keyword ? `Yes, keyword "${keyword}"` : "Yes";
  return keyword ? `Requested via "${keyword}"; already at the highest tier` : "Requested; already at the highest tier";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function PercentageRow({ label, value, unit = "%" }: { label: string; value?: number; unit?: string }) {
  if (value === undefined) return null;
  return (
    <Row label={label}>
      <span className="tabular-nums">{`${(value * 100).toFixed(1)}${unit}`}</span>
    </Row>
  );
}

function CapabilityForecast({ decision }: { decision: RoutingDecision }) {
  const { t: uiT } = useDashboardLanguage();

  const {
    classifier_p_solve: raw,
    classifier_calibrated_p_solve: calibrated,
    classifier_threshold: threshold,
    classifier_capability_boundary: boundary,
    classifier_primary_rule: rule,
    classifier_calibration_version: version,
  } = decision;
  if ([raw, calibrated, threshold, boundary, rule].every((value) => value === undefined)) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-1 text-sm font-medium">{uiT("ui.9be04ce1fc1a")}</div>
      <div className="mb-2 text-xs text-muted-foreground">{uiT("ui.5f7be05d644e")}</div>
      <PercentageRow label={uiT("ui.848123d14f84")} value={raw} />
      <PercentageRow label={uiT("ui.0c66fb7bd4db")} value={calibrated} />
      <PercentageRow label={uiT("ui.0da627ada476")} value={threshold} />
      {boundary && <Row label={uiT("ui.fcf4b1a7548c")}>{boundary}</Row>}
      {rule && <Row label={uiT("ui.62845f31a2fe")}>{rule}</Row>}
      {version && <Row label={uiT("ui.252526ecd431")}>{version}</Row>}
    </div>
  );
}

function FuseV2Forecast({ decision }: { decision: RoutingDecision }) {
  const { t: uiT } = useDashboardLanguage();

  const {
    classifier_efficient_p_solve: rawEfficient,
    classifier_capable_p_solve: rawCapable,
    classifier_calibrated_efficient_p_solve: calibratedEfficient,
    classifier_calibrated_capable_p_solve: calibratedCapable,
    classifier_max_quality_gap: allowedGap,
    classifier_calibration_version: version,
  } = decision;
  if ([rawEfficient, rawCapable, calibratedEfficient, calibratedCapable, allowedGap].every((v) => v === undefined)) {
    return null;
  }
  const isCalibrated = [calibratedEfficient, calibratedCapable, version].some((value) => value !== undefined);
  const efficient = isCalibrated ? calibratedEfficient : rawEfficient;
  const capable = isCalibrated ? calibratedCapable : rawCapable;
  const gap = efficient !== undefined && capable !== undefined ? capable - efficient : undefined;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-1 text-sm font-medium">{uiT("ui.7cc01eeff843")}</div>
      <PercentageRow label={uiT("ui.5c34c3ddb625")} value={rawEfficient} />
      <PercentageRow label={uiT("ui.cba6f1c925f8")} value={rawCapable} />
      <PercentageRow label={uiT("ui.b243607493bb")} value={calibratedEfficient} />
      <PercentageRow label={uiT("ui.e85985b0b0f0")} value={calibratedCapable} />
      <PercentageRow label={uiT("ui.e1f1ba77a9cf")} value={gap} unit=" percentage points" />
      <PercentageRow label={uiT("ui.31248d7f1be6")} value={allowedGap} unit=" percentage points" />
      {version && <Row label={uiT("ui.252526ecd431")}>{version}</Row>}
    </div>
  );
}

export function RoutingDecisionCard({
  decision,
  className,
}: {
  decision?: RoutingDecision | null;
  className?: string;
}) {
  const { t: uiT } = useDashboardLanguage();

  if (!decision || !decision.cause) return null;

  const {
    router_model_name: routerModelName,
    router_type: routerType,
    routed_model: routedModel,
    tier,
    tier_label: tierLabel,
    request_type: requestType,
    score,
    signals,
    escalated,
    escalation_keyword: escalationKeyword,
    tier_boundaries: tierBoundaries,
    heuristic_v2_forecast: forecast,
  } = decision;

  // On an override row the score did not decide the tier, so showing it against a
  // boundary would claim something untrue. Keyed off the cause rather than a marker
  // inside `signals`, which redaction can remove.
  const scoreExplanation =
    score !== undefined && decision.cause !== "reasoning_override" && decision.cause !== "plan_mode"
      ? describeScoreAgainstBoundaries(score, tierBoundaries, tierLabel !== undefined)
      : null;

  return (
    <div className={cn("mb-6 w-full max-w-full overflow-hidden rounded-lg bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-2.5 text-sm font-medium">{uiT("ui.bcba696f3eb1")}</div>
      <div className="px-4 py-3">
        {routerModelName && (
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Waypoints size={14} aria-hidden />
            <span>{routerModelName}</span>
            {routerType && (
              <span className="font-normal text-muted-foreground">
                ({ROUTER_TYPE_LABELS[routerType] ?? routerType})
              </span>
            )}
          </div>
        )}

        {tier && (
          <Row label={uiT("ui.cb9e8664edea")}>
            <Badge variant="secondary" className="font-normal">
              {tierLabel ?? tier}
            </Badge>
          </Row>
        )}

        {requestType && <Row label={uiT("ui.6db8df2da928")}>{requestType}</Row>}

        <Row label={uiT("ui.33a2ab84fc8c")}>{describeCause(decision)}</Row>
        {decision.classifier_model && <Row label={uiT("ui.0e721024fb00")}>{decision.classifier_model}</Row>}
        {decision.classifier_confidence != null && (
          <Row label={uiT("ui.6422e3e78f5e")}>{(decision.classifier_confidence * 100).toFixed(1)}%</Row>
        )}
        {decision.classifier_probabilities && (
          <Row label={uiT("ui.f88c5520b576")}>
            {Object.entries(decision.classifier_probabilities).map(([name, probability]) => (
              <div key={name}>
                {name}: {(probability * 100).toFixed(1)}%
              </div>
            ))}
          </Row>
        )}
        {decision.classifier_cost != null && (
          <Row label={uiT("ui.0882e3784ecd")}>{formatMoney(Number(decision.classifier_cost), 8)}</Row>
        )}

        {score !== undefined && (
          <Row label={uiT("ui.38e5a46cbc5a")}>
            <span className="tabular-nums">{score.toFixed(2)}</span>
            {scoreExplanation && <span className="ml-2 text-muted-foreground">({scoreExplanation})</span>}
          </Row>
        )}

        {routedModel && <Row label={uiT("ui.a3e3b5c2b0a3")}>{routedModel}</Row>}

        {escalated !== undefined && (
          <Row label={uiT("ui.b710aaaaa7ba")}>{translateText(describeEscalation(escalated, escalationKeyword))}</Row>
        )}

        {forecast && (
          <div className="mt-3 border-t pt-3">
            <div className="mb-1 text-sm font-medium">{uiT("ui.64e9ad5d26a1")}</div>
            <Row label={uiT("ui.da76f47a9cfd")}>
              <span className="flex flex-wrap gap-1">
                {["SIMPLE", "MEDIUM", "COMPLEX", "REASONING"].map((predictedTier) => (
                  <Badge key={predictedTier} variant="outline" className="font-normal tabular-nums">
                    {translateText(predictedTier)} {(forecast.probabilities[predictedTier] * 100).toFixed(1)}%
                  </Badge>
                ))}
              </span>
            </Row>
            <Row label={uiT("ui.0da627ada476")}>
              <span className="tabular-nums">{(forecast.threshold * 100).toFixed(1)}%</span>
            </Row>
            <Row label={uiT("ui.232bc8815c7d")}>{forecast.predicted_tier}</Row>
            <Row label={uiT("ui.6db8df2da928")}>{forecast.request_type}</Row>
          </div>
        )}

        <CapabilityForecast decision={decision} />
        <FuseV2Forecast decision={decision} />

        {signals && signals.length > 0 && (
          <Row label={uiT("ui.88b01c8a4bff")}>
            <span className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <Badge key={signal} variant="outline" className="font-normal">
                  {signal}
                </Badge>
              ))}
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}

export default RoutingDecisionCard;
