"use client";
import { t as translateUi } from "@/i18n";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useQueryClient } from "@tanstack/react-query";
import { Check, DatabaseZap, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { extractProxyErrorMessage } from "@/lib/http/client";
import { cn } from "@/lib/cva.config";
import { toast } from "@/lib/toast";

import { useTracesLive } from "../traces/api";
import { useOptionalLensApi } from "../data/LensServices";
import { useOptionalOnboarding } from "../onboarding/OnboardingContext";
import { useDatasetRoute, useLensRoute } from "../route";
import {
  datasetKeys,
  isRevisionConflict,
  useBuildCases,
  useCreateDataset,
  useDataset,
  useDatasets,
  useSaveRevision,
} from "./api";
import {
  casePrompt,
  caseReplySummary,
  EMPTY_DRAFT,
  revisionCases,
  setExpected,
  SKIP_REASON_TEXT,
  toggleCase,
  type Draft,
} from "./draft";
import type { BuildSource, Dataset, DatasetCase, DatasetMessage, DatasetSummary, SkippedCase } from "./types";

const NEW_DATASET = "__new__";

const cases = (count: number): string => `${count} ${count === 1 ? "case" : "cases"}`;

/** Admins can save cases; the sample session keeps its datasets in memory so anyone can try it. */
export function useCanAddToDataset(): boolean {
  const api = useOptionalLensApi();
  const onboarding = useOptionalOnboarding();
  const live = useTracesLive();
  const canWrite = !!onboarding && onboarding.canInvestigate && !onboarding.readOnly;
  return !!api && (!live || canWrite);
}

export interface AddToDatasetDialogProps {
  readonly sources: readonly BuildSource[];
  readonly agentName?: string;
  readonly onClose: () => void;
}

function useOpenSavedDataset() {
  const { setTab } = useLensRoute();
  const { openDataset } = useDatasetRoute();
  return (id: string) => {
    setTab("datasets");
    openDataset(id);
  };
}

/** Defaults to the agent's dataset when one exists, otherwise to a new one once the list has loaded. */
function useDatasetTarget(agentName: string) {
  const datasets = useDatasets();
  const [picked, setPicked] = useState<string | null>(null);
  const forAgent = datasets.data?.find((item) => agentName && item.agent_name === agentName)?.id;
  const target = picked ?? forAgent ?? (datasets.isPending ? null : NEW_DATASET);
  const existingId = target === NEW_DATASET ? null : target;
  return { datasets: datasets.data ?? [], target, existingId, setPicked };
}

export function AddToDatasetDialog({ sources, agentName = "", onClose }: AddToDatasetDialogProps) {
  const { t: uiT } = useDashboardLanguage();

  const { datasets, target, existingId, setPicked } = useDatasetTarget(agentName);
  const dataset = useDataset(existingId);
  const build = useBuildCases({ sources: [...sources], dataset_id: existingId ?? "" }, target !== null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [name, setName] = useState(agentName ? `${agentName} cases` : "");
  const [conflict, setConflict] = useState(false);
  const create = useCreateDataset();
  const save = useSaveRevision();
  const queryClient = useQueryClient();
  const openSaved = useOpenSavedDataset();

  const built = build.data?.cases ?? [];
  const chosen = built.filter((item) => !draft.excluded.has(item.id)).length;
  const busy = create.isPending || save.isPending;
  const targetReady = existingId ? dataset.isSuccess : name.trim().length > 0;
  const hasCases = build.isSuccess && chosen > 0;
  const idle = !busy && !conflict;
  const canSave = hasCases && targetReady && idle;

  const pickTarget = (next: string) => {
    setPicked(next);
    setConflict(false);
  };

  const reload = async () => {
    setConflict(false);
    await queryClient.invalidateQueries({ queryKey: datasetKeys.all() });
  };

  const baseDataset = async (): Promise<Dataset | undefined> => {
    if (existingId) return dataset.data;
    return create.mutateAsync({ name: name.trim(), agent_name: agentName }).catch((error: unknown) => {
      toast.fromError(error);
      return undefined;
    });
  };

  const submit = async () => {
    const base = await baseDataset();
    if (!base) return;
    try {
      const saved = await save.mutateAsync({
        datasetId: base.id,
        body: { base_revision: base.revision, cases: revisionCases(base.cases, built, draft) },
      });
      toast.success(
        translateUi("ui.8e1f9c04459ae6dc", undefined, { v0: String(cases(chosen)), v1: String(saved.name) }),
        {
          description: (
            <button type="button" className="underline underline-offset-2" onClick={() => openSaved(saved.id)}>
              {translateUi("ui.8ea5b75e725aa2d2")}
            </button>
          ),
        },
      );
      onClose();
    } catch (error) {
      if (isRevisionConflict(error)) setConflict(true);
      else toast.fromError(error);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{uiT("ui.159d93ec1948b77b")}</DialogTitle>
          <DialogDescription>{uiT("ui.5a72cdfcd392321e")}</DialogDescription>
        </DialogHeader>
        <TargetFields datasets={datasets} target={target} name={name} onTarget={pickTarget} onName={setName} />
        <CasePreview
          build={build}
          draft={draft}
          chosen={chosen}
          onToggle={(id) => setDraft((current) => toggleCase(current, id))}
          onExpected={(id, text) => setDraft((current) => setExpected(current, id, text))}
        />
        <DialogFooter className="items-center sm:justify-between">
          {conflict ? <ConflictNotice onReload={() => void reload()} /> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button disabled={!canSave} onClick={() => void submit()}>
              {busy && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
              {chosen > 0 ? uiT("ui.4b837b6e6fa7fa56", { v0: String(cases(chosen)) }) : uiT("ui.1509f561f241")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TargetFieldsProps {
  readonly datasets: readonly DatasetSummary[];
  readonly target: string | null;
  readonly name: string;
  readonly onTarget: (target: string) => void;
  readonly onName: (name: string) => void;
}

function TargetFields({ datasets, target, name, onTarget, onName }: TargetFieldsProps) {
  const { t: uiT } = useDashboardLanguage();

  const nameId = useId();
  const items = [
    { value: NEW_DATASET, label: uiT("ui.90174b80a0007ea0") },
    ...datasets.map((item) => ({ value: item.id, label: item.name })),
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        {uiT("ui.4411e525721e7dd8")}
        <Select value={target} items={items} onValueChange={(next: string | null) => next !== null && onTarget(next)}>
          <SelectTrigger aria-label={uiT("ui.4411e525721e7dd8")} size="sm" className="w-full text-sm">
            <SelectValue placeholder={uiT("ui.d7fcee61faac0802")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEW_DATASET}>{uiT("ui.90174b80a0007ea0")}</SelectItem>
            {datasets.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
                <span className="text-xs text-muted-foreground">{cases(item.case_count)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {target === NEW_DATASET && (
        <label htmlFor={nameId} className="grid gap-1.5 text-xs text-muted-foreground">
          {uiT("ui.dcd1d5223f73")}
          <Input
            id={nameId}
            value={name}
            maxLength={120}
            placeholder={uiT("ui.5496b029bdddf643")}
            onChange={(event) => onName(event.target.value)}
            className="h-8"
          />
        </label>
      )}
    </div>
  );
}

function ConflictNotice({ onReload }: { onReload: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <p role="alert" className="flex items-center gap-2 text-xs text-destructive">
      <TriangleAlert aria-hidden="true" className="size-3.5" />
      {uiT("ui.a24cec800afe2abc")}
      <Button variant="outline" size="xs" onClick={onReload}>
        <RotateCw aria-hidden="true" />
        {uiT("ui.bdc090ec61e3")}
      </Button>
    </p>
  );
}

interface CasePreviewProps {
  readonly build: ReturnType<typeof useBuildCases>;
  readonly draft: Draft;
  readonly chosen: number;
  readonly onToggle: (id: string) => void;
  readonly onExpected: (id: string, text: string) => void;
}

function CasePreview({ build, draft, chosen, onToggle, onExpected }: CasePreviewProps) {
  const { t: uiT } = useDashboardLanguage();

  if (build.isPending)
    return (
      <p role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        {uiT("ui.65c280a9a093e1cf")}
      </p>
    );
  if (build.isError)
    return (
      <p role="alert" className="flex items-center gap-2 py-6 text-sm text-destructive">
        <TriangleAlert aria-hidden="true" className="size-4" />
        {extractProxyErrorMessage(build.error)}
      </p>
    );
  const { cases, skipped } = build.data;
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{uiT("ui.2249bd503ec47d72")}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {chosen} {uiT("ui.28391d3bc64ec15c")} {cases.length} {uiT("ui.d7cbbb688b2e506c")}
        </p>
      </div>
      {cases.length === 0 ? (
        <p className="rounded-xl bg-muted/60 px-3 py-4 text-sm text-muted-foreground">{uiT("ui.5fcf1ad4fac28631")}</p>
      ) : (
        <ul aria-label={uiT("ui.2fe347bda4760ddb")} className="grid gap-2.5">
          {cases.map((item, index) => (
            <CaseTile
              key={item.id}
              item={item}
              index={index}
              selected={!draft.excluded.has(item.id)}
              expected={draft.expected.get(item.id) ?? item.expected}
              onToggle={() => onToggle(item.id)}
              onExpected={(text) => onExpected(item.id, text)}
            />
          ))}
        </ul>
      )}
      {skipped.length > 0 && <SkippedList skipped={skipped} />}
    </div>
  );
}

function CaseTile({
  item,
  index,
  selected,
  expected,
  onToggle,
  onExpected,
}: {
  item: DatasetCase;
  index: number;
  selected: boolean;
  expected: string;
  onToggle: () => void;
  onExpected: (text: string) => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const label = `Case ${index + 1}`;
  return (
    <li
      className={cn(
        "relative grid gap-2 rounded-xl p-3 transition-colors",
        selected
          ? "bg-background ring-[1.5px] ring-foreground ring-inset"
          : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      {selected && (
        <Check
          aria-hidden="true"
          className="absolute top-3 right-3 size-3.5 animate-in fade-in-0 zoom-in-50 duration-200 motion-reduce:animate-none"
        />
      )}
      <div className="flex min-w-0 items-start gap-2.5 pr-6">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={uiT("ui.8890b6d6a699740f", { v0: String(label) })}
          className="mt-0.5"
        />
        <span className="grid min-w-0 gap-0.5">
          <span className="line-clamp-2 text-sm font-medium text-foreground">{casePrompt(item) || label}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{caseReplySummary(item)}</span>
        </span>
      </div>
      {item.messages.length > 0 && (
        <details className="pl-6.5 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {uiT("ui.4df1d87f05574b41")} {item.messages.length}{" "}
            {item.messages.length === 1 ? uiT("ui.ab530a13e4591498") : uiT("ui.f5cccfb737512bed")}
          </summary>
          <CaseConversation messages={item.messages} />
        </details>
      )}
      {selected && (
        <label className="grid gap-1 pl-6.5 text-xs text-muted-foreground">
          {uiT("ui.ca99b7f1b14ee2c0")}
          <Textarea
            value={expected}
            rows={1}
            placeholder={uiT("ui.0805ad8daf1097c3")}
            onChange={(event) => onExpected(event.target.value)}
            aria-label={uiT("ui.9b3c31bc7e386acd", { v0: String(label) })}
            className="min-h-8 text-sm"
          />
        </label>
      )}
    </li>
  );
}

export function CaseConversation({ messages }: { messages: readonly DatasetMessage[] }) {
  return (
    <ol className="mt-2 grid gap-1.5">
      {messages.map((message, index) => (
        <li key={index} className="grid gap-0.5 rounded-md bg-muted/50 px-2.5 py-1.5">
          <span className="font-medium text-foreground capitalize">{message.name || message.role}</span>
          {message.content && <span className="line-clamp-4 whitespace-pre-wrap">{message.content}</span>}
          {message.tool_calls.map((call, callIndex) => (
            <code key={callIndex} className="line-clamp-2 font-mono break-all text-muted-foreground">
              {call.name}({call.arguments})
            </code>
          ))}
        </li>
      ))}
    </ol>
  );
}

function SkippedList({ skipped }: { skipped: readonly SkippedCase[] }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{uiT("ui.12698ce1ea5cd4ab")}</p>
      <ul aria-label={uiT("ui.12698ce1ea5cd4ab")} className="grid gap-1 text-xs text-muted-foreground">
        {skipped.map((item, index) => (
          <li key={`${item.source.trace_id}-${item.source.span_id}-${index}`} className="flex gap-2">
            <span className="text-foreground">{SKIP_REASON_TEXT[item.reason]}</span>
            {item.source.trace_id && (
              <span className="truncate">
                {uiT("ui.eafe895eb8119e6e")} {item.source.trace_id.slice(0, 12)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface AddToDatasetButtonProps {
  readonly sources: readonly BuildSource[];
  readonly agentName?: string;
  readonly label?: string;
  readonly className?: string;
}

/** Renders nothing for viewers who cannot save; the dialog mounts, and builds cases, only once opened. */
export function AddToDatasetButton({
  sources,
  agentName,
  label = translateUi("ui.159d93ec1948b77b"),
  className,
}: AddToDatasetButtonProps) {
  useDashboardLanguage();

  const allowed = useCanAddToDataset();
  const [open, setOpen] = useState(false);
  if (!allowed) return null;
  return (
    <>
      <Button
        variant="outline"
        size="xs"
        className={cn("h-7 shrink-0 gap-1.5 text-xs shadow-none active:scale-[0.97]", className)}
        onClick={() => setOpen(true)}
      >
        <DatabaseZap aria-hidden="true" className="size-3" />
        {translateText(label)}
      </Button>
      {open && <AddToDatasetDialog sources={sources} agentName={agentName} onClose={() => setOpen(false)} />}
    </>
  );
}
