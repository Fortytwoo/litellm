"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useId, useState } from "react";

import { getMajorAirlines } from "@/components/networking";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { TagsInput } from "./TagsInput";
import { ThresholdInput } from "./ThresholdInput";

export interface MajorAirline {
  id: string;
  match: string;
  tags: string[];
}

export interface CompetitorIntentConfig {
  competitor_intent_type: "airline" | "generic";
  brand_self: string[];
  locations?: string[];
  competitors?: string[];
  policy?: {
    competitor_comparison?: "refuse" | "reframe";
    possible_competitor_comparison?: "refuse" | "reframe";
  };
  threshold_high?: number;
  threshold_medium?: number;
  threshold_low?: number;
}

interface CompetitorIntentConfigurationProps {
  enabled: boolean;
  config: CompetitorIntentConfig | null;
  onChange: (enabled: boolean, config: CompetitorIntentConfig | null) => void;
  accessToken?: string | null;
}

const DEFAULT_CONFIG: CompetitorIntentConfig = {
  competitor_intent_type: "airline",
  brand_self: [],
  locations: [],
  policy: {
    competitor_comparison: "refuse",
    possible_competitor_comparison: "reframe",
  },
  threshold_high: 0.7,
  threshold_medium: 0.45,
  threshold_low: 0.3,
};

const INTENT_TYPES = [
  {
    value: "airline",
    get label() {
      return translateUi("ui.a1b9aa8147cfe98a");
    },
  },
  {
    value: "generic",
    get label() {
      return translateUi("ui.d7c071065bf9492e");
    },
  },
] as const;

const COMPETITOR_COMPARISON_POLICIES = [
  {
    value: "refuse",
    get label() {
      return translateUi("ui.94af3bb52844031d");
    },
  },
  {
    value: "reframe",
    get label() {
      return translateUi("ui.985e26a40bcb88b8");
    },
  },
] as const;

const POSSIBLE_COMPETITOR_COMPARISON_POLICIES = [
  {
    value: "refuse",
    get label() {
      return translateUi("ui.94af3bb52844031d");
    },
  },
  {
    value: "reframe",
    get label() {
      return translateUi("ui.e44e2c6a48648e0e");
    },
  },
] as const;

const THRESHOLDS = [
  {
    field: "threshold_high",
    get label() {
      return translateUi("ui.c4ebc6d4a5832cd9");
    },
    get hint() {
      return translateUi("ui.780af472c10120ec");
    },
    fallback: 0.7,
  },
  {
    field: "threshold_medium",
    get label() {
      return translateUi("ui.8e588cd187741f1c");
    },
    get hint() {
      return translateUi("ui.25f06bb5376d7e2a");
    },
    fallback: 0.45,
  },
  {
    field: "threshold_low",
    get label() {
      return translateUi("ui.f793de205ead5ac3");
    },
    get hint() {
      return translateUi("ui.a7835bb421a3f24f");
    },
    fallback: 0.3,
  },
] as const;

const CompetitorIntentConfiguration: React.FC<CompetitorIntentConfigurationProps> = ({
  enabled,
  config,
  onChange,
  accessToken,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const effectiveConfig = config ?? DEFAULT_CONFIG;
  const [airlineOptions, setAirlineOptions] = useState<MajorAirline[]>([]);
  const [loadingAirlines, setLoadingAirlines] = useState(false);
  const fieldId = useId();

  useEffect(() => {
    if (effectiveConfig.competitor_intent_type === "airline" && accessToken && airlineOptions.length === 0) {
      setLoadingAirlines(true);
      getMajorAirlines(accessToken)
        .then((res) => setAirlineOptions(res.airlines ?? []))
        .catch(() => setAirlineOptions([]))
        .finally(() => setLoadingAirlines(false));
    }
  }, [effectiveConfig.competitor_intent_type, accessToken, airlineOptions.length]);

  const handleEnabledChange = (checked: boolean) => {
    onChange(checked, checked ? { ...DEFAULT_CONFIG } : null);
  };

  const handleConfigChange = (field: string, value: unknown) => {
    onChange(enabled, { ...effectiveConfig, [field]: value });
  };

  const handlePolicyChange = (key: string, value: string) => {
    onChange(enabled, {
      ...effectiveConfig,
      policy: { ...effectiveConfig.policy, [key]: value },
    });
  };

  const handleNestedArrayChange = (field: "brand_self" | "locations" | "competitors", values: string[]) => {
    onChange(enabled, { ...effectiveConfig, [field]: values.filter(Boolean) });
  };

  const handleBrandSelfChange = (values: string[]) => {
    const filtered = values.filter(Boolean);
    const expanded: string[] = [];
    const seen = new Set<string>();
    for (const v of filtered) {
      const airline = airlineOptions.find((a) => {
        const primary = a.match.split("|")[0]?.trim().toLowerCase();
        return primary === v.toLowerCase();
      });
      if (airline) {
        for (const variant of airline.match
          .split("|")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)) {
          if (!seen.has(variant)) {
            seen.add(variant);
            expanded.push(variant);
          }
        }
      } else if (!seen.has(v.toLowerCase())) {
        seen.add(v.toLowerCase());
        expanded.push(v);
      }
    }
    onChange(enabled, { ...effectiveConfig, brand_self: expanded });
  };

  const header = (
    <CardHeader className="gap-0">
      <CardTitle className="text-base">{uiT("ui.b59a4548f9b3a3d1")}</CardTitle>
      <CardAction>
        <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
      </CardAction>
    </CardHeader>
  );

  if (!enabled) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground">{uiT("ui.46cf6727c520d21a")}</p>
        </CardContent>
      </Card>
    );
  }

  const airlineTags =
    effectiveConfig.competitor_intent_type === "airline" && airlineOptions.length > 0
      ? airlineOptions.map((a) => {
          const primary = a.match.split("|")[0]?.trim() ?? a.id;
          const variants = a.match
            .split("|")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          return {
            value: primary.toLowerCase(),
            label: `${primary}${variants.length > 1 ? ` (${variants.slice(1).join(", ")})` : ""}`,
          };
        })
      : [];

  return (
    <Card>
      {header}
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{uiT("ui.bf0542bc45eac5f9")}</p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-type`}>{uiT("ui.baaddf70fb5d")}</FieldLabel>
            <Select
              items={INTENT_TYPES}
              value={effectiveConfig.competitor_intent_type}
              onValueChange={(v: string | null) => v !== null && handleConfigChange("competitor_intent_type", v)}
            >
              <SelectTrigger id={`${fieldId}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} title={type.label}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-brand-self`}>{uiT("ui.4807420ba020c8ba")}</FieldLabel>
            <TagsInput
              id={`${fieldId}-brand-self`}
              value={effectiveConfig.brand_self}
              onValueChange={(v) =>
                effectiveConfig.competitor_intent_type === "airline" && airlineOptions.length > 0
                  ? handleBrandSelfChange(v)
                  : handleNestedArrayChange("brand_self", v)
              }
              options={airlineTags}
              tokenSeparators={[","]}
              loading={loadingAirlines}
              placeholder={
                effectiveConfig.competitor_intent_type === "airline"
                  ? uiT("ui.5380b0b4da910ba5")
                  : uiT("ui.8667fa98e64e7568")
              }
            />
            <FieldDescription>
              {effectiveConfig.competitor_intent_type === "airline"
                ? uiT("ui.0375ea933561ae94")
                : uiT("ui.0dec2513167e65f0")}
            </FieldDescription>
          </Field>

          {effectiveConfig.competitor_intent_type === "airline" && (
            <Field>
              <FieldLabel htmlFor={`${fieldId}-locations`}>{uiT("ui.d769e5e0b0d7edc6")}</FieldLabel>
              <TagsInput
                id={`${fieldId}-locations`}
                value={effectiveConfig.locations ?? []}
                onValueChange={(v) => handleNestedArrayChange("locations", v)}
                tokenSeparators={[","]}
                placeholder={uiT("ui.8667fa98e64e7568")}
              />
              <FieldDescription>{uiT("ui.207ad105e0609ad1")}</FieldDescription>
            </Field>
          )}

          {effectiveConfig.competitor_intent_type === "generic" && (
            <Field>
              <FieldLabel htmlFor={`${fieldId}-competitors`}>{uiT("ui.e699b0b54366257f")}</FieldLabel>
              <TagsInput
                id={`${fieldId}-competitors`}
                value={effectiveConfig.competitors ?? []}
                onValueChange={(v) => handleNestedArrayChange("competitors", v)}
                tokenSeparators={[","]}
                placeholder={uiT("ui.8667fa98e64e7568")}
              />
              <FieldDescription>{uiT("ui.675acf450d2702c2")}</FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor={`${fieldId}-competitor-comparison`}>{uiT("ui.67ec85bce309fdb7")}</FieldLabel>
            <Select
              items={COMPETITOR_COMPARISON_POLICIES}
              value={effectiveConfig.policy?.competitor_comparison ?? "refuse"}
              onValueChange={(v: string | null) => v !== null && handlePolicyChange("competitor_comparison", v)}
            >
              <SelectTrigger id={`${fieldId}-competitor-comparison`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPETITOR_COMPARISON_POLICIES.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value} title={policy.label}>
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-possible-competitor-comparison`}>{uiT("ui.c603ded85965686d")}</FieldLabel>
            <Select
              items={POSSIBLE_COMPETITOR_COMPARISON_POLICIES}
              value={effectiveConfig.policy?.possible_competitor_comparison ?? "reframe"}
              onValueChange={(v: string | null) =>
                v !== null && handlePolicyChange("possible_competitor_comparison", v)
              }
            >
              <SelectTrigger id={`${fieldId}-possible-competitor-comparison`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSSIBLE_COMPETITOR_COMPARISON_POLICIES.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value} title={policy.label}>
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{uiT("ui.b41fa3a3981525d2")}</FieldLabel>
            <div className="flex flex-wrap gap-4">
              {THRESHOLDS.map((threshold) => (
                <Field key={threshold.field} className="w-20">
                  <FieldLabel htmlFor={`${fieldId}-${threshold.field}`}>{threshold.label}</FieldLabel>
                  <ThresholdInput
                    id={`${fieldId}-${threshold.field}`}
                    value={effectiveConfig[threshold.field] ?? threshold.fallback}
                    onValueChange={(v) => handleConfigChange(threshold.field, v ?? threshold.fallback)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <FieldDescription>{threshold.hint}</FieldDescription>
                </Field>
              ))}
            </div>
            <FieldDescription>
              {uiT("ui.9453c2b53f90240f")}
              <ul className="mt-1 mb-0 list-disc pl-5">
                <li>
                  <strong>{uiT("ui.35ecf0a25373374b")}</strong>
                  {uiT("ui.e4a5c6f823f27cb1")}
                </li>
                <li>
                  <strong>{uiT("ui.1d63a3f06b040604")}</strong>
                  {uiT("ui.70afe59967a74047")}
                </li>
                <li>
                  <strong>{uiT("ui.d582c907ed6cb246")}</strong>
                  {uiT("ui.d3876f11e81e402d")}
                </li>
              </ul>
              {uiT("ui.ba4d168c2a392619")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default CompetitorIntentConfiguration;
