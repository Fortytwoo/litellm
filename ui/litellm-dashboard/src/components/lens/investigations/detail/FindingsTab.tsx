"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import type { ReactNode } from "react";
import { ChevronRight, CheckCircle2 } from "lucide-react";

import { Inspector } from "@/components/shared/Inspector";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/cva.config";

import { sortedFindings } from "../../model/findings";
import type { OwnedFinding } from "../../model/inbox";
import { activeJob } from "../../model/status";
import { type Lens, type Finding, type Job } from "../../model/types";
import { ownedFindingKey } from "../FindingDetails";
import { FINDING_PANEL_WIDTH_KEY } from "../../storage";
import { useFindingFilters, useFindingRoute } from "../../route";

const priorityColors = { high: "bg-destructive", medium: "bg-warning", low: "bg-muted-foreground" };
function emptyFindingTitle(active: boolean, scanned: boolean, status?: string) {
  if (status === "failed" || status === "cancelled") return "No findings from this run";
  if (active) return "Your findings will appear here";
  if (status === "completed") return "No matching findings from this run";
  return scanned ? "No matching findings" : "Ready for the first analysis";
}

function emptyFindingDescription(active: boolean, job?: Job) {
  if (active) return "Lens is reviewing the selected activity.";
  if (job?.status === "completed" && (job.coverage.reused ?? 0) > 0) {
    return "Previously reviewed traces were reused. Choose All accumulated findings to see earlier findings.";
  }
  return "Findings reflect the runs analyzed, not a guarantee about all activity.";
}

export interface FindingsTabProps {
  readonly lens: Lens;
  readonly job: Job | undefined;
  readonly findings: readonly Finding[];
  /** The finding panel, rendered inside this tab's Inspector so J/K walk the listed findings. */
  readonly children?: ReactNode;
}

export function FindingsTab({ lens, job, findings, children }: FindingsTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const { kind, setKind, status, setStatus } = useFindingFilters();
  const { findingId, setFindingId } = useFindingRoute();
  const active = activeJob(lens.jobs) !== undefined;
  const openCount = (of: Finding["kind"]) => findings.filter((f) => f.kind === of && f.status === "open").length;
  const visible = sortedFindings(findings.filter((f) => (status === "all" || f.status === status) && f.kind === kind));
  const picked = findings.find((f) => f.id === findingId || f.merged_finding_ids?.includes(findingId ?? ""));
  const selected: OwnedFinding | null = picked ? { lens, finding: picked } : null;
  return (
    <Inspector.Root
      items={visible.map((finding) => ({ lens, finding }))}
      itemKey={ownedFindingKey}
      selected={selected}
      onSelectedChange={(owned) => setFindingId(owned?.finding.id ?? null)}
      noun="finding"
      storageKey={FINDING_PANEL_WIDTH_KEY}
    >
      <TabsContent value="findings" className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1" aria-label={uiT("ui.8fb9455f11342b49")}>
            <Button size="sm" variant={kind === "issue" ? "secondary" : "ghost"} onClick={() => setKind("issue")}>
              {uiT("ui.41b551ee391c0be3")}
              {openCount("issue")})
            </Button>
            <Button size="sm" variant={kind === "pattern" ? "secondary" : "ghost"} onClick={() => setKind("pattern")}>
              {uiT("ui.6bfaee1be8246e3f")}
              {openCount("pattern")})
            </Button>
          </div>
          <select
            aria-label={uiT("ui.8305745743d971ee")}
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="open">{uiT("ui.ed077f3d8125")}</option>
            <option value="resolved">{uiT("ui.5be3c2c8354e1eb9")}</option>
            <option value="dismissed">{uiT("ui.9d74727714dba768")}</option>
            <option value="all">{uiT("ui.8ee57323a6f24cc7")}</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          {kind === "issue" ? uiT("ui.4e11d2bc66cdf297") : uiT("ui.90587623e3beb9ad")}
        </p>
        <div className="divide-y border-y">
          {visible.map((f) => (
            <Inspector.Row
              key={f.id}
              item={{ lens, finding: f }}
              render={
                <button
                  type="button"
                  className="flex w-full gap-3 py-4 text-left hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring data-[state=selected]:bg-trace-row-selected data-[state=selected]:shadow-[inset_2px_0_0_var(--trace-brand)]"
                />
              }
            >
              <span
                data-state={f.priority ?? "medium"}
                className={cn("mt-1 size-2 shrink-0 rounded-full", priorityColors[f.priority ?? "medium"])}
                aria-label={uiT("ui.a72b7b9ba2d95d08", { v0: String(f.priority) })}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{f.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {f.occurrences?.length ?? 0} {uiT("ui.19b6357dad532cc2")}{" "}
                  {f.occurrences?.length === 1 ? uiT("ui.eafe895eb8119e6e") : uiT("ui.b5ac69fc467c01f3")} ·{" "}
                  {(f.investigation_runs?.length ?? 0) > 1 && `${f.investigation_runs.length} investigation runs · `}
                  {f.kind === "issue"
                    ? uiT("ui.a72b7b9ba2d95d08", { v0: String(f.priority) })
                    : uiT("ui.4288ade73ff9d328")}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Inspector.Row>
          ))}
          {visible.length === 0 && (
            <div className="px-6 py-14 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-5 text-muted-foreground" />
              <p className="text-sm font-medium">
                {translateText(emptyFindingTitle(active, !!lens.last_scan_at, job?.status))}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {translateText(emptyFindingDescription(active, job))}
              </p>
            </div>
          )}
        </div>
      </TabsContent>
      {children}
    </Inspector.Root>
  );
}
