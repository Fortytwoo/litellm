"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FuseProfilePresets from "./FuseProfilePresets";
import { Switch } from "@/components/ui/switch";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { MultiSelect } from "@/components/shared/MultiSelect";
import {
  type ComplexityRouterConfigValue,
  type ClassificationFrequency,
  classificationFrequency,
  withClassificationFrequency,
  DEFAULT_CLASSIFIER_TIMEOUT_MS,
} from "./ComplexityRouterConfig";
import {
  forecastTierNames,
  forecastModels,
  getForecastConfigError,
  newCapabilitySettings,
  newFuseSettings,
  type CapabilitySettings,
  type FuseSettings,
} from "./forecast_classifier_config";
import ClassifierReasoningEffortSelect from "./ClassifierReasoningEffortSelect";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import ClassifierVisionConfig from "./ClassifierVisionConfig";
import TierModelEffortRows from "./TierModelEffortRows";
import { activeTierRows } from "./tier_rows";
import { setTierModels } from "./tier_set_actions";
import { tierRowLabel, setTierModelParam, setTierModelReasoningEffort } from "./complexity_router_tiers";

interface Props {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  modelOptions: { value: string; label: string }[];
  effortOptionsByModel: Record<string, string[] | null | undefined>;
  section?: "all" | "required" | "advanced";
}

const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  step = "any",
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  help?: string;
}) => {
  const id = React.useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
};

export const ForecastSolverModels = ({
  value,
  onChange,
  modelOptions,
  effortOptionsByModel,
  fastModeByModel,
  additionalPoolsOnly = false,
}: Props & { fastModeByModel: Record<string, boolean>; additionalPoolsOnly?: boolean }) => {
  const { t: uiT } = useDashboardLanguage();

  const id = React.useId();
  const names = forecastTierNames(value);
  const additionalRows =
    value.classifier_type === "capability"
      ? activeTierRows(value)
          .filter((row) => !names.includes(row.id) && row.models.length > 0)
          .map((row) => ({
            tier: row.id,
            label: uiT("ui.0a720e32f7a89aea", { v0: String(tierRowLabel(row, value.tier_labels)) }),
          }))
      : [];
  const rows = additionalPoolsOnly
    ? additionalRows
    : names.map((tier, index) => ({
        tier,
        label: index === 0 ? uiT("ui.faf77c34222cf63b") : uiT("ui.0f7d7a5580a418f6"),
      }));
  if (rows.length === 0) return null;
  return (
    <div className="rounded-lg border p-4 space-y-4">
      {rows.map(({ tier, label }) => {
        const models = forecastModels(value.tiers, tier);
        const setModels = (next: string[]) => onChange(setTierModels(value, tier, next));
        return (
          <div key={tier} className="space-y-2">
            <Label htmlFor={`${id}-${tier}`} className="block text-sm font-semibold">
              {label}
            </Label>
            {value.classifier_type === "llm_v2" ? (
              <SearchSelect
                options={modelOptions}
                inputId={`${id}-${tier}`}
                value={models[0] ?? ""}
                aria-label={label}
                placeholder={uiT("ui.58661820dfdc4c9f", { v0: String(label.toLowerCase()) })}
                onValueChange={(model) => setModels(model ? [model] : [])}
              />
            ) : (
              <MultiSelect
                options={modelOptions}
                id={`${id}-${tier}`}
                value={models}
                onValueChange={setModels}
                placeholder={uiT("ui.76a57668b41a39aa", { v0: String(label.toLowerCase()) })}
              />
            )}
            <TierModelEffortRows
              tierLabel={label}
              models={models}
              effortOptionsByModel={Object.fromEntries(
                Object.entries(effortOptionsByModel).map(([model, efforts]) => [model, efforts ?? []]),
              )}
              paramsByModel={value.tier_model_params?.[tier] ?? {}}
              fastModeByModel={fastModeByModel}
              onFastModeChange={(model, enabled) =>
                onChange({
                  ...value,
                  tier_model_params: setTierModelParam(value.tier_model_params, tier, model, [
                    "speed",
                    enabled ? "fast" : undefined,
                  ]),
                })
              }
              onEffortChange={(model, effort) =>
                onChange({
                  ...value,
                  tier_model_params: setTierModelReasoningEffort(value.tier_model_params, tier, model, effort),
                })
              }
            />
          </div>
        );
      })}
      {!additionalPoolsOnly && <p className="text-sm text-muted-foreground">{uiT("ui.7df9a002c720a022")}</p>}
    </div>
  );
};

const CalibrationFields = ({
  label,
  value,
  onChange,
  bounded = false,
}: {
  label: string;
  bounded?: boolean;
  value: { slope: number; intercept: number };
  onChange: (value: { slope: number; intercept: number }) => void;
}) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <NumberField
        label={uiT("ui.73e1167929ae3f8c", { v0: String(label) })}
        value={value.slope}
        min={0}
        max={bounded ? 20 : undefined}
        onChange={(slope) => onChange({ ...value, slope })}
      />
      <NumberField
        label={uiT("ui.cf9236cf4c0b981b", { v0: String(label) })}
        value={value.intercept}
        min={bounded ? -20 : undefined}
        max={bounded ? 20 : undefined}
        onChange={(intercept) => onChange({ ...value, intercept })}
      />
    </div>
  );
};

const emptyCoefficients = () => ({ slope: Number.NaN, intercept: Number.NaN });

const ForecastClassifierConfig = ({ value, onChange, modelOptions, effortOptionsByModel, section = "all" }: Props) => {
  const { t: uiT } = useDashboardLanguage();

  const id = React.useId();
  const isCapability = value.classifier_type === "capability";
  const capability = value.capability_classifier_config ?? newCapabilitySettings();
  const fuse = value.llm_v2_config ?? newFuseSettings();
  const config = isCapability ? capability : fuse;
  const llm = value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS };
  const updateCapability = (next: CapabilitySettings) => onChange({ ...value, capability_classifier_config: next });
  const updateFuse = (next: FuseSettings) => onChange({ ...value, llm_v2_config: next });
  const updateTransport = (patch: { max_output_tokens?: number; response_format?: "json_schema" | "json_object" }) =>
    isCapability ? updateCapability({ ...capability, ...patch }) : updateFuse({ ...fuse, ...patch });
  const setCalibrationVersion = (version: string) => {
    if (isCapability && capability.calibration)
      updateCapability({ ...capability, calibration: { ...capability.calibration, version } });
    if (!isCapability && fuse.calibration) updateFuse({ ...fuse, calibration: { ...fuse.calibration, version } });
  };
  const error = getForecastConfigError(value);
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        {isCapability ? uiT("ui.ed7e96d763767ea8") : uiT("ui.eeca63628e434005")}
      </p>
      {section === "all" && (
        <>
          <div className="space-y-1">
            <Label htmlFor={`${id}-judge`}>{uiT("ui.2b566109cfdfd661")}</Label>
            <SearchSelect
              inputId={`${id}-judge`}
              aria-label={uiT("ui.2b566109cfdfd661")}
              options={modelOptions}
              value={llm.model}
              placeholder={uiT("ui.2f8e38752a3bb2f8")}
              onValueChange={(model) => {
                if (model === llm.model) return;
                onChange({
                  ...value,
                  classifier_llm_config: { ...llm, model: model ?? "", reasoning_effort: undefined },
                });
              }}
            />
          </div>
        </>
      )}
      {section !== "advanced" && (
        <>
          {isCapability ? (
            <>
              <NumberField
                label={uiT("ui.1e07be5c7f239df4")}
                value={capability.base_threshold}
                min={0}
                max={1}
                help="Minimum estimated chance of whole-task success required to use the efficient solver"
                onChange={(base_threshold) => updateCapability({ ...capability, base_threshold })}
              />
            </>
          ) : (
            <>
              <FuseProfilePresets value={fuse} onChange={updateFuse} />
              <NumberField
                label={uiT("ui.dd8f1bb1cef509c8")}
                value={fuse.max_quality_gap}
                min={0}
                max={1}
                help="Allowed difference between capable and efficient success probabilities, from 0 to 1. Tune on held-out tasks from your workload; this estimate is not a measured quality guarantee. A gap of 0 still selects efficient on tied or higher forecasts. Route directly to one model to avoid judging when you do not want model selection"
                onChange={(max_quality_gap) => updateFuse({ ...fuse, max_quality_gap })}
              />
            </>
          )}
        </>
      )}
      {section !== "required" && (
        <Collapsible
          open={section === "advanced" ? true : undefined}
          className={section === "advanced" ? undefined : "rounded-lg border"}
        >
          {section === "all" && (
            <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left font-medium">
              <ChevronRight className="size-4 transition-transform group-data-panel-open:rotate-90" />
              {uiT("ui.e92937c59da9c03e")}
            </CollapsibleTrigger>
          )}
          <CollapsibleContent className="space-y-4 px-4 pb-4">
            <ClassifierReasoningEffortSelect
              model={llm.model}
              value={llm.reasoning_effort}
              explicitlySupported={effortOptionsByModel[llm.model]}
              onChange={(reasoning_effort) =>
                onChange({ ...value, classifier_llm_config: { ...llm, reasoning_effort } })
              }
            />
            <NumberField
              label={uiT("ui.3b453bc8bd286be4")}
              min={1}
              step={1}
              value={llm.timeout_ms}
              help="Allow enough time for the judge to produce its forecast"
              onChange={(timeout_ms) => onChange({ ...value, classifier_llm_config: { ...llm, timeout_ms } })}
            />
            <ClassifierCircuitBreakerConfig
              value={llm}
              onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
            />
            <ClassifierVisionConfig
              value={llm}
              onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
            />
            {isCapability && (
              <NumberField
                label={uiT("ui.05403f9c05762ae8")}
                value={capability.threshold_step ?? 0}
                min={0}
                max={0.5}
                help="Added once for uncertain or unmatched tasks and twice for unsupported tasks; the final threshold cannot exceed 1"
                onChange={(threshold_step) => updateCapability({ ...capability, threshold_step })}
              />
            )}
            <NumberField
              label={uiT("ui.7547f271fbf1910f")}
              min={1}
              step={1}
              value={config.max_output_tokens ?? (isCapability ? 4096 : 1024)}
              onChange={(max_output_tokens) => updateTransport({ max_output_tokens })}
            />
            <div className="space-y-1">
              <Label htmlFor={`${id}-format`}>{uiT("ui.c0c3432f917c7e5a")}</Label>
              <SearchSelect
                inputId={`${id}-format`}
                aria-label={uiT("ui.c0c3432f917c7e5a")}
                value={config.response_format ?? "json_schema"}
                allowClear={false}
                options={[
                  { value: "json_schema", label: uiT("ui.66014e36deb8d604") },
                  { value: "json_object", label: uiT("ui.5ad08dda660bf6d0") },
                ]}
                onValueChange={(response_format) => {
                  if (response_format === "json_schema" || response_format === "json_object")
                    updateTransport({ response_format });
                }}
              />
            </div>
            <div className="space-y-3 rounded-md border p-3">
              <Label>
                <Switch
                  checked={Boolean(config.calibration)}
                  onCheckedChange={(enabled) =>
                    isCapability
                      ? updateCapability({
                          ...capability,
                          calibration: enabled ? { version: "", ...emptyCoefficients() } : undefined,
                        })
                      : updateFuse({
                          ...fuse,
                          calibration: enabled
                            ? {
                                version: "",
                                prompt_version: "llm-v2-1",
                                efficient: emptyCoefficients(),
                                capable: emptyCoefficients(),
                              }
                            : undefined,
                        })
                  }
                />
                {uiT("ui.aef443546c456194")}
              </Label>
              <p className="text-xs text-muted-foreground">{uiT("ui.e8ebb7494701f263")}</p>
              {config.calibration && (
                <div className="space-y-1">
                  <Label htmlFor={`${id}-version`}>{uiT("ui.63b084936a1e33e0")}</Label>
                  <Input
                    id={`${id}-version`}
                    value={config.calibration.version}
                    maxLength={isCapability ? 128 : 512}
                    onChange={(event) => setCalibrationVersion(event.target.value)}
                  />
                </div>
              )}
              {isCapability && capability.calibration && (
                <CalibrationFields
                  label={uiT("ui.9bd2448fa5cf6d62")}
                  bounded
                  value={capability.calibration}
                  onChange={(next) =>
                    updateCapability({
                      ...capability,
                      calibration: { version: capability.calibration?.version ?? "", ...next },
                    })
                  }
                />
              )}
              {!isCapability &&
                fuse.calibration &&
                (["efficient", "capable"] as const).map((role) => (
                  <CalibrationFields
                    key={role}
                    label={role === "efficient" ? uiT("ui.9bd2448fa5cf6d62") : uiT("ui.293803fa63323380")}
                    value={fuse.calibration![role]}
                    onChange={(next) => {
                      if (fuse.calibration) updateFuse({ ...fuse, calibration: { ...fuse.calibration, [role]: next } });
                    }}
                  />
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      {section === "all" && (
        <>
          <div className="space-y-1">
            <Label htmlFor={`${id}-frequency`}>{uiT("ui.b142fe7a08002397")}</Label>
            <SearchSelect
              inputId={`${id}-frequency`}
              aria-label={uiT("ui.b142fe7a08002397")}
              value={classificationFrequency(value)}
              allowClear={false}
              options={[
                { value: "every_request", label: uiT("ui.f5f1beb6bede7c67") },
                { value: "user_turn", label: uiT("ui.437368964bd36ecf") },
                { value: "session", label: uiT("ui.d49d7fe46d703554") },
              ]}
              onValueChange={(frequency) => {
                if (frequency) onChange(withClassificationFrequency(value, frequency as ClassificationFrequency));
              }}
            />
          </div>
        </>
      )}
      <p className="text-xs text-muted-foreground">{uiT("ui.bdd257c0c4d1873f")}</p>
      {section !== "advanced" && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default ForecastClassifierConfig;
