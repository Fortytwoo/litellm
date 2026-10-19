"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/useNow";
import { StatusDot, type StatusDotProps } from "@/components/shared/StatusDot";
import { cn } from "@/lib/cva.config";
import { workerConnected } from "../../model/status";
import { agoLabel } from "../../model/format";
import { AnalysisKeySummary } from "./AnalysisKeyDetails";
import type { LensList, Worker } from "../../model/types";

function workerStatus(worker: Worker, now: number): { state: StatusDotProps["state"]; label: string } {
  if (!worker.analysis_key_id)
    return {
      state: "warn",
      get label() {
        return translateUi("ui.bb75eefd55a90ef1");
      },
    };
  if (workerConnected(worker, now))
    return {
      state: "ok",
      get label() {
        return translateUi("ui.22965568d22a14ee");
      },
    };
  return {
    state: "off",
    get label() {
      return translateUi("ui.b9166279714d2ba8", undefined, { v0: String(agoLabel(Date.parse(worker.last_seen), now)) });
    },
  };
}

export type WorkerListProps = ComponentProps<"ul"> & {
  workers: LensList["workers"];
  onEditBilling: (worker: Worker) => void;
  onRevoke: (id: string) => void;
};

export function WorkerList({ workers, onEditBilling, onRevoke, className, ...props }: WorkerListProps) {
  const { t: uiT } = useDashboardLanguage();

  const now = useNow(5000);
  return (
    <ul
      {...props}
      data-slot="worker-list"
      className={cn("divide-y divide-border rounded-lg border border-border bg-card", className)}
    >
      {workers
        .filter((w) => !w.revoked)
        .map((worker) => {
          const status = workerStatus(worker, now);
          return (
            <li key={worker.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
              <StatusDot state={status.state} className="shrink-0" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="font-medium">{worker.name}</h3>
                  <span className="text-xs text-muted-foreground">{status.label}</span>
                </div>
                {worker.analysis_key_id && <AnalysisKeySummary keyId={worker.analysis_key_id} />}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onEditBilling(worker)}>
                  {uiT("ui.a514a684676a781d")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRevoke(worker.id)}
                >
                  {uiT("ui.ab292ddb87d6ffac")}
                </Button>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
