"use client";
import { getActiveLocale } from "@/i18n";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Check } from "lucide-react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import { formatCost } from "../../list/AgentTracesTable";
import { errorHeadline } from "../content/SpanError";
import { SpanIcon } from "../../ui/SpanIcon";
import type { GroupRowData } from "../../tree";
import type { Span, SpanType } from "../../types";
import { fmtMs, fmtTok } from "../../utils";

export const HOVER_OPEN_DELAY_MS = 300;
const HOVER_CLOSE_DELAY_MS = 100;

const TYPE_LABEL: Record<SpanType, string> = {
  get agent() {
    return translateUi("ui.11b39c93777e");
  },
  get llm() {
    return translateUi("ui.674900a77b798af1");
  },
  get tool() {
    return translateUi("ui.2e53bdcd0740867b");
  },
  get chain() {
    return translateUi("ui.dae0896cbc2c67bf");
  },
  get framework() {
    return translateUi("ui.192eb4525aabd7e2");
  },
  get retriever() {
    return translateUi("ui.ac722b3e8e29bad1");
  },
  get embedding() {
    return translateUi("ui.4c1a0852823452e1");
  },
  get reranker() {
    return translateUi("ui.9db775515ee555b0");
  },
  get guardrail() {
    return translateUi("ui.ba3f7a9c79a7");
  },
  get evaluator() {
    return translateUi("ui.f2a57bad3d4b112c");
  },
  get prompt() {
    return translateUi("ui.5c39123805ffb4e2");
  },
  get decision() {
    return translateUi("ui.640ae4baf96061fe");
  },
};

const ABSOLUTE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZoneName: "short",
};
const ABSOLUTE_TIME = {
  en: new Intl.DateTimeFormat("en-US", ABSOLUTE_TIME_OPTIONS),
  zh: new Intl.DateTimeFormat("zh-CN", ABSOLUTE_TIME_OPTIONS),
};

export const absoluteTime = (traceStartMs: number, offsetMs: number): string =>
  ABSOLUTE_TIME[getActiveLocale()].format(new Date(traceStartMs + offsetMs));

export interface HoverFacts {
  name: string;
  type: SpanType;
  model: string | null;
  startMs: number;
  durationMs: number;
  tokens: number;
  spend: number | null;
  error: string | null;
  failed: boolean;
  tags: readonly string[];
}

const agentTags = (agent: string): readonly string[] => (agent ? [`agent:${agent}`] : []);

export const spanFacts = (span: Span): HoverFacts => ({
  name: span.name,
  type: span.type,
  model: span.model,
  startMs: span.start_offset_ms,
  durationMs: span.duration_ms,
  tokens: span.input_tokens + span.output_tokens,
  spend: span.spend ?? null,
  error: span.error ?? null,
  failed: span.status === "error",
  tags: agentTags(span.agent),
});

export const groupFacts = (row: GroupRowData): HoverFacts => {
  const start = Math.min(...row.members.map((m) => m.start_offset_ms));
  const end = Math.max(...row.members.map((m) => m.start_offset_ms + m.duration_ms));
  return {
    name: `${row.name} ×${row.members.length}`,
    type: row.type,
    model: row.members[0]?.model ?? null,
    startMs: start,
    durationMs: end - start,
    tokens: row.members.reduce((sum, m) => sum + m.input_tokens + m.output_tokens, 0),
    spend: null,
    error: row.members.find((m) => m.status === "error" && m.error)?.error ?? null,
    failed: row.failedCount > 0,
    tags: agentTags(row.agent),
  };
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-trace-duration">{label}</dt>
      <dd className="font-mono text-trace-text tabular-nums">{value}</dd>
    </div>
  );
}

function FactSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <h4 className="font-semibold text-trace-text">{title}</h4>
      {children}
    </section>
  );
}

function HoverCardBody({ facts, traceStartMs }: { facts: HoverFacts; traceStartMs: number }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <SpanIcon type={facts.type} model={facts.model} error={facts.failed} size="sm" />
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-trace-text">{facts.name}</span>
            {!facts.failed && (
              <span
                className="grid size-4 shrink-0 place-items-center rounded-full bg-trace-ok p-0.5"
                aria-label={uiT("ui.c88a0b907419")}
              >
                <Check className="size-3 text-trace-ok-glyph" strokeWidth={2.5} />
              </span>
            )}
          </div>
          <span className="text-xs text-trace-duration">
            {TYPE_LABEL[facts.type]}
            {facts.model ? ` · ${facts.model}` : ""}
          </span>
        </div>
      </div>
      <FactSection title={uiT("ui.33b93476cf59")}>
        <dl className="flex flex-col gap-1.5">
          <Fact label={uiT("ui.e4bb9f1ece9af926")} value={absoluteTime(traceStartMs, facts.startMs)} />
          <Fact
            label={uiT("ui.f4db1e48476f6075")}
            value={absoluteTime(traceStartMs, facts.startMs + facts.durationMs)}
          />
          <Fact label={uiT("ui.4fc52a3c4c55")} value={fmtMs(facts.durationMs)} />
        </dl>
      </FactSection>
      {(facts.tokens > 0 || facts.spend != null) && (
        <FactSection title={uiT("ui.8d59829c1e15")}>
          <dl className="flex flex-col gap-1.5">
            {facts.tokens > 0 && <Fact label="Tokens" value={fmtTok(facts.tokens)} />}
            {facts.spend != null && <Fact label={uiT("ui.204a5eb2cd28")} value={formatCost(facts.spend)} />}
          </dl>
        </FactSection>
      )}
      {facts.tags.length > 0 && (
        <FactSection title={uiT("ui.1331275bc537")}>
          <ul className="flex flex-wrap gap-1">
            {facts.tags.map((tag) => (
              <li key={tag} className="rounded-sm bg-trace-tag px-1 py-0.5 text-trace-duration">
                {tag}
              </li>
            ))}
          </ul>
        </FactSection>
      )}
      {facts.error && (
        <div className="rounded-sm bg-destructive/10 px-2 py-1.5 font-mono text-xs break-words text-destructive">
          {errorHeadline(facts.error)}
        </div>
      )}
    </div>
  );
}

interface SpanHoverCardProps {
  facts: HoverFacts;
  traceStartMs: number;
  children: React.ReactElement;
}

/** Wraps a tree row: after a hover delay, shows timing, usage, tags and the failure headline beside the drawer. */
export function SpanHoverCard({ facts, traceStartMs, children }: SpanHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger delay={HOVER_OPEN_DELAY_MS} closeDelay={HOVER_CLOSE_DELAY_MS} render={children} />
      <HoverCardContent
        side="left"
        align="start"
        sideOffset={0}
        alignOffset={0}
        data-testid="span-hover-card"
        className="max-h-[min(520px,calc(100vh-16px))] w-auto max-w-[420px] overflow-y-auto rounded-md border border-trace-border bg-trace-surface p-3 text-sm leading-tight text-trace-text shadow-trace-md ring-0 transition-opacity duration-150 ease-[cubic-bezier(0,0,0.2,1)] data-closed:animate-none data-ending-style:opacity-0 data-open:animate-none motion-reduce:transition-none"
      >
        <HoverCardBody facts={facts} traceStartMs={traceStartMs} />
      </HoverCardContent>
    </HoverCard>
  );
}
