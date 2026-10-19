"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { SearchSelect } from "@/components/shared/SearchSelect";
import { StatusDot } from "@/components/shared/StatusDot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { uiHref } from "@/utils/uiHref";

import { useLensApi } from "../../data/LensServices";
import { lensKeys, lensQueries } from "../../data/queries";
import { SIGNAL_LIBRARY, signalsConfigured, systemOneModels } from "../../model/signals";
import { WatchPicker } from "../../setup/WatchPicker";
import type { SignalConfig } from "../../model/types";
import { SettingsCard, SettingsSection } from "../SettingsSection";
import {
  MAX_SIGNALS,
  configFrom,
  draftFrom,
  draftProblems,
  newRow,
  type SignalDraft,
  type SignalRow,
} from "./signalDraft";

const LIBRARY_QUESTIONS: ReadonlySet<string> = new Set(SIGNAL_LIBRARY.map((signal) => signal.question));

export function SignalSettings() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <SettingsSection heading="Signals" description={uiT("ui.e2ac58497e2f71db")}>
      <SignalConfigLoader />
    </SettingsSection>
  );
}

function SignalConfigLoader() {
  const { t: uiT } = useDashboardLanguage();

  const api = useLensApi();
  const config = useQuery(lensQueries.signalConfig(api));
  if (config.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {uiT("ui.0919cd0a00215cff")} {config.error.message}
      </p>
    );
  if (!config.data) return <Skeleton aria-label={uiT("ui.ba36829d43afad5a")} className="h-40 w-full" />;
  return <SignalForm saved={config.data} />;
}

const FieldError = ({ children }: { children?: string }) =>
  children ? <p className="mt-1 text-xs text-destructive">{children}</p> : null;

function SetupCallout({ hasModels }: { hasModels: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <Flag aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium">{uiT("ui.3b9117b0a4774aea")}</p>
        {hasModels ? (
          <p className="text-xs text-muted-foreground">{uiT("ui.695db77d0411610b")}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {uiT("ui.7b9bff4cd1cb504d")}{" "}
            <Link
              href={uiHref("models-and-endpoints")}
              className="font-medium text-foreground underline underline-offset-2"
            >
              {uiT("ui.4e7cc82a7500")}
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}

function SignalFields({
  row,
  problems,
  onChange,
  onRemove,
}: {
  row: SignalRow;
  problems?: { name?: string; question?: string };
  onChange: (row: SignalRow) => void;
  onRemove: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const label = row.name.trim() || "new signal";
  return (
    <li className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[200px_minmax(0,1fr)_auto]">
      <div>
        <Input
          aria-label={uiT("ui.f384f5eec63fb067")}
          placeholder={uiT("ui.56e60702769e4a73")}
          value={row.name}
          aria-invalid={Boolean(problems?.name)}
          onChange={(event) => onChange({ ...row, name: event.target.value })}
        />
        <FieldError>{problems?.name}</FieldError>
      </div>
      <div>
        <Textarea
          aria-label={uiT("ui.eaaa94a3e6acb6d4", { v0: String(label) })}
          placeholder={uiT("ui.9b8959d57127311d")}
          rows={2}
          value={row.question}
          aria-invalid={Boolean(problems?.question)}
          onChange={(event) => onChange({ ...row, question: event.target.value })}
        />
        <FieldError>{problems?.question}</FieldError>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={uiT("ui.86790c6d4f116494", { v0: String(label) })}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

export function SignalForm({ saved }: { saved: SignalConfig }) {
  const { t: uiT } = useDashboardLanguage();

  const api = useLensApi();
  const queryClient = useQueryClient();
  const modelId = useId();
  const thresholdId = useId();
  const [draft, setDraft] = useState<SignalDraft>(() => draftFrom(saved));
  const [draftBase, setDraftBase] = useState<SignalConfig>(() => saved);
  const [savedElsewhere, setSavedElsewhere] = useState(false);
  const savedKey = JSON.stringify(saved);
  const draftBaseKey = JSON.stringify(draftBase);
  if (savedKey !== draftBaseKey) {
    const draftIsDirty = JSON.stringify(configFrom(draft)) !== JSON.stringify(configFrom(draftFrom(draftBase)));
    setDraftBase(saved);
    if (draftIsDirty) {
      setSavedElsewhere(true);
    } else {
      setDraft(draftFrom(saved));
      setSavedElsewhere(false);
    }
  }
  const details = useQuery(lensQueries.modelDetails(api));
  const models = systemOneModels(details.data?.data ?? []);
  const options = models.map((info) => ({
    value: info.model_group,
    label: info.model_group,
    sublabel: info.providers.join(", "),
  }));
  const problems = draftProblems(draft);
  const next = configFrom(draft);
  const dirty = JSON.stringify(next) !== JSON.stringify(configFrom(draftFrom(draftBase)));
  const save = useMutation({
    mutationFn: (config: SignalConfig) => api.saveSignalConfig(config),
    onSuccess: (config) => {
      queryClient.setQueryData(lensKeys.signalConfig(api.scope), config);
      setDraft(draftFrom(config));
      setDraftBase(config);
      setSavedElsewhere(false);
      void queryClient.invalidateQueries({ queryKey: ["traceSignals"] });
    },
  });
  const setRows = (rows: readonly SignalRow[]) => setDraft((current) => ({ ...current, rows }));
  const addRow = () => setRows([...draft.rows, newRow(crypto.randomUUID())]);
  const active = signalsConfigured(saved);
  const custom = draft.rows.filter((row) => !LIBRARY_QUESTIONS.has(row.question));
  const picked = new Set(
    SIGNAL_LIBRARY.filter((signal) => draft.rows.some((row) => row.question === signal.question)).map(
      (signal) => signal.id,
    ),
  );
  const pick = (next: ReadonlySet<string>) =>
    setRows([
      ...SIGNAL_LIBRARY.filter((signal) => next.has(signal.id)).map(
        (signal) =>
          draft.rows.find((row) => row.question === signal.question) ?? {
            key: crypto.randomUUID(),
            id: draft.rows.some((row) => row.id === signal.id) ? "" : signal.id,
            name: signal.name,
            question: signal.question,
          },
      ),
      ...custom,
    ]);
  const loadLatest = () => {
    setDraft(draftFrom(saved));
    setDraftBase(saved);
    setSavedElsewhere(false);
  };

  return (
    <>
      <SettingsCard className="space-y-4">
        <p role="status" className="inline-flex items-center gap-2 text-sm">
          <StatusDot state={active ? "ok" : "off"} />
          {active ? uiT("ui.274527056871005b", { v0: String(saved.model) }) : uiT("ui.f6ffd283344c0ee9")}
        </p>
        {!saved.model && !details.isPending && <SetupCallout hasModels={models.length > 0} />}
        {savedElsewhere && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
            <span>{uiT("ui.c26bb0a30b34a423")}</span>
            <Button type="button" variant="outline" size="sm" onClick={loadLatest}>
              {uiT("ui.86edc8705b8329c1")}
            </Button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="space-y-1.5">
            <label htmlFor={modelId} className="text-sm font-medium">
              {uiT("ui.755e18b1f8dfc937")}
            </label>
            <SearchSelect
              inputId={modelId}
              aria-label={uiT("ui.755e18b1f8dfc937")}
              options={options}
              value={draft.model}
              onValueChange={(value) => setDraft((current) => ({ ...current, model: value ?? "" }))}
              placeholder={details.isPending ? uiT("ui.cc8b4624f7659c68") : uiT("ui.f998e27d3d14ad91")}
              disabled={details.isPending}
              emptyText={uiT("ui.ef51b5bbcba346c0")}
              allowClear
            />
            <p className="text-xs text-muted-foreground">{uiT("ui.8d255f02505d1238")}</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={thresholdId} className="text-sm font-medium">
              {uiT("ui.4f95064028db657c")}
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                id={thresholdId}
                type="number"
                inputMode="numeric"
                min={5}
                max={95}
                step={5}
                value={Number.isNaN(draft.thresholdPercent) ? "" : draft.thresholdPercent}
                aria-invalid={Boolean(problems.threshold)}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, thresholdPercent: event.target.valueAsNumber }))
                }
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <FieldError>{problems.threshold}</FieldError>
          </div>
        </div>
        <div className="space-y-4 border-t border-border pt-4">
          <WatchPicker
            label={uiT("ui.e6dd36ecc6aba604")}
            options={SIGNAL_LIBRARY}
            selected={picked}
            onChange={pick}
            onAddCustom={addRow}
            addDisabled={draft.rows.length >= MAX_SIGNALS}
          />
          {custom.length > 0 && (
            <ul aria-label={uiT("ui.dcaca9b672da3972")} className="space-y-2">
              {custom.map((row) => (
                <SignalFields
                  key={row.key}
                  row={row}
                  problems={problems.rows.get(row.key)}
                  onChange={(changed) => setRows(draft.rows.map((other) => (other.key === row.key ? changed : other)))}
                  onRemove={() => setRows(draft.rows.filter((other) => other.key !== row.key))}
                />
              ))}
            </ul>
          )}
          {draft.rows.length === 0 && <p className="text-xs text-muted-foreground">{uiT("ui.bc7ad87f328c51aa")}</p>}
          <FieldError>{problems.signals}</FieldError>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          {save.error && (
            <p role="alert" className="text-sm text-destructive">
              {uiT("ui.b53211bf0430a35b")} {save.error.message}
            </p>
          )}
          {save.isSuccess && !dirty && <p className="text-xs text-muted-foreground">{uiT("ui.b5c120b316c237a0")}</p>}
          <Button disabled={!dirty || problems.any || save.isPending} onClick={() => save.mutate(next)}>
            {save.isPending ? uiT("ui.23e39291d6135814") : uiT("ui.d6d1ff6135c498bf")}
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}
