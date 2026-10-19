"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

interface ImpactResult {
  affected_keys_count: number;
  affected_teams_count: number;
  sample_keys: string[];
  sample_teams: string[];
}

interface ImpactPreviewAlertProps {
  impactResult: ImpactResult;
  isDefault?: boolean;
}

interface SampleListProps {
  label: string;
  samples: string[];
  totalCount: number;
}

const SampleList: React.FC<SampleListProps> = ({ label, samples, totalCount }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}: </span>
      {samples.slice(0, 5).map((sample) => (
        <Badge key={sample} variant="outline">
          {sample}
        </Badge>
      ))}
      {totalCount > 5 && (
        <span className="text-xs text-muted-foreground">
          {uiT("ui.6201111b83a0cb5b")} {totalCount - 5} {uiT("ui.2167571b0939b936")}
        </span>
      )}
    </div>
  );
};

const ImpactPreviewAlert: React.FC<ImpactPreviewAlertProps> = ({ impactResult, isDefault = false }) => {
  const { t: uiT } = useDashboardLanguage();

  const isGlobal = impactResult.affected_keys_count === -1;
  const qualifier = isDefault ? "up to " : "";

  return (
    <Alert className="mb-4">
      {isGlobal ? <AlertTriangle /> : <Info />}
      <AlertTitle>{uiT("ui.f91e0e279b518083")}</AlertTitle>
      <AlertDescription>
        {isGlobal ? (
          <span>
            {uiT("ui.f06700daf6c3ccfa")} <strong>{uiT("ui.247db38553adfed8")}</strong>.
          </span>
        ) : (
          <div>
            <span>
              {uiT("ui.7a68ddbc5eaede94")} {translateText(qualifier)}
              <strong>
                {impactResult.affected_keys_count} {uiT("ui.2c70e12b7a0646f9")}
                {impactResult.affected_keys_count !== 1 ? "s" : ""}
              </strong>{" "}
              {uiT("ui.6201111b83a0cb5b")}{" "}
              <strong>
                {impactResult.affected_teams_count} {uiT("ui.ca8b22d0db83a22d")}
                {impactResult.affected_teams_count !== 1 ? "s" : ""}
              </strong>
              .
            </span>
            {isDefault && <div className="text-xs text-muted-foreground">{uiT("ui.d7bc0d6fab50e099")}</div>}
            {impactResult.sample_keys.length > 0 && (
              <SampleList
                label={uiT("ui.f0d66a79c138")}
                samples={impactResult.sample_keys}
                totalCount={impactResult.affected_keys_count}
              />
            )}
            {impactResult.sample_teams.length > 0 && (
              <SampleList
                label={uiT("ui.1e1a1c078af2")}
                samples={impactResult.sample_teams}
                totalCount={impactResult.affected_teams_count}
              />
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ImpactPreviewAlert;
