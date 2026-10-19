"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import React from "react";
import { ReasoningEffort, TierModelParams } from "./complexity_router_tiers";

const PROVIDER_DEFAULT = "__provider_default__";

const storedEffort = (params: TierModelParams | undefined): ReasoningEffort | undefined => {
  const stored = params?.reasoning_effort;
  if (stored === undefined || stored === null || stored === "") return undefined;
  return typeof stored === "string" ? stored : String(stored);
};

interface TierModelEffortRowsProps {
  tierLabel: string;
  models: string[];
  effortOptionsByModel: Record<string, string[]>;
  paramsByModel: Record<string, TierModelParams> | undefined;
  onEffortChange: (model: string, effort: ReasoningEffort | undefined) => void;
  fastModeByModel?: Record<string, boolean>;
  onFastModeChange: (model: string, enabled: boolean) => void;
}

const canEditFastMode = (
  model: string,
  fastModeByModel: TierModelEffortRowsProps["fastModeByModel"],
  paramsByModel: TierModelEffortRowsProps["paramsByModel"],
): boolean => fastModeByModel?.[model] === true || paramsByModel?.[model]?.speed === "fast";

export interface TierEffortRow {
  model: string;
  effort: ReasoningEffort | undefined;
  options: string[];
}

/**
 * A stored effort outside the model's supported set (hand-authored, or capabilities changed since
 * it was saved) is listed anyway, so the row renders with its value selected and can be cleared.
 */
export const tierEffortRows = ({
  models,
  effortOptionsByModel,
  paramsByModel,
  fastModeByModel,
}: Pick<
  TierModelEffortRowsProps,
  "models" | "effortOptionsByModel" | "paramsByModel" | "fastModeByModel"
>): TierEffortRow[] =>
  models
    .map((model) => {
      const effort = storedEffort(paramsByModel?.[model]);
      const supported = effortOptionsByModel[model] ?? [];
      const listed = effort !== undefined && !supported.includes(effort) ? [...supported, effort] : supported;
      return { model, effort, options: Array.from(new Set(listed)) };
    })
    .filter(({ model, options }) => options.length > 0 || canEditFastMode(model, fastModeByModel, paramsByModel));

const TierModelEffortRows: React.FC<TierModelEffortRowsProps> = (props) => {
  const { t: uiT } = useDashboardLanguage();

  const { tierLabel, paramsByModel, onEffortChange, fastModeByModel, onFastModeChange } = props;
  const rows = tierEffortRows(props);
  if (rows.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {rows.some(({ options }) => options.length > 0) && (
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">{uiT("ui.3236aeec43e563ca")}</span>
          <SimpleTooltip content={uiT("ui.952b57f87862abc5")}>
            <Info className="size-3 text-muted-foreground/70" />
          </SimpleTooltip>
        </div>
      )}
      {rows.map(({ model, effort, options }) => (
        <div key={model} className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 flex-1 basis-32 truncate text-xs" title={model}>
            {model}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {options.length > 0 && (
              <Select
                items={[
                  { value: PROVIDER_DEFAULT, label: uiT("ui.21b111cbfe6e") },
                  ...options.map((option) => ({ value: option, label: option })),
                ]}
                value={effort ?? PROVIDER_DEFAULT}
                onValueChange={(selected: string | null) =>
                  selected !== null && onEffortChange(model, selected === PROVIDER_DEFAULT ? undefined : selected)
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-36"
                  aria-label={uiT("ui.4ebc50ea288c1cae", { v0: String(model), v1: String(tierLabel) })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROVIDER_DEFAULT}>{uiT("ui.21b111cbfe6e")}</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canEditFastMode(model, fastModeByModel, paramsByModel) && (
              <SimpleTooltip content={uiT("ui.d8185b73f9037faf")}>
                <label
                  className="flex items-center gap-2 text-xs"
                  aria-label={uiT("ui.2ff6caa181453fd5", { v0: String(model), v1: String(tierLabel) })}
                >
                  <Switch
                    size="sm"
                    checked={paramsByModel?.[model]?.speed === "fast"}
                    onCheckedChange={(enabled) => onFastModeChange(model, enabled)}
                  />
                  {uiT("ui.1b7f9ecb7cd6a212")}
                </label>
              </SimpleTooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TierModelEffortRows;
