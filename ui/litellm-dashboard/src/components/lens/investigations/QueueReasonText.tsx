"use client";
import { translateText } from "@/i18n";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { queueReasonText, workerTaskText, type QueueReason } from "../model/status";
import type { QueueContext } from "./useQueueReason";

export function QueueReasonText({ reason, onConnect }: { reason: QueueReason; onConnect?: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  if (reason.kind !== "no_worker" || !onConnect) return <>{translateText(queueReasonText(reason))}</>;
  return (
    <>
      {uiT("ui.41ef648a34ab27f7")}{" "}
      <button type="button" onClick={onConnect} className="font-medium text-foreground underline underline-offset-2">
        {uiT("ui.f3dfc2f02f831858")}
      </button>
      .
    </>
  );
}

export function WorkerTasks({ reason, queue }: { reason: QueueReason; queue?: QueueContext }) {
  const { t: uiT } = useDashboardLanguage();

  if (reason.kind === "no_worker" || !reason.tasks.length) return null;
  return (
    <ol aria-label={uiT("ui.0afac23f40f12b81")} className="flex flex-col">
      {reason.tasks.map((task) => (
        <li key={task.lensId}>
          <button
            type="button"
            disabled={!queue}
            onClick={() => queue?.onOpenLens(task.lensId)}
            className="w-full truncate rounded px-1.5 py-0.5 text-left tabular-nums hover:bg-muted hover:text-foreground"
          >
            {translateText(workerTaskText(task))}
          </button>
        </li>
      ))}
    </ol>
  );
}
