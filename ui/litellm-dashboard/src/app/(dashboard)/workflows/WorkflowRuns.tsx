"use client";
import { managedFetch } from "@/lib/http/managedSession";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, ChevronDown, RefreshCw } from "lucide-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { getGlobalLitellmHeaderName, proxyBaseUrl } from "@/components/networking";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { cn } from "@/lib/cva.config";

interface WorkflowRunsProps {
  accessToken: string | null;
}

type RunStatus = "pending" | "running" | "paused" | "completed" | "failed";

interface RunMetadata {
  title?: string;
  state?: string;
  pr_url?: string;
  worktree_path?: string;
  plan_text?: string;
  grill_session_id?: string;
  session_id?: string;
  [key: string]: unknown;
}

interface WorkflowRun {
  run_id: string;
  status: RunStatus;
  workflow_type: string;
  created_at: string;
  metadata?: RunMetadata | null;
}

interface WorkflowRunEvent {
  event_id: string;
  event_type: string;
  step_name: string;
  sequence_number: number;
  created_at: string;
  data?: Record<string, unknown> | null;
}

interface WorkflowRunMessage {
  message_id: string;
  role: string;
  content: string;
  sequence_number: number;
  created_at: string;
}

// ── design tokens ─────────────────────────────────────────────────────────────

const STATUS_DOT: Record<RunStatus, string> = {
  pending: "bg-border",
  running: "bg-info",
  paused: "bg-warning",
  completed: "bg-success",
  failed: "bg-destructive",
};

const RUN_STATUS_OPTIONS: RunStatus[] = ["pending", "running", "paused", "completed", "failed"];
const STATUS_LABELS: Record<RunStatus, string> = {
  get pending() {
    return translateUi("ui.331551b0de41");
  },
  get running() {
    return translateUi("ui.f4ccae29e1bb0c20");
  },
  get paused() {
    return translateUi("ui.e159b06187d369a0");
  },
  get completed() {
    return translateUi("ui.22a970d2e5b1cc23");
  },
  get failed() {
    return translateUi("ui.031a8f0f659d");
  },
};

const EVENT_COLOR: Record<string, { bar: string; text: string }> = {
  "step.started": { bar: "border-success/30 bg-success/10", text: "text-success" },
  "step.failed": { bar: "border-destructive/30 bg-destructive/10", text: "text-destructive" },
  "hook.waiting": { bar: "border-warning/30 bg-warning/10", text: "text-warning" },
  "hook.received": { bar: "border-info/30 bg-info/10", text: "text-info" },
};

function eventStyle(type: string) {
  return EVENT_COLOR[type] ?? { bar: "border-border bg-muted", text: "text-muted-foreground" };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return iso;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDuration(ms: number): string {
  if (ms < 0) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function runTitle(run: WorkflowRun): string {
  const t = run.metadata?.title;
  if (t) return String(t);
  return run.workflow_type ?? run.run_id.slice(0, 8);
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

// ── status dot ────────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: RunStatus; className?: string }> = ({ status, className }) => (
  <span className={cn("inline-block flex-none rounded-full", STATUS_DOT[status] ?? "bg-border", className)} />
);

// ── truncated text value ──────────────────────────────────────────────────────

const TRUNCATE_AT = 120;

const TruncatedValue: React.FC<{ value: string }> = ({ value }) => {
  const { t: uiT } = useDashboardLanguage();

  const [expanded, setExpanded] = useState(false);
  if (value.length <= TRUNCATE_AT) {
    return <span className="break-all text-foreground">{value}</span>;
  }
  return (
    <span className="break-all text-foreground">
      {expanded ? value : value.slice(0, TRUNCATE_AT) + "…"}
      <Button variant="link" size="xs" className="h-auto px-1 py-0 text-[11px]" onClick={() => setExpanded((e) => !e)}>
        {expanded ? uiT("ui.4fdd3b6201a22c78") : uiT("ui.187897ce0afc")}
      </Button>
    </span>
  );
};

// ── metadata card ─────────────────────────────────────────────────────────────

const MetadataCard: React.FC<{ run: WorkflowRun }> = ({ run }) => {
  const { t: uiT } = useDashboardLanguage();

  const meta = run.metadata ?? {};

  const primaryFields: { key: string; label: string }[] = [
    { key: "state", label: uiT("ui.4ba69735ca53765e") },
    { key: "worktree_path", label: uiT("ui.d63516bc98983230") },
    { key: "grill_session_id", label: uiT("ui.599a6c038fbd1a86") },
    { key: "session_id", label: uiT("ui.3f3af1ecebbd1410") },
  ];

  const primaryKeys = new Set(["title", ...primaryFields.map((f) => f.key)]);
  const extraEntries = Object.entries(meta).filter(
    ([k, v]) => !primaryKeys.has(k) && v !== null && v !== undefined && v !== "",
  );

  return (
    <div className="mb-4 overflow-hidden rounded-lg border">
      {/* title bar */}
      <div className="flex items-center gap-2.5 border-b px-5 py-3.5">
        <StatusDot status={run.status} className="size-2.5" />
        <span className="flex-1 text-sm font-semibold text-foreground">{runTitle(run)}</span>
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {shortId(run.run_id)}
        </span>
        <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{run.workflow_type}</span>
      </div>

      {/* key fields grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-2 px-5 py-3 font-mono text-xs">
        <FieldPair label={uiT("ui.073c1634c496cdb6")}>
          <span className="capitalize text-foreground">{run.status}</span>
        </FieldPair>
        <FieldPair label={uiT("ui.406effb1e9c59672")}>
          <span className="text-foreground">{timeAgo(run.created_at)}</span>
        </FieldPair>

        {meta.pr_url && (
          <FieldPair label={uiT("ui.0510eddd78110203")}>
            <a
              href={String(meta.pr_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {String(meta.pr_url)}
            </a>
          </FieldPair>
        )}

        {primaryFields.map(({ key, label }) => {
          const v = meta[key];
          if (v === null || v === undefined || v === "") return null;
          const str = typeof v === "object" ? JSON.stringify(v) : String(v);
          return (
            <FieldPair key={key} label={label}>
              <TruncatedValue value={str} />
            </FieldPair>
          );
        })}

        {extraEntries.map(([k, v]) => {
          const str = typeof v === "object" ? JSON.stringify(v) : String(v);
          return (
            <FieldPair key={k} label={k}>
              <TruncatedValue value={str} />
            </FieldPair>
          );
        })}
      </div>
    </div>
  );
};

const FieldPair: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-px">
    <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
    <span className="text-xs">{children}</span>
  </div>
);

// ── gantt timeline ────────────────────────────────────────────────────────────

const GanttTimeline: React.FC<{
  run: WorkflowRun;
  events: WorkflowRunEvent[];
}> = ({ run, events }) => {
  const { t: uiT } = useDashboardLanguage();

  if (events.length === 0) {
    return <div className="py-4 font-mono text-xs text-muted-foreground">{uiT("ui.089f2c1bd95a28b1")}</div>;
  }

  const runStart = new Date(run.created_at).getTime();
  const eventTimes = events.map((e) => new Date(e.created_at).getTime());
  const lastTime = Math.max(...eventTimes);
  const totalSpan = Math.max(lastTime - runStart, 1);
  const totalDur = fmtDuration(lastTime - runStart);

  return (
    <TooltipProvider delay={300}>
      <div className="font-mono text-xs">
        {/* ruler */}
        <div className="mb-0.5 grid grid-cols-[160px_minmax(0,1fr)] gap-x-3">
          <div />
          <div className="relative h-4">
            <span className="absolute left-0 text-[10px] text-muted-foreground">0</span>
            <span className="absolute left-full -translate-x-full text-[10px] text-muted-foreground">{totalDur}</span>
          </div>
        </div>

        {/* outer run bar */}
        <div className="mb-1 grid grid-cols-[160px_minmax(0,1fr)] gap-x-3">
          <div className="truncate pt-0.5 text-foreground">{runTitle(run)}</div>
          <div className="flex h-6 items-center rounded border bg-muted pl-2">
            <span className="text-[11px] text-muted-foreground">{totalDur}</span>
          </div>
        </div>

        {/* event rows */}
        <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-x-3 gap-y-[3px]">
          {events.map((ev) => {
            const evTime = new Date(ev.created_at).getTime();
            const leftPct = ((evTime - runStart) / totalSpan) * 100;

            const nextIdx = events.findIndex((e) => e.sequence_number > ev.sequence_number);
            const nextTime =
              nextIdx >= 0
                ? new Date(events[nextIdx].created_at).getTime()
                : lastTime + Math.max(totalSpan * 0.12, 500);
            const widthPct = Math.max(8, ((nextTime - evTime) / totalSpan) * 100);
            const style = eventStyle(ev.event_type);
            const dur = fmtDuration(nextTime - evTime);

            return (
              <React.Fragment key={ev.event_id}>
                <div className={cn("truncate pt-0.5 pl-3", style.text)}>{ev.step_name || ev.event_type}</div>
                <div className="relative h-6">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <div
                          className={cn(
                            "absolute h-full cursor-default gap-1.5 overflow-hidden rounded border pl-2",
                            "flex items-center",
                            style.bar,
                          )}
                          style={{
                            left: `${Math.min(leftPct, 92)}%`,
                            width: `${Math.min(widthPct, 100 - Math.min(leftPct, 92))}%`,
                          }}
                        />
                      }
                    >
                      <span className={cn("whitespace-nowrap text-[11px]", style.text)}>{ev.event_type}</span>
                      {dur && <span className="whitespace-nowrap text-[11px] text-muted-foreground">{dur}</span>}
                    </TooltipTrigger>
                    <TooltipContent className="font-mono text-[11px] leading-relaxed">
                      <div className="flex flex-col">
                        <div>
                          <span className="opacity-70">{uiT("ui.f7cf39ee72f47395")} </span>
                          <span>{ev.event_type}</span>
                        </div>
                        <div>
                          <span className="opacity-70">{uiT("ui.3596fbeb37fe4384")} </span>
                          {ev.step_name}
                        </div>
                        <div>
                          <span className="opacity-70">{uiT("ui.532ee976ed0a87d7")} </span>
                          {ev.sequence_number}
                        </div>
                        <div>
                          <span className="opacity-70">{uiT("ui.9abf0068949e9d52")} </span>
                          {timeAgo(ev.created_at)}
                        </div>
                        {ev.data && Object.keys(ev.data).length > 0 && (
                          <div>
                            <span className="opacity-70">{uiT("ui.ff72caa36dca2baa")} </span>
                            {JSON.stringify(ev.data)}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

// ── message row ───────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  user: "text-info",
  assistant: "text-success",
  system: "text-violet-600",
  tool_result: "text-warning",
};

const MessageRow: React.FC<{ msg: WorkflowRunMessage }> = ({ msg }) => (
  <div className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-x-4 border-b py-2.5 font-mono text-xs">
    <span className={cn("pt-px", ROLE_COLOR[msg.role] ?? "text-muted-foreground")}>[{msg.role}]</span>
    <div>
      <span className="block whitespace-pre-wrap break-words leading-relaxed text-foreground">{msg.content}</span>
      <span className="mt-0.5 block text-[11px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
    </div>
  </div>
);

// ── collapsible section ───────────────────────────────────────────────────────

const DetailSection: React.FC<{
  title: string;
  meta: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, meta, defaultOpen = false, children }) => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-medium text-foreground hover:bg-muted/50">
      <ChevronDown className="size-3.5 -rotate-90 text-muted-foreground transition-transform group-data-[panel-open]:rotate-0" />
      <span>
        {title}
        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{meta}</span>
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 pb-3">{children}</CollapsibleContent>
  </Collapsible>
);

// ── main component ────────────────────────────────────────────────────────────

const WorkflowRunsContent: React.FC<WorkflowRunsProps> = ({ accessToken }) => {
  const { t: uiT } = useDashboardLanguage();

  const [runsError, setRunsError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [events, setEvents] = useState<WorkflowRunEvent[]>([]);
  const [messages, setMessages] = useState<WorkflowRunMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchRuns = useCallback(async () => {
    if (!accessToken) return;
    setLoadingRuns(true);
    setRunsError(false);
    try {
      const res = await managedFetch(`${proxyBaseUrl ?? ""}/v1/workflows/runs?limit=100`, {
        headers: { [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch (err) {
      setRunsError(true);
    } finally {
      setLoadingRuns(false);
    }
  }, [accessToken]);

  const fetchRunDetail = useCallback(
    async (run: WorkflowRun) => {
      if (!accessToken) return;
      setSelectedRun(run);
      setDrawerOpen(true);
      setLoadingDetail(true);
      setDetailError(false);
      setEvents([]);
      setMessages([]);
      try {
        const base = proxyBaseUrl ?? "";
        const [evRes, msgRes] = await Promise.all([
          fetch(`${base}/v1/workflows/runs/${run.run_id}/events`, {
            headers: { [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}` },
          }),
          fetch(`${base}/v1/workflows/runs/${run.run_id}/messages`, {
            headers: { [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}` },
          }),
        ]);
        if (!evRes.ok || !msgRes.ok) throw new Error("Workflow detail read failed");
        const evData = await evRes.json();
        const msgData = await msgRes.json();
        setEvents(
          [...(evData.events ?? [])].sort(
            (a: WorkflowRunEvent, b: WorkflowRunEvent) => a.sequence_number - b.sequence_number,
          ),
        );
        setMessages(
          [...(msgData.messages ?? [])].sort(
            (a: WorkflowRunMessage, b: WorkflowRunMessage) => a.sequence_number - b.sequence_number,
          ),
        );
      } catch (err) {
        setDetailError(true);
      } finally {
        setLoadingDetail(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const columns = useMemo<ColumnDef<WorkflowRun, unknown>[]>(
    () => [
      {
        id: "run",
        accessorFn: (row) => `${runTitle(row)} ${row.run_id}`,
        header: uiT("ui.00d60e31a4e6b834"),
        meta: { title: uiT("ui.00d60e31a4e6b834"), skeleton: "twoLine" },
        cell: ({ row }) => {
          const run = row.original;
          return (
            <div className="flex items-center gap-2">
              <StatusDot status={run.status} className="size-[7px]" />
              <div>
                <div className="text-[13px] font-medium leading-snug text-foreground">{runTitle(run)}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{shortId(run.run_id)}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "workflow_type",
        header: uiT("ui.baaddf70fb5d"),
        meta: { title: uiT("ui.baaddf70fb5d") },
        filterFn: "includesString",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.workflow_type}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: uiT("ui.920e413c7d41"),
        meta: { title: uiT("ui.920e413c7d41") },
        filterFn: "equalsString",
        cell: ({ row }) => {
          const run = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <StatusDot status={run.status} className="size-[7px]" />
              <span className="text-xs capitalize text-muted-foreground">{run.metadata?.state ?? run.status}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: uiT("ui.d70b9e24bca2"),
        meta: { title: uiT("ui.d70b9e24bca2") },
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{timeAgo(row.original.created_at)}</span>,
      },
    ],
    [uiT],
  );

  return (
    <div className="w-full px-8 py-6">
      {/* page header */}
      <div className="mb-5">
        <div className="text-lg font-semibold text-foreground">{uiT("ui.a444842d2c72")}</div>
        <div className="mt-0.5 text-[13px] text-muted-foreground">{uiT("ui.8942d58bb9db5c35")}</div>
      </div>

      {runsError && (
        <div role="alert" className="mb-4 rounded border border-destructive p-4">
          <p>{uiT("nativeLoad.runs")}</p>
          <Button variant="outline" onClick={fetchRuns}>
            {uiT("ui.942087cc2d41e013")}
          </Button>
        </div>
      )}
      <DataTable
        data={runs}
        columns={columns}
        getRowId={(run) => run.run_id}
        isLoading={loadingRuns}
        loadingMessage={uiT("ui.c436c1b01163772b")}
        noDataMessage={
          runsError ? (
            <span>{uiT("nativeLoad.runsUnavailable")}</span>
          ) : (
            <div className="py-6 text-center text-[13px] text-muted-foreground">{uiT("ui.878dcecd1b25367f")}</div>
          )
        }
        paginationMode="client"
        pageSizeOptions={[50, 100]}
        filterMode="client"
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        onRowClick={fetchRunDetail}
        size="compact"
        toolbar={(table) => (
          <>
            <DataTableToolbar
              table={table}
              searchValue={globalFilter}
              onSearchChange={setGlobalFilter}
              searchPlaceholder={uiT("ui.ab1831881896aa2e")}
              onRefresh={fetchRuns}
              isRefreshing={loadingRuns}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            <DataTableFilterDrawer
              table={table}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              title={uiT("ui.546ebb8eb993")}
              description={uiT("ui.8a6d4248bd14e128")}
            >
              {({ get, set }) => (
                <>
                  <DataTableFilterField label={uiT("ui.920e413c7d41")}>
                    <Select
                      items={STATUS_LABELS}
                      value={(get("status") as string) || null}
                      onValueChange={(value: string | null) => set("status", value ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={uiT("ui.8ee57323a6f24cc7")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>{uiT("ui.8ee57323a6f24cc7")}</SelectItem>
                        {RUN_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </DataTableFilterField>
                  <DataTableFilterField label={uiT("ui.baaddf70fb5d")}>
                    <Input
                      value={(get("workflow_type") as string) ?? ""}
                      onChange={(event) => set("workflow_type", event.target.value)}
                      placeholder={uiT("ui.a6223b775db79803")}
                    />
                  </DataTableFilterField>
                </>
              )}
            </DataTableFilterDrawer>
          </>
        )}
      />

      {/* detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          showCloseButton={false}
          className="overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[680px]"
        >
          <SheetTitle className="sr-only">{uiT("ui.926ab37ef975270d")}</SheetTitle>
          <SheetDescription className="sr-only">{uiT("ui.c37c8add140d2c34")}</SheetDescription>
          {selectedRun && loadingDetail && (
            <div className="flex justify-center py-20">
              <UiLoadingSpinner className="size-8 text-muted-foreground" />
            </div>
          )}
          {selectedRun && !loadingDetail && detailError && (
            <div role="alert" className="p-7">
              <p>{uiT("nativeLoad.details")}</p>
              <Button variant="outline" onClick={() => fetchRunDetail(selectedRun)}>
                {uiT("ui.942087cc2d41e013")}
              </Button>
            </div>
          )}
          {selectedRun && !loadingDetail && !detailError && (
            <div className="px-7 py-6">
              {/* drawer close + refresh */}
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 text-xs font-normal text-muted-foreground hover:bg-transparent"
                  onClick={() => setDrawerOpen(false)}
                >
                  <ArrowLeft />
                  {uiT("ui.310ff200149b44a3")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchRunDetail(selectedRun)}>
                  <RefreshCw />
                  {uiT("ui.0e9161011702")}
                </Button>
              </div>

              {/* metadata card — top */}
              <MetadataCard run={selectedRun} />

              {/* collapsible sections */}
              <div className="divide-y overflow-hidden rounded-lg border">
                <DetailSection
                  title={uiT("ui.9dcff98e275f0cb9")}
                  meta={
                    <>
                      {events.length} {events.length === 1 ? uiT("ui.b8e1f80bd70ae078") : uiT("ui.862417b9e7c3720b")}
                    </>
                  }
                  defaultOpen
                >
                  <GanttTimeline run={selectedRun} events={events} />
                </DetailSection>
                <DetailSection title={uiT("ui.04d7b4833927")} meta={messages.length}>
                  {messages.length === 0 ? (
                    <div className="py-3 font-mono text-xs text-muted-foreground">{uiT("ui.a06faf2668c28d0b")}</div>
                  ) : (
                    <div>
                      {messages.map((msg) => (
                        <MessageRow key={msg.message_id} msg={msg} />
                      ))}
                    </div>
                  )}
                </DetailSection>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const WorkflowRuns: React.FC<WorkflowRunsProps> = ({ accessToken }) => (
  <WorkflowRunsContent key={accessToken} accessToken={accessToken} />
);

export default WorkflowRuns;
