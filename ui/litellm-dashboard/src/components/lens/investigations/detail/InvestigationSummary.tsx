"use client";

import { useNow } from "@/hooks/useNow";
import { durationLabel, money, scopeLabel, sourceLabels } from "../../model/format";
import { nextCheckStatus } from "../../model/status";
import { type Lens } from "../../model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateText } from "@/i18n";

export function InvestigationSummary({ lens }: { lens: Lens }) {
  const { t } = useLanguage();
  const now = useNow(15000);
  const { settings } = lens;
  const month = new Date(now).toISOString().slice(0, 7);
  const spent = lens.budget_month === month ? lens.spent ?? 0 : 0;
  const reserved = (lens.reservations ?? [])
    .filter((hold) => hold.month === month)
    .filter((hold) => !hold.expires_at || Date.parse(hold.expires_at) > now)
    .reduce((sum, hold) => sum + hold.amount, 0);
  const parts = [
    scopeLabel(settings),
    settings.enabled
      ? t("supplement.everyDuration", { duration: durationLabel(settings.interval_minutes) })
      : translateText("One-off"),
    nextCheckStatus(lens, now),
    t("supplement.monthlyBudgetUsed", { spent: money(spent), budget: money(settings.monthly_budget ?? 100) }),
    reserved > 0 &&
      t("supplement.reservedBudget", {
        reserved: money(reserved),
        available: money(Math.max(0, settings.monthly_budget - spent - reserved)),
      }),
  ].filter(Boolean);
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {sourceLabels[settings.source ?? "traces"]}
      {parts.map((part) => ` · ${part}`)}
    </p>
  );
}
