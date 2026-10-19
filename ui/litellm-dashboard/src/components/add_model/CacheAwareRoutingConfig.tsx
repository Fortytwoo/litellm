"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { classificationFrequency, type ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const blockedReason = (value: ComplexityRouterConfigValue): string | null => {
  if (value.custom_tier_set) return "Use the built-in tiers to enable cache-aware routing.";
  if (value.adaptive) return "Turn off Adaptive Routing to enable cache-aware routing.";
  if (classificationFrequency(value) !== "every_request") {
    return 'Set "How often to classify" to every request to enable cache-aware routing.';
  }
  if (Object.values(value.tiers).some((models) => models.length > 1)) {
    return "Choose one model per tier to enable cache-aware routing.";
  }
  if (
    Object.values(value.tier_model_params ?? {}).some((models) =>
      Object.values(models).some((params) => Object.keys(params).length > 0),
    )
  ) {
    return "Remove per-model parameter overrides to enable cache-aware routing.";
  }
  return null;
};

const optionalInteger = (raw: string, minimum: number): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.trunc(parsed)) : undefined;
};

const CacheAwareRoutingConfig = ({
  value,
  onChange,
}: {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}) => {
  const { t: uiT } = useDashboardLanguage();

  const enabled = value.cache_aware_routing ?? false;
  const reason = blockedReason(value);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          disabled={!enabled && reason !== null}
          onCheckedChange={(next) => onChange({ ...value, cache_aware_routing: next })}
          aria-label={uiT("ui.d45c5045a8529734")}
        />
        <span className="text-sm font-medium">{uiT("ui.2827b431ef71a8aa")}</span>
      </div>
      <p className="text-xs text-muted-foreground">{uiT("ui.7c5a79875b7e4c3a")}</p>
      {reason && (
        <p className="text-xs text-muted-foreground" role="status">
          {enabled && "Cache-aware routing is currently skipped. "}
          {reason}
        </p>
      )}
      {enabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cache-aware-output-tokens">
              {uiT("ui.7056a89d7c94fd6b")}
            </label>
            <Input
              id="cache-aware-output-tokens"
              type="number"
              min={0}
              step={1}
              placeholder="1024"
              value={value.cache_aware_routing_output_tokens ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  cache_aware_routing_output_tokens: optionalInteger(event.target.value, 0),
                })
              }
              aria-describedby="cache-aware-output-help"
            />
            <p id="cache-aware-output-help" className="mt-1 text-xs text-muted-foreground">
              {uiT("ui.6a20da6af0877295")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="cache-aware-timeout">
              {uiT("ui.745c69e1518e453f")}
            </label>
            <Input
              id="cache-aware-timeout"
              type="number"
              min={1}
              step={1}
              placeholder="2000"
              value={value.cache_aware_routing_timeout_ms ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  cache_aware_routing_timeout_ms: optionalInteger(event.target.value, 1),
                })
              }
              aria-describedby="cache-aware-timeout-help"
            />
            <p id="cache-aware-timeout-help" className="mt-1 text-xs text-muted-foreground">
              {uiT("ui.84f08801487aa9b0")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheAwareRoutingConfig;
