"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { ModelData, ModelInfo } from "@/components/model_dashboard/types";
import { Badge } from "@/components/ui/badge";
import { formatPerSecondCost } from "@/utils/dataUtils";

type PricingFields = Pick<
  ModelData,
  "input_cost" | "output_cost" | "output_cost_per_second" | "output_cost_per_second_tiers"
> & { model_info?: Pick<ModelInfo, "pricing_overrides"> };

function PricingSource({ overrides }: { overrides: string[] | undefined }) {
  const { t: uiT } = useDashboardLanguage();

  if (overrides === undefined) return null;
  if (overrides.length === 0) {
    return <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.440143661cc2b6d8")}</p>;
  }
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="mr-1">
        {uiT("ui.e16bc2c1954f8c5f")}
      </Badge>
      {uiT("ui.faef038249784b29")} {overrides.join(", ")}
    </p>
  );
}

export function ModelPricingSummary({ model }: { model: PricingFields }) {
  const { t: uiT } = useDashboardLanguage();

  const perSecond = model.output_cost_per_second;
  const hasPerSecond = perSecond != null;
  const showInput = model.input_cost != null && (!hasPerSecond || Number(model.input_cost) > 0);
  const showOutput = model.output_cost != null && (!hasPerSecond || Number(model.output_cost) > 0);

  if (!showInput && !showOutput && !hasPerSecond) {
    return <p className="mt-2 text-sm text-muted-foreground">-</p>;
  }

  return (
    <div className="mt-2">
      {showInput && (
        <p className="text-sm">
          {uiT("ui.53563c2227887046")}
          {model.input_cost}/1M tokens
        </p>
      )}
      {showOutput && (
        <p className="text-sm">
          {uiT("ui.747816c49f418221")}
          {model.output_cost}/1M tokens
        </p>
      )}
      {hasPerSecond && (
        <p className="text-sm">
          {uiT("ui.457f4957af842a52")} {formatPerSecondCost(perSecond)}
        </p>
      )}
      {(model.output_cost_per_second_tiers ?? []).map(({ resolution, cost }) => (
        <p key={resolution} className="text-sm">
          {uiT("ui.b5928b5dfafb5fd7")}
          {resolution}): {formatPerSecondCost(cost)}
        </p>
      ))}
      <PricingSource overrides={model.model_info?.pricing_overrides} />
    </div>
  );
}
