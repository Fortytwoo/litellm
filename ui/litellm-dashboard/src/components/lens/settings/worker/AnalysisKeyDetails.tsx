"use client";
import { formatMoney } from "@/utils/currency";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { runTime } from "../../model/format";
import { useAnalysisKeyInfo } from "./useAnalysisKeyInfo";

function budgetLabel(amount: number | null, duration?: string | null): string {
  if (amount === null) return "No key budget";
  const periods: Record<string, string> = {
    "1mo": "month",
    "30d": "month",
    "1d": "day",
    "24h": "day",
    "7d": "week",
    "1h": "hour",
  };
  const dollars = formatMoney(amount, 2);
  return duration ? `${dollars} / ${periods[duration] ?? duration}` : `${dollars} total`;
}

function modelsLabel(models: readonly string[]): string {
  return models.length ? models.join(", ") : "All models";
}

export function AnalysisKeySummary({ keyId }: { keyId: string }) {
  const { t: uiT } = useDashboardLanguage();

  const key = useAnalysisKeyInfo(keyId);
  if (key.isLoading) return <p className="text-xs text-muted-foreground">{uiT("ui.4092d6f1acd7d8f8")}</p>;
  if (key.error || !key.data)
    return (
      <p role="alert" className="flex items-center gap-2 text-xs text-destructive">
        {uiT("ui.732164f71104fb27")}
        <Button variant="link" size="xs" className="h-auto p-0" onClick={() => void key.refetch()}>
          {uiT("ui.942087cc2d41e013")}
        </Button>
      </p>
    );
  const info = key.data;
  const summary = [
    `Bills to ${info.key_alias || "an assigned virtual key"}`,
    modelsLabel(info.models),
    budgetLabel(info.max_budget, info.budget_duration),
  ].join(" · ");
  const inactive = info.status && info.status !== "active";
  return (
    <p className="truncate text-xs text-muted-foreground">
      {summary}
      {inactive && (
        <span className="text-destructive">
          {" "}
          {uiT("ui.e304b791cf7424c0")} {info.status}
        </span>
      )}
    </p>
  );
}

export function AnalysisKeyDetails({ keyId }: { keyId: string }) {
  const { t: uiT } = useDashboardLanguage();

  const key = useAnalysisKeyInfo(keyId);
  if (key.isLoading) return <p className="text-xs text-muted-foreground">{uiT("ui.03ba793f51cb0d85")}</p>;
  if (key.error || !key.data)
    return (
      <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
        {uiT("ui.b225697f554d8b67")}
        <Button variant="ghost" size="sm" onClick={() => void key.refetch()}>
          {uiT("ui.942087cc2d41e013")}
        </Button>
      </div>
    );
  const info = key.data;
  return (
    <div className="space-y-2 text-sm">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2">
        <dt className="text-muted-foreground">{uiT("ui.d17d2d78d76e")}</dt>
        <dd className="break-words">{translateText(modelsLabel(info.models))}</dd>
        <dt className="text-muted-foreground">{uiT("ui.655b70b601a6bf6a")}</dt>
        <dd>{translateText(budgetLabel(info.max_budget, info.budget_duration))}</dd>
      </dl>
      {info.status && info.status !== "active" && (
        <p role="alert" className="text-destructive">
          {uiT("ui.3cf6c9633ac6b8b4")} {info.status}
          {uiT("ui.7543363d926e72db")}
        </p>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{uiT("ui.68de1b1ec028735c")}</summary>
        <div className="mt-2 space-y-1 leading-5">
          <p>
            {uiT("ui.6022b0a2d5bd22c8")} {info.rpm_limit ?? uiT("ui.9f0143a0253bb3ad")}
          </p>
          <p>
            {uiT("ui.9a7d4873316e9c28")} {info.tpm_limit ?? uiT("ui.9f0143a0253bb3ad")}
          </p>
          <p>
            {uiT("ui.8353d67bd934a75d")} {info.expires ? runTime(info.expires) : uiT("ui.fe06351db8da7041")}
          </p>
          <p>{uiT("ui.1ce4f1d83a3d2873")}</p>
        </div>
      </details>
    </div>
  );
}
