"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";

import { type ComplexityRouterConfigValue, usesLlmClassifier } from "./ComplexityRouterConfig";
import { restrictedBy } from "./TierRestrictions";

const TierConfigIntro: React.FC<{ value: ComplexityRouterConfigValue }> = ({ value }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="mb-4 space-y-2 text-sm text-muted-foreground">
      <p>{uiT("ui.343312cafb8ca1e0")}</p>
      <p className="text-xs">
        {restrictedBy(value, "displayNames")?.reason ?? uiT("ui.7899b96b853be213")}
        {!value.custom_tier_set &&
          usesLlmClassifier(value.classifier_type) &&
          ". Your judge model also uses these names to classify requests"}
      </p>
    </div>
  );
};

export default TierConfigIntro;
