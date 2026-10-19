"use client";
import { translateText } from "@/i18n";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import {
  ChevronRight,
  CircleStop,
  ListChecks,
  Play,
  Plug,
  RefreshCw,
  Repeat,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNow } from "@/hooks/useNow";

import { analysisElapsed } from "../../model/progress";
import { money } from "../../model/format";
import { modelsUsed, shortTime, windowLabel } from "../../model/inbox";
import {
  NEXT_ACTION,
  openIssues,
  runSituation,
  type RunAction,
  type RunSituation,
  type SituationInput,
} from "../../model/runSituation";
import type { Finding, Job, Lens } from "../../model/types";
import { activeJob, failedTaskSummary } from "../../model/status";
import { InvestigationProgress } from "../InvestigationProgress";
import type { QueueContext } from "../useQueueReason";
import { StepFeed } from "../StepFeed";

export type RunActionHandlers = Record<RunAction, () => void>;

export interface RunReportProps {
  readonly lens: Lens;
  readonly job: Job | undefined;
  readonly findings: readonly Finding[] | null | undefined;
  readonly connected: boolean;
  readonly ready: boolean;
  readonly busy: boolean;
  readonly picker: ReactNode;
  readonly actions?: RunActionHandlers;
  readonly queue?: QueueContext;
}

interface Facts {
  readonly runs: string;
  readonly found: string;
  readonly openIssues: number;
  readonly reused: number;
}

type Tone = "info" | "success" | "warning" | "destructive" | "muted";

interface SituationView {
  readonly status: string;
  readonly tone: Tone;
  readonly headline: (facts: Facts) => string;
  readonly body: "progress" | "error" | "partial" | null;
}

const completed = ({ found, runs, reused }: Facts) => {
  if (found) return `Found ${found} across ${runs}`;
  if (reused) return `Reused ${plural(reused, "review")} with no new findings`;
  return `Nothing found across ${runs}`;
};

const SITUATIONS: Record<RunSituation, SituationView> = {
  never: { status: "Not run yet", tone: "muted", headline: () => "Run it to get the first report", body: null },
  queued: {
    status: "Queued",
    tone: "info",
    headline: () => "Waiting for an analyzer to pick this up",
    body: "progress",
  },
  running: { status: "Running", tone: "info", headline: () => "Investigating now", body: "progress" },
  budget: {
    status: "Stopped",
    tone: "destructive",
    headline: () => "Stopped: more investigation budget is needed",
    body: "error",
  },
  offline: {
    status: "Failed",
    tone: "destructive",
    headline: () => "Stopped: no analyzer is connected",
    body: "error",
  },
  failed: { status: "Failed", tone: "destructive", headline: () => "Stopped before it finished", body: "error" },
  cancelled: {
    status: "Cancelled",
    tone: "muted",
    headline: ({ runs }) => `Cancelled after reviewing ${runs}`,
    body: "error",
  },
  partial: {
    status: "Partial results",
    tone: "warning",
    headline: (known) => (known.found ? completed(known) : `Stopped after reviewing ${known.runs}`),
    body: "partial",
  },
  unknown: { status: "Completed", tone: "success", headline: ({ runs }) => `Reviewed ${runs}`, body: null },
  issues: { status: "Completed", tone: "success", headline: completed, body: null },
  watching: { status: "Completed", tone: "success", headline: completed, body: null },
  clean: { status: "Completed", tone: "success", headline: completed, body: null },
};

interface ActionView {
  readonly label: (facts: Facts) => string;
  readonly icon: LucideIcon;
  readonly variant: ComponentProps<typeof Button>["variant"];
  readonly needsReady: boolean;
}

const ACTIONS: Record<RunAction, ActionView> = {
  run: { label: () => "Run now", icon: Play, variant: "default", needsReady: true },
  stop: { label: () => "Stop run", icon: CircleStop, variant: "outline", needsReady: false },
  retry: { label: () => "Retry", icon: RefreshCw, variant: "default", needsReady: true },
  raiseBudget: { label: () => "Raise budget", icon: Wallet, variant: "default", needsReady: false },
  connectWorker: { label: () => "Connect worker", icon: Plug, variant: "default", needsReady: false },
  reviewIssues: {
    label: ({ openIssues: count }) => `Review ${plural(count, "issue")}`,
    icon: ListChecks,
    variant: "default",
    needsReady: false,
  },
  monitor: { label: () => "Monitor this", icon: Repeat, variant: "default", needsReady: true },
};

const TONE_CLASS: Record<Tone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const plural = (count: number, noun: string) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

function facts(job: Job | undefined, findings: readonly Finding[] | null | undefined): Facts {
  const count = (kind: Finding["kind"], noun: string) => {
    const total = findings?.filter((f) => f.kind === kind).length ?? 0;
    return total ? plural(total, noun) : "";
  };
  return {
    runs: plural(job?.coverage?.screened ?? 0, "run"),
    found: [count("issue", "issue"), count("pattern", "pattern")].filter(Boolean).join(" and "),
    openIssues: openIssues(findings),
    reused: job?.coverage?.reused ?? 0,
  };
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</dd>
      {note && <dd className="truncate text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

function coverageNote(job: Job): string | undefined {
  const { partial = 0, unassessable = 0, inconclusive = 0, reused = 0 } = job.coverage ?? {};
  const notes = [
    reused && `${reused} reused`,
    partial && `${partial} partial`,
    unassessable && `${unassessable} unreadable`,
    inconclusive && `${inconclusive} inconclusive`,
  ].filter(Boolean);
  return notes.length ? notes.join(" · ") : undefined;
}

const isActive = (job: Job) => job.status === "queued" || job.status === "running";

function issueStat(job: Job, findings: readonly Finding[] | null | undefined) {
  if (isActive(job)) return { value: "–", note: "When the run finishes" };
  if (job.status !== "completed" || findings == null) return { value: "–" };
  const issues = findings.filter((f) => f.kind === "issue");
  const high = issues.filter((f) => f.priority === "high").length;
  return { value: issues.length.toLocaleString(), note: high ? `${high} high priority` : undefined };
}

function RunDuration({ job }: { job: Job }) {
  const now = useNow(isActive(job) ? 1000 : 60000);
  const end = job.finished_at ? Date.parse(job.finished_at) : now;
  return isActive(job) || job.finished_at ? analysisElapsed(job.created_at, end) : "–";
}

function RunStats({ job, findings }: { job: Job; findings: readonly Finding[] | null | undefined }) {
  const { t: uiT } = useDashboardLanguage();

  const calls = (job.steps ?? []).filter((step) => step.kind === "model").length;
  const { screened = 0, selected = 0 } = job.coverage ?? {};
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <Stat label={uiT("ui.204a5eb2cd28")} value={money(job.cost ?? 0)} note={plural(calls, "model call")} />
      <Stat
        label={uiT("ui.4fc52a3c4c55")}
        value={<RunDuration job={job} />}
        note={`Started ${shortTime(job.created_at)}`}
      />
      <Stat
        label={uiT("ui.e757aa3c9fb7e665")}
        value={`${screened.toLocaleString()} / ${selected.toLocaleString()}`}
        note={coverageNote(job)}
      />
      <Stat label={uiT("ui.666067dd376e5d45")} {...issueStat(job, findings)} />
    </dl>
  );
}

function RunFailure({ job, connected }: { job: Job; connected: boolean }) {
  return (
    <div role="alert" className="space-y-2 rounded-md bg-destructive/5 p-3">
      <RunError job={job} connected={connected} />
    </div>
  );
}

function RunError({ job, connected }: { job: Job; connected: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <>
      <pre
        aria-label="Investigation error"
        className="whitespace-pre-wrap break-words font-mono text-xs text-destructive"
      >
        {job.error}
      </pre>
      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <span>
          {uiT("ui.00d60e31a4e6b834")} <span className="font-mono">{job.id}</span>
        </span>
        <span>
          {uiT("ui.5e2c614c23f0")} <span>{job.settings.model}</span>
        </span>
        <span>
          {uiT("ui.a67b04cd5c491d4d")} {connected ? uiT("ui.2f0b77eab927afda") : uiT("ui.98b1024757dbd75d")}
        </span>
      </p>
    </>
  );
}

function RunPartial({ job, connected }: { job: Job; connected: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div role="status" className="space-y-2 rounded-md bg-warning/5 p-3 text-sm">
      <p>
        {translateText(failedTaskSummary(job))}
        {uiT("ui.08f94e1d0a4715f9")}
      </p>
      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">{uiT("ui.7bbc36905270774e")}</summary>
        <div className="mt-2 space-y-2">
          <RunError job={job} connected={connected} />
        </div>
      </details>
    </div>
  );
}

function RunLog({ job }: { job: Job }) {
  const { t: uiT } = useDashboardLanguage();

  const models = modelsUsed(job.steps ?? []);
  return (
    <Collapsible className="border-t pt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <CollapsibleTrigger className="group flex items-center gap-1 font-medium text-foreground hover:underline">
          <ChevronRight className="size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
          {uiT("ui.a9d562d6b494c89c")}
        </CollapsibleTrigger>
        <span className="truncate">
          {job.trigger === "manual" ? uiT("ui.b0b9fe24ffa9") : uiT("ui.4724f344c1c0e4a1")} · {windowLabel(job)}
          {models.length > 0 && ` · ${models.join(", ")}`}
        </span>
      </div>
      <CollapsibleContent className="pt-3">
        <StepFeed job={job} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function NextAction({
  action,
  facts: known,
  ready,
  busy,
  onClick,
}: {
  action: RunAction;
  facts: Facts;
  ready: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  const { label, icon: Icon, variant, needsReady } = ACTIONS[action];
  return (
    <Button variant={variant} disabled={busy || (needsReady && !ready)} onClick={onClick}>
      <Icon className="size-3.5" />
      {label(known)}
    </Button>
  );
}

function nextAction(lens: Lens, job: Job | undefined, situation: RunSituation): RunAction | null {
  if (job === undefined || job.id === lens.jobs[0]?.id) return NEXT_ACTION[situation];
  return activeJob(lens.jobs) ? "stop" : null;
}

export function RunReport({ lens, job, findings, connected, ready, busy, picker, actions, queue }: RunReportProps) {
  const { t: uiT } = useDashboardLanguage();

  const input: SituationInput = { lens, job, findings, connected };
  const situation = runSituation(input);
  const view = SITUATIONS[situation];
  const known = facts(job, findings);
  const action = nextAction(lens, job, situation);
  return (
    <section aria-label={uiT("ui.6b5c209e013badfb")} className="space-y-4 rounded-lg border p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-xs font-medium", TONE_CLASS[view.tone])}>{view.status}</p>
          <h3 className="mt-0.5 text-base font-semibold">{view.headline(known)}</h3>
        </div>
        <div className="flex items-center gap-1">
          {picker}
          {action && actions && (
            <NextAction action={action} facts={known} ready={ready} busy={busy} onClick={actions[action]} />
          )}
        </div>
      </header>
      {job && view.body === "progress" && <InvestigationProgress key={job.id} job={job} queue={queue} />}
      {job?.error && view.body === "partial" && <RunPartial job={job} connected={connected} />}
      {job?.error && view.body === "error" && <RunFailure job={job} connected={connected} />}
      {job && <RunStats job={job} findings={findings} />}
      {job && <RunLog job={job} />}
    </section>
  );
}
