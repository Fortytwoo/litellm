"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ClassifierType } from "./classifier_types";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { restrictedBy } from "./TierRestrictions";

interface ClassifierTypeRadiosProps {
  value: ComplexityRouterConfigValue;
  classifierType: ClassifierType;
  onTypeChange: (classifierType: ClassifierType) => void;
}

const ClassifierTypeRadios: React.FC<ClassifierTypeRadiosProps> = ({ value, classifierType, onTypeChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const scorerLocked = Boolean(value.custom_tier_set);
  const scorerLockedReason = restrictedBy(value, "heuristicClassifier")?.reason;
  return (
    <RadioGroup
      value={classifierType}
      onValueChange={(nextType: unknown) => onTypeChange(nextType as ClassifierType)}
      className="w-full"
    >
      <div className="flex w-full flex-col items-start gap-2">
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{uiT("ui.8ea33c597e4ab376")}</strong>{" "}
              <span className="text-muted-foreground">{uiT("ui.b54f5076dec52f53")}</span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_v2" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{uiT("ui.183bc446ae6a17b0")}</strong>{" "}
              <span className="text-muted-foreground">{uiT("ui.f902f9b9e5deac98")}</span>
            </span>
          </Label>
        </SimpleTooltip>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="llm" className="mt-0.5" />
          <span>
            <strong className="font-semibold">{uiT("ui.6e1680c1b9b97d7a")}</strong>{" "}
            <span className="text-muted-foreground">{uiT("ui.7164e08c94fe60b7")}</span>
          </span>
        </Label>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="jev" className="mt-0.5" />
          <span>
            <strong className="font-semibold">{uiT("ui.2b508ccdc73ed12d")}</strong>{" "}
            <span className="text-muted-foreground">{uiT("ui.e469c131a08d0705")}</span>
          </span>
        </Label>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_first" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{uiT("ui.8852895e39d1ef73")}</strong>{" "}
              <span className="text-muted-foreground">{uiT("ui.a2ffc2dddbfb8a12")}</span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="hybrid" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{uiT("ui.6c67dc13f83949fe")}</strong>{" "}
              <span className="text-muted-foreground">{uiT("ui.d8215098dcaf9f54")}</span>
            </span>
          </Label>
        </SimpleTooltip>
      </div>
    </RadioGroup>
  );
};

export default ClassifierTypeRadios;
