"use client";
import { CurrencyFieldContext } from "@/components/shared/form/CurrencyFieldContext";
import { formatMoney, usdToCny, cnyToUsd } from "@/utils/currency";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { translateText } from "@/i18n";
import { t as translateUi } from "@/i18n";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import React, { useState } from "react";

export interface ModelBudgetConfig {
  budget_limit: number;
  time_period: string;
  /** BudgetConfig also carries tpm_limit and rpm_limit, which this editor does not model. */
  [passthrough: string]: unknown;
}

export type ModelMaxBudget = Record<string, ModelBudgetConfig>;

export interface ModelBudgetUsage {
  current_spend: number;
  budget_limit: number | null;
  time_period: string | null;
}

interface ModelBudgetEntry {
  id: string;
  model: string | null;
  budgetLimit: number | null;
  timePeriod: string;
  extra: Readonly<Record<string, unknown>>;
}

// BudgetConfig aliases budget_limit onto max_budget and time_period onto
// budget_duration, and the proxy stores whichever spelling the client sent.
const MODELLED_FIELDS: readonly string[] = ["budget_limit", "time_period", "max_budget", "budget_duration"];

const readNumber = (raw: unknown): number | null => {
  const value = typeof raw === "string" ? Number(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readPeriod = (raw: unknown): string | null => (typeof raw === "string" && raw !== "" ? raw : null);

export const MODEL_BUDGET_PERIOD_OPTIONS = [
  {
    value: "1h",
    get label() {
      return translateUi("ui.eab0cd8fdf9b");
    },
  },
  {
    value: "24h",
    get label() {
      return translateUi("ui.b36c2611dcdf");
    },
  },
  {
    value: "7d",
    get label() {
      return translateUi("ui.2975132481a7");
    },
  },
  {
    value: "30d",
    get label() {
      return translateUi("ui.9b11f6b707d2");
    },
  },
  {
    value: "1mo",
    get label() {
      return translateUi("ui.9d0aa7fff657e08f");
    },
  },
];

const DEFAULT_PERIOD = "30d";

export const entriesToModelMaxBudget = (entries: readonly ModelBudgetEntry[]): ModelMaxBudget =>
  Object.fromEntries(
    entries
      .filter(
        (entry): entry is ModelBudgetEntry & { model: string; budgetLimit: number } =>
          entry.model !== null && entry.budgetLimit !== null,
      )
      .map((entry) => [
        entry.model,
        { ...entry.extra, budget_limit: entry.budgetLimit, time_period: entry.timePeriod },
      ]),
  );

export const modelMaxBudgetToEntries = (budget: ModelMaxBudget | null | undefined): ModelBudgetEntry[] =>
  Object.entries(budget ?? {}).map(([model, config], index) => ({
    id: `existing-${index}`,
    model,
    budgetLimit: readNumber(config?.budget_limit) ?? readNumber(config?.max_budget),
    timePeriod: readPeriod(config?.time_period) ?? readPeriod(config?.budget_duration) ?? DEFAULT_PERIOD,
    extra: Object.fromEntries(Object.entries(config ?? {}).filter(([field]) => !MODELLED_FIELDS.includes(field))),
  }));

export const MODEL_MAX_BUDGET_PREMIUM_HINT = "Premium feature - Upgrade to set per-model budgets";

interface ModelMaxBudgetEditorProps {
  value: ModelMaxBudget;
  onChange: (value: ModelMaxBudget) => void;
  availableModels: string[];
  /** The proxy rejects a populated model_max_budget without an enterprise license. */
  premiumUser: boolean;
  usage?: Record<string, ModelBudgetUsage> | null;
}

export function ModelMaxBudgetEditor({
  value,
  onChange,
  availableModels,
  premiumUser,
  usage,
}: ModelMaxBudgetEditorProps) {
  const { t: uiT } = useDashboardLanguage();

  const [entries, setEntries] = useState<ModelBudgetEntry[]>(() => modelMaxBudgetToEntries(value));

  const emitChange = (updated: ModelBudgetEntry[]) => {
    setEntries(updated);
    onChange(entriesToModelMaxBudget(updated));
  };

  const addEntry = () =>
    emitChange([
      ...entries,
      { id: Date.now().toString(), model: null, budgetLimit: null, timePeriod: DEFAULT_PERIOD, extra: {} },
    ]);

  const removeEntry = (id: string) => emitChange(entries.filter((entry) => entry.id !== id));

  const updateEntry = (id: string, patch: Partial<ModelBudgetEntry>) =>
    emitChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

  const usedModels = new Set(entries.map((entry) => entry.model).filter(Boolean));
  const hintWhenLocked = premiumUser ? undefined : translateText(MODEL_MAX_BUDGET_PREMIUM_HINT);

  const blurb = (
    <div className="text-xs text-muted-foreground">
      {premiumUser ? uiT("ui.efa618431d2b7f75") : translateText(MODEL_MAX_BUDGET_PREMIUM_HINT)}
    </div>
  );

  if (entries.length === 0) {
    return (
      <div>
        <div className="mb-2">{blurb}</div>
        <Button variant="outline" size="sm" onClick={addEntry} disabled={!premiumUser} title={hintWhenLocked}>
          <Plus className="w-3 h-3" />
          {uiT("ui.65131641dda9edab")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blurb}
      {entries.map((entry) => {
        const modelOptions = availableModels.filter((model) => model === entry.model || !usedModels.has(model));
        const spent = entry.model ? usage?.[entry.model]?.current_spend : undefined;
        return (
          <div key={entry.id} className="relative rounded-lg border border-border bg-muted p-4">
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              disabled={!premiumUser}
              title={hintWhenLocked}
              aria-label={uiT("ui.1279a77123ad0363")}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1">{uiT("ui.5e2c614c23f0")}</label>
              <SearchSelect
                options={modelOptions.map((model) => ({ label: model, value: model }))}
                value={entry.model}
                onValueChange={(model) => updateEntry(entry.id, { model })}
                placeholder={uiT("ui.1d446005add35afa")}
                emptyText={uiT("ui.a650c298cf44")}
                disabled={!premiumUser}
              />
            </div>

            <div className="flex gap-2 items-center">
              <CurrencyFieldContext.Provider value={true}>
                <InputGroup className="w-40">
                  <InputGroupAddon>
                    <InputGroupText>¥</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    type="number"
                    // A per-model cap is often a fraction of a cent, so a 0.01
                    // step would make the browser refuse the value on submit.
                    step="any"
                    min={0}
                    value={entry.budgetLimit === null ? "" : usdToCny(entry.budgetLimit)}
                    onChange={(event) => {
                      const typed = event.target.valueAsNumber;
                      updateEntry(entry.id, { budgetLimit: Number.isNaN(typed) ? null : cnyToUsd(typed) });
                    }}
                    placeholder={uiT("ui.2f181638c14378b3")}
                    disabled={!premiumUser}
                  />
                </InputGroup>
              </CurrencyFieldContext.Provider>
              <Select
                items={MODEL_BUDGET_PERIOD_OPTIONS}
                value={entry.timePeriod}
                onValueChange={(period: string | null) => period && updateEntry(entry.id, { timePeriod: period })}
              >
                <SelectTrigger className="w-[150px]" disabled={!premiumUser} title={hintWhenLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_BUDGET_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {spent !== undefined && (
              <div className="text-[11px] text-muted-foreground mt-2 ml-1">
                {uiT("ui.fd3977686bdc0a5f")}
                {formatMoney(spent, 4)}
                {entry.budgetLimit !== null && ` of ${formatMoney(Number(entry.budgetLimit), 4)}`}
              </div>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" onClick={addEntry} disabled={!premiumUser} title={hintWhenLocked}>
        <Plus className="w-3 h-3" />
        {uiT("ui.65131641dda9edab")}
      </Button>
    </div>
  );
}

interface ModelMaxBudgetFieldProps extends ModelMaxBudgetEditorProps {
  hint: string;
}

/** The editor with its label, so every form that offers it presents it the same way. */
export function ModelMaxBudgetField({ hint, ...editorProps }: ModelMaxBudgetFieldProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Field>
      <FieldLabel>
        <span title={hint}>{uiT("ui.d60b24269c388c15")}</span>
      </FieldLabel>
      <ModelMaxBudgetEditor {...editorProps} />
    </Field>
  );
}
