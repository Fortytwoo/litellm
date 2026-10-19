"use client";
import { translateText } from "@/i18n";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { ScanDuration } from "./JobMeta";
import { useRunHistory } from "./useRunHistory";
import type { Lens, Job } from "../../model/types";
import { useRunRoute } from "../../route";

import { money, when } from "../../model/format";
import { runStatus } from "../../model/status";

export interface RunPickerProps {
  readonly lens: Lens;
  readonly job: Job | undefined;
}

export function RunPicker({ lens, job }: RunPickerProps) {
  const { t: uiT } = useDashboardLanguage();

  const { batchId, selectRun } = useRunRoute();
  const history = useRunHistory(lens, 0);
  if (!job) return null;
  const options = history.data ?? lens.jobs;
  const reused = job.coverage?.reused ?? 0;
  const newlyReviewed = Math.max(0, (job.coverage?.screened ?? 0) - reused);
  const aggregate = batchId === "latest" || batchId === "all";
  const outsideHistory = !aggregate && !options.some((j) => j.id === batchId);
  return (
    <div className="flex min-w-0 items-center gap-1 pb-1">
      <select
        aria-label={uiT("ui.c53c938f0a20d238")}
        className="h-8 w-44 max-w-full truncate rounded-md border-0 bg-transparent px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        value={batchId}
        onChange={(e) => selectRun(e.target.value)}
      >
        <option value="latest">{uiT("ui.36adcd07b9bda0b9")}</option>
        {outsideHistory && (
          <option value={batchId}>
            {when(job.created_at)} · {translateText(runStatus(job))}
          </option>
        )}
        {options.map((j) => (
          <option key={j.id} value={j.id}>
            {when(j.created_at)} · {translateText(runStatus(j))}
          </option>
        ))}
        <option value="all">{uiT("ui.f48acfef3ef0e661")}</option>
      </select>
      {batchId !== "all" && (
        <Popover key={job.id}>
          <PopoverTrigger
            aria-label={uiT("ui.7bbc36905270774e")}
            render={<Button variant="ghost" size="icon" className="size-7 text-muted-foreground" />}
          >
            <Info className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="gap-3">
            <PopoverTitle>{uiT("ui.7bbc36905270774e")}</PopoverTitle>
            <p className="text-xs text-muted-foreground">
              {newlyReviewed} {uiT("ui.666e403b582ac23b")} {reused} {uiT("ui.08b2beaa154431c6")}
              <ScanDuration job={job} />
            </p>
            <p className="text-xs text-muted-foreground">
              {job.coverage?.partial ?? 0} {uiT("ui.789cda6337e0a124")} {job.coverage?.unassessable ?? 0}{" "}
              {uiT("ui.e5e07a5af6fc153e")} {job.coverage?.inconclusive ?? 0} {uiT("ui.9e68cbd21510abbf")}
            </p>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-muted-foreground">{uiT("ui.f6080fcbab17cbeb")}</dt>
                <dd className="mt-1">
                  {when(job.start)} {uiT("ui.663ea1bfffe5")} {when(job.end)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{uiT("ui.cb7279a3181aa742")}</dt>
                <dd>{money(job.cost ?? 0)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{uiT("ui.920e413c7d41")}</dt>
                <dd>{translateText(runStatus(job))}</dd>
              </div>
            </dl>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
