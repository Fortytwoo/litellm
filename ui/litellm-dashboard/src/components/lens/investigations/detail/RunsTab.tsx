"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Inspector } from "@/components/shared/Inspector";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";

import { runTime } from "../../model/format";
import { type Job, type Lens } from "../../model/types";
import { EvidenceView } from "../Evidence";
import { FINDING_PANEL_WIDTH_KEY } from "../../storage";
import { useRunEvidenceRoute } from "../../route";

const PAGE = 50;

interface RunRef {
  readonly id: string;
}

const runKey = (run: RunRef): string => run.id;

function assessmentLabel(assessment: Job["assessments"][number] | undefined): string {
  if (!assessment) return "Not reviewed";
  if (assessment.cannot_assess) return "Insufficient evidence";
  return assessment.issue_checks?.length ? "Issue observed" : "No issue observed";
}

export interface RunsTabProps {
  readonly lens: Lens;
  readonly job?: Job;
}

/** The runs a batch reviewed; each opens its original trace or request in the side panel. */
export function RunsTab({ lens, job }: RunsTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const { runId, selectRun } = useRunEvidenceRoute();
  const [runOffset, setRunOffset] = useState(0);
  const [runFilter, setRunFilter] = useState("all");
  const assessments = new Map(job?.assessments?.map((a) => [a.execution_id, a]));
  const runs = job?.sample?.executions ?? [];
  const visibleRuns = runs.filter((run) => {
    const assessment = assessments.get(run.id);
    if (runFilter === "all") return true;
    if (runFilter === "unknown") return !assessment || assessment.cannot_assess;
    if (runFilter === "clear") return assessment && !assessment.cannot_assess && !assessment.issue_checks?.length;
    return assessment?.issue_checks?.includes(runFilter);
  });
  const page: readonly RunRef[] = visibleRuns.slice(runOffset, runOffset + PAGE);
  const selected: RunRef | null = runId === null ? null : runs.find((run) => run.id === runId) ?? { id: runId };
  return (
    <Inspector.Root
      items={page}
      itemKey={runKey}
      selected={selected}
      onSelectedChange={(run) => selectRun(run?.id ?? null)}
      noun="run"
      storageKey={FINDING_PANEL_WIDTH_KEY}
    >
      <TabsContent value="runs" className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {runs.length} {uiT("ui.773d97d9ea09d9b2")} {job?.sample?.eligible ?? 0} {uiT("ui.c49f17453d911e9f")}
          </p>
          <select
            aria-label={uiT("ui.e52371c63f04fed2")}
            className="h-8 max-w-full rounded-md border bg-background px-2 text-xs sm:max-w-64"
            value={runFilter}
            onChange={(e) => {
              setRunFilter(e.target.value);
              setRunOffset(0);
            }}
          >
            <option value="all">{uiT("ui.1d7f920d0db49837")}</option>
            <option value="clear">{uiT("ui.62072bad5d6ad278")}</option>
            <option value="unknown">{uiT("ui.a6f4cdbc22ccb083")}</option>
            {job?.settings?.context && <option value="expected_behavior">{uiT("ui.2f749c18daf68064")}</option>}
            {job?.settings?.checks.map((check) => (
              <option key={check.id} value={check.id}>
                {check.instruction}
              </option>
            ))}
          </select>
        </div>
        <div className="divide-y border-y">
          {visibleRuns.slice(runOffset, runOffset + PAGE).map((run) => (
            <Inspector.Row
              key={run.id}
              item={run}
              render={
                <button
                  type="button"
                  title={run.trace_id}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_16px] items-center gap-x-4 gap-y-1 py-4 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring data-[state=selected]:bg-trace-row-selected data-[state=selected]:shadow-[inset_2px_0_0_var(--trace-brand)] sm:grid-cols-[minmax(0,1fr)_180px_130px_16px]"
                />
              }
            >
              <span className="col-start-1 row-start-1 min-w-0 truncate text-sm font-medium">{run.name}</span>
              <span className="col-start-1 row-start-2 text-xs text-muted-foreground sm:col-start-2 sm:row-start-1">
                {runTime(run.start_time)}
              </span>
              <span className="col-start-1 row-start-3 text-xs text-muted-foreground sm:col-start-3 sm:row-start-1">
                {translateText(assessmentLabel(assessments.get(run.id)))}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="col-start-2 row-start-1 size-4 text-muted-foreground group-hover:text-foreground sm:col-start-4"
              />
            </Inspector.Row>
          ))}
          {!visibleRuns.length && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {runs.length ? uiT("ui.be8987372517800c") : uiT("ui.fbb25d83774b7f9d")}
            </p>
          )}
        </div>
        {(runOffset > 0 || visibleRuns.length > PAGE) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Button
              size="sm"
              variant="ghost"
              disabled={!runOffset}
              onClick={() => setRunOffset(Math.max(0, runOffset - PAGE))}
            >
              {uiT("ui.f871f70262878484")}
            </Button>
            <span>
              {runOffset + 1}–{Math.min(runOffset + PAGE, visibleRuns.length)} {uiT("ui.28391d3bc64ec15c")}{" "}
              {visibleRuns.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={runOffset + PAGE >= visibleRuns.length}
              onClick={() => setRunOffset(runOffset + PAGE)}
            >
              {uiT("ui.d8ba708056e95b83")}
            </Button>
          </div>
        )}
      </TabsContent>
      <Inspector.Panel label={uiT("ui.7bbc36905270774e")} testId="run-panel">
        {(run: RunRef) => <EvidenceView lensId={lens.id} evidence={{ id: run.id, span: "" }} />}
      </Inspector.Panel>
    </Inspector.Root>
  );
}
