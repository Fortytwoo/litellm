"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { type ReactNode } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/shared/StatusDot";
import { WorkerSettings } from "./worker/WorkerSettings";
import { SignalSettings } from "./signals/SignalSettings";
import { SettingsCard, SettingsSection } from "./SettingsSection";
import type { LensList } from "../model/types";

const TRACING_DOCS = "https://docs.litellm.ai/docs/proxy/lens";

function TracingSection({ enabled, onOpenTraces }: { enabled: boolean; onOpenTraces: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <SettingsSection heading="Tracing" description={uiT("ui.7f18a6ef39cbb2d7")}>
      <SettingsCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Activity aria-hidden="true" className="size-4 text-muted-foreground" />
          <span role="status" className="inline-flex items-center gap-2">
            <StatusDot state={enabled ? "ok" : "off"} />
            {enabled ? uiT("ui.6f1a1263a5df54d8") : uiT("ui.c692abf869ef7e09")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={TRACING_DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {uiT("ui.7af023c43013")} <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
          <Button variant="outline" size="sm" onClick={onOpenTraces}>
            {enabled ? uiT("ui.ce504be3ae48d0c3") : uiT("ui.c3de47fd0236bc0d")}
          </Button>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

export function LensSettings({
  list,
  workerReadyAction,
  onOpenTraces,
}: {
  list: LensList;
  /** Replaces the worker install card's Done button once the new worker connects. */
  workerReadyAction?: ReactNode;
  onOpenTraces: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div aria-label={uiT("ui.74a883a037bc")} role="region" className="flex w-full flex-col divide-y divide-border">
      <TracingSection enabled={list.tracing_enabled} onOpenTraces={onOpenTraces} />
      <SignalSettings />
      <SettingsSection heading="Analysis worker" description={uiT("ui.145049eb53a045dd")}>
        <WorkerSettings workers={list.workers} readyAction={workerReadyAction} />
      </SettingsSection>
    </div>
  );
}
