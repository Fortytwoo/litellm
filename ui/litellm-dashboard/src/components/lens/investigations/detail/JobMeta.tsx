"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { analysisElapsed } from "../../model/progress";
import type { Job } from "../../model/types";

export function ScanDuration({ job }: { job: Job }) {
  const { t: uiT } = useDashboardLanguage();

  if (!job.finished_at) return null;
  return (
    <span title={uiT("ui.b39f72287777cd56")}>
      {uiT("ui.c68d5f2735cfaf1b")}
      {analysisElapsed(job.created_at, Date.parse(job.finished_at))}
    </span>
  );
}
