"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { useMemo, useState, type ReactNode } from "react";

import { StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { conclusions } from "../../model/live";
import { releasedReviews } from "../../model/stage";
import type { Activity, InFlight, Job, Review, Settings } from "../../model/types";
import { ConclusionsPanel } from "./ConclusionsPanel";
import { ModelName } from "./LiveStrip";
import { ActiveWork, NowReading } from "./NowReading";
import { TraceList } from "./TraceList";
import { useStage } from "./useStage";

const STATUS: Record<Job["status"], { label: string; tone: StatusTone }> = {
  queued: {
    get label() {
      return translateUi("ui.661ff40a07e037bb");
    },
    tone: "neutral",
  },
  running: {
    get label() {
      return translateUi("ui.f4ccae29e1bb0c20");
    },
    tone: "neutral",
  },
  completed: {
    get label() {
      return translateUi("ui.11a6767d5674c7e4");
    },
    tone: "neutral",
  },
  failed: {
    get label() {
      return translateUi("ui.031a8f0f659d");
    },
    tone: "error",
  },
  cancelled: {
    get label() {
      return translateUi("ui.d353a99eb4556847");
    },
    tone: "neutral",
  },
};
const PANE_TITLE = "text-xs font-semibold text-foreground";

function Stage({
  reviews,
  reading,
  activities,
  stageName,
  running,
  slots,
  model,
  counter,
  checks,
  children,
}: {
  reviews: readonly Review[];
  reading: readonly InFlight[];
  activities: readonly Activity[];
  stageName: string;
  running: boolean;
  slots: number;
  model: string;
  counter: string;
  checks: Settings["checks"];
  children: (listed: readonly Review[], groups: ReturnType<typeof conclusions>, nowReading: ReactNode) => ReactNode;
}) {
  const { t: uiT } = useDashboardLanguage();

  const legacyReading = running && !activities.length && stageName === "Reading executions";
  const { stage, now, charMs } = useStage(reviews, reading, legacyReading, slots);
  const listed = useMemo(
    () => (legacyReading ? releasedReviews(reviews, stage) : reviews),
    [legacyReading, reviews, stage],
  );
  const groups = useMemo(() => conclusions(listed, checks), [listed, checks]);
  function currentWork() {
    if (!running) return null;
    if (activities.length) return <ActiveWork model={model} activities={activities} />;
    if (legacyReading) {
      return <NowReading model={model} counter={counter} lanes={stage.lanes} now={now} charMs={charMs} />;
    }
    return (
      <p role="status" className="mb-3 px-2 text-xs text-muted-foreground">
        {stageName || uiT("ui.aeed4d26bb5f0c31")}
      </p>
    );
  }
  return <>{children(listed, groups, currentWork())}</>;
}

export function LiveDrawer({
  open,
  onClose,
  name,
  model,
  status,
  stageName,
  reviewed,
  reviews,
  reading,
  activities,
  counter,
  done,
  slots,
  checks,
  scope,
  waiting,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  model: string;
  status: Job["status"];
  stageName: string;
  reviewed: number;
  reviews: readonly Review[];
  reading: readonly InFlight[];
  activities: readonly Activity[];
  counter: string;
  done: string | null;
  slots: number;
  checks: Settings["checks"];
  scope: string;
  waiting?: ReactNode;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [group, setGroup] = useState<string | null>(null);
  const badge = STATUS[status];
  const running = status === "running";
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent className="flex h-full flex-col gap-0 data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:sm:max-w-[min(1200px,94vw)]">
        <SheetHeader className="shrink-0 gap-1.5 border-b px-5">
          <SheetTitle className="pr-10 text-base">{name}</SheetTitle>
          <SheetDescription render={<div />} className="flex flex-wrap items-center gap-2.5 pr-10">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <ModelName model={model} size="md" />
          </SheetDescription>
        </SheetHeader>
        {open && (
          <Stage
            reviews={reviews}
            reading={reading}
            activities={activities}
            stageName={stageName}
            running={running}
            slots={slots}
            model={model}
            counter={counter}
            checks={checks}
          >
            {(listed, groups, nowReading) => (
              <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 md:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] md:grid-rows-1">
                <section
                  aria-label={uiT("ui.998741a58ed2b411")}
                  className="min-h-0 overflow-y-auto border-b px-4 py-4 md:border-r md:border-b-0"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-2">
                    <h2 className={PANE_TITLE}>{uiT("ui.998741a58ed2b411")}</h2>
                    <span className="text-xs leading-relaxed tabular-nums text-muted-foreground">
                      {done ?? uiT("ui.9138f73d49d4af7d", { v0: String(reviewed) })}
                      {done && (
                        <>
                          {" "}
                          <ModelName model={model} />
                        </>
                      )}
                      {reviewed > reviews.length && reviews.length
                        ? uiT("ui.e7d012efafcabb3f", { v0: String(reviews.length) })
                        : ""}
                    </span>
                  </div>
                  {nowReading}
                  {listed.length || reviews.length ? (
                    <TraceList reviews={listed} group={group} />
                  ) : (
                    !running && (
                      <div className="flex flex-col gap-1 px-2 py-6 text-xs text-muted-foreground">
                        <p className="text-sm text-foreground">{uiT("ui.77307604858bfc54")}</p>
                        {waiting}
                      </div>
                    )
                  )}
                </section>
                <section
                  aria-label={uiT("ui.335104478ebc8c7c")}
                  className="flex min-h-0 flex-col gap-3 overflow-y-auto px-5 py-4"
                >
                  <h2 className={PANE_TITLE}>{uiT("ui.335104478ebc8c7c")}</h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">{uiT("ui.db3e0fd05af25dc4")}</p>
                  <ConclusionsPanel
                    groups={groups}
                    total={listed.length}
                    scope={scope}
                    selected={group}
                    onSelect={setGroup}
                  />
                </section>
              </div>
            )}
          </Stage>
        )}
      </SheetContent>
    </Sheet>
  );
}
