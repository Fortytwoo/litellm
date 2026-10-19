"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import type { LensReadiness } from "../hooks/useLensReadiness";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingSteps } from "./OnboardingSteps";

export type OnboardingSetupProps = Omit<ComponentProps<"section">, "children"> & {
  state: LensReadiness;
  action?: ReactNode;
  includeTracing?: boolean;
};

export function OnboardingSetup({ state, action, includeTracing = true, className, ...props }: OnboardingSetupProps) {
  const { t: uiT } = useDashboardLanguage();

  const { readOnly, canInvestigate } = useOnboarding();
  const titleId = useId();
  return (
    <section
      data-slot="onboarding-setup"
      aria-labelledby={titleId}
      className={cn("min-w-0 scroll-mt-4 outline-none", className)}
      {...props}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {uiT("ui.9acdd867f3869fdf")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{uiT("ui.610adc40b5c961cd")}</p>
        </div>
        {action}
      </div>
      <OnboardingSteps state={state} includeTracing={includeTracing} />
      {state.error && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-destructive">
          <p>
            {uiT("ui.8ca79895d2bd35de")} {state.error}
          </p>
          <Button variant="outline" size="sm" onClick={state.refresh} disabled={state.checking}>
            {uiT("ui.942087cc2d41e013")}
          </Button>
        </div>
      )}
      {(readOnly || !canInvestigate) && (
        <p className="mt-4 text-sm text-muted-foreground">{uiT("ui.4dbc1fa536533fec")}</p>
      )}
    </section>
  );
}
