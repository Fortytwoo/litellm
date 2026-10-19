"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { translateText } from "@/i18n";

import { useRef } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LensReadiness } from "../hooks/useLensReadiness";
import { LensIntroduction } from "./LensIntroduction";
import { OnboardingSetup } from "./OnboardingSetup";

const PREREQUISITES = [
  {
    get title() {
      return translateUi("ui.8f88a96100565fa6");
    },
    detail: "Access to its configuration",
  },
  {
    get title() {
      return translateUi("ui.076a5332d2983ae0");
    },
    detail: "Included, or use your own ClickHouse",
  },
  {
    get title() {
      return translateUi("ui.a60a8f517c25010d");
    },
    detail: "Use your existing deployment",
  },
  {
    get title() {
      return translateUi("ui.014dcf4cd3fdb951");
    },
    detail: "For investigations, after tracing is connected",
  },
] as const;

export interface LensGettingStartedProps {
  readonly state: LensReadiness;
  readonly onStart: () => void;
  readonly onExit: (to: "traces" | "investigations") => void;
}

export function LensGettingStarted({ state, onStart, onExit }: LensGettingStartedProps) {
  const { t: uiT } = useDashboardLanguage();

  const setupRef = useRef<HTMLElement>(null);
  const exitTo = state.tracesReady ? "traces" : "investigations";
  const start = () => {
    onStart();
    setupRef.current?.scrollIntoView({ block: "start" });
    setupRef.current?.focus({ preventScroll: true });
  };
  return (
    <section aria-label={uiT("ui.3389c93ab3e7a4e4")} className="@container mx-auto w-full max-w-7xl space-y-6">
      <LensIntroduction onStart={start} />
      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,1fr)_280px] @3xl:gap-8">
        <OnboardingSetup
          ref={setupRef}
          tabIndex={-1}
          state={state}
          onFocusCapture={onStart}
          action={
            (state.activityReady || state.hasInvestigations) && (
              <Button variant="outline" size="sm" onClick={() => onExit(exitTo)}>
                {exitTo === "traces" ? uiT("ui.217fc82530e714a3") : uiT("ui.4b2d51e9f414d760")}
              </Button>
            )
          }
        />
        <Prerequisites />
      </div>
    </section>
  );
}

function Prerequisites() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <aside className="rounded-2xl border bg-card p-6" aria-labelledby="lens-prerequisites">
      <h2 id="lens-prerequisites" className="text-base font-semibold">
        {uiT("ui.74e492d5d0df0bab")}
      </h2>
      <ul className="mt-5 space-y-5 text-sm">
        {PREREQUISITES.map((item) => (
          <li key={item.title} className="flex gap-3">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 leading-5 text-muted-foreground">{translateText(item.detail)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-2 border-t pt-5 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>{uiT("ui.a474b36fe5d02ec5")}</p>
      </div>
    </aside>
  );
}
