"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatGuardrailMode,
  formatLoggingOnlyScope,
  loggingOnlyContinueFromParams,
  modeIncludesLoggingOnly,
} from "./guardrail_info_helpers";

type GuardrailModeParams = {
  mode?: unknown;
  default_on?: boolean;
  logging_only_scope?: string | null;
  logging_only_continue_on_input_failure?: boolean | null;
};

export const GuardrailModeCard: React.FC<{ litellmParams: GuardrailModeParams }> = ({ litellmParams }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <Card className="block p-6">
      <p>{uiT("ui.5e23ec6a300dc60a")}</p>
      <div className="mt-2">
        <h3 className="text-lg font-medium">{formatGuardrailMode(litellmParams.mode) || "-"}</h3>
        <Badge variant={litellmParams.default_on ? "secondary" : "outline"}>
          {litellmParams.default_on ? uiT("ui.53a0a7d96788c7f0") : uiT("ui.c10a06bc2844ec93")}
        </Badge>
      </div>
      {modeIncludesLoggingOnly(litellmParams.mode) && (
        <div className="mt-4">
          <p>{uiT("ui.a39c388568b64cf9")}</p>
          <h3 className="text-lg font-medium">{formatLoggingOnlyScope(litellmParams.logging_only_scope)}</h3>
          <p className="mt-2">{uiT("ui.d87004c610e3779d")}</p>
          <h3 className="text-lg font-medium">
            {loggingOnlyContinueFromParams(litellmParams) ? uiT("ui.130011756125313c") : uiT("ui.ca7981b46ecf2c17")}
          </h3>
        </div>
      )}
    </Card>
  );
};

export const GuardrailModeRows: React.FC<{ litellmParams: GuardrailModeParams }> = ({ litellmParams }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <div>
        <p className="font-medium">{uiT("ui.5e23ec6a300dc60a")}</p>
        <div>{formatGuardrailMode(litellmParams.mode) || "-"}</div>
      </div>
      {modeIncludesLoggingOnly(litellmParams.mode) && (
        <div>
          <p className="font-medium">{uiT("ui.a39c388568b64cf9")}</p>
          <div>{formatLoggingOnlyScope(litellmParams.logging_only_scope)}</div>
          <p className="font-medium">{uiT("ui.d87004c610e3779d")}</p>
          <div>
            {loggingOnlyContinueFromParams(litellmParams) ? uiT("ui.130011756125313c") : uiT("ui.ca7981b46ecf2c17")}
          </div>
        </div>
      )}
    </>
  );
};
