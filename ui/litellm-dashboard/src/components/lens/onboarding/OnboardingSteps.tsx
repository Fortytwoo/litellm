"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TracingSetupFields, useLensService } from "@/components/lens/onboarding/tracing/TracingSetupCard";
import { cn } from "@/lib/cva.config";
import { useLensAccessToken } from "../data/LensServices";
import type { LensReadiness } from "../hooks/useLensReadiness";
import { initialSetupStep } from "../model/readiness";
import { StepIndicator, type StepState } from "../ui/StepIndicator";
import { useOnboarding } from "./OnboardingContext";

type StepProps = { state: LensReadiness; goTo: (step: number) => void; storageReady: boolean };

function useLocked() {
  const { readOnly, canInvestigate } = useOnboarding();
  return readOnly || !canInvestigate;
}

function StorageStep({ state, goTo, storageReady }: StepProps) {
  const { t: uiT } = useDashboardLanguage();

  const { readOnly, openTrace } = useOnboarding();
  const accessToken = useLensAccessToken();
  if (!storageReady)
    return (
      <>
        <TracingSetupFields
          detail={uiT("ui.c692abf869ef7e09")}
          accessToken={accessToken}
          onOpenTrace={openTrace}
          onCheck={state.refresh}
          checking={state.checking}
          readOnly={readOnly}
        />
        <ActivityContinuation state={state} />
      </>
    );
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-success">
        {uiT("ui.66b7dd23520f2f3e")}
      </p>
      <Button onClick={() => goTo(1)}>
        {uiT("ui.6fc49306b4b4880b")} <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
      <ActivityContinuation state={state} />
    </div>
  );
}

function continuationLabel(state: LensReadiness) {
  if (state.connected) return "Continue to investigation";
  return state.tracesReady ? "Continue to worker" : "Continue with request logs";
}

function ActivityContinuation({ state }: { state: LensReadiness }) {
  const { t: uiT } = useDashboardLanguage();

  const { connect, create } = useOnboarding();
  const locked = useLocked();
  if (!state.activityReady) return null;
  return (
    <div className="mt-4">
      <Button onClick={state.connected ? create : connect} disabled={locked}>
        {translateText(continuationLabel(state))}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
      {state.requestsReady && !state.tracesReady && (
        <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.9a09ba0b8b0d600e")}</p>
      )}
    </div>
  );
}

function AgentStep({ state }: StepProps) {
  const { t: uiT } = useDashboardLanguage();

  const { readOnly, canMintTracingKey, openTrace } = useOnboarding();
  const accessToken = useLensAccessToken();
  return (
    <>
      <div hidden={state.tracesReady}>
        <TracingSetupFields
          detail={null}
          accessToken={accessToken}
          onOpenTrace={(value) => {
            state.refresh();
            openTrace(value);
          }}
          onCheck={state.refresh}
          checking={state.checking}
          readOnly={readOnly}
          canMintTracingKey={canMintTracingKey}
        />
      </div>
      {state.tracesReady && (
        <p role="status" className="text-sm text-success">
          {uiT("ui.d6ce81b03e246cb9")}
        </p>
      )}
      <ActivityContinuation state={state} />
    </>
  );
}

function WorkerStep({ state }: StepProps) {
  const { t: uiT } = useDashboardLanguage();

  const { connect, create } = useOnboarding();
  const locked = useLocked();
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-muted-foreground">
        {state.connected ? uiT("ui.99a15f3e2c920d42") : uiT("ui.c8793c429d7c9de6")}
      </p>
      {!state.activityReady && <p className="text-sm text-muted-foreground">{uiT("ui.3186de2a491bfbdf")}</p>}
      <Button onClick={state.connected ? create : connect} disabled={!state.activityReady || locked}>
        {state.connected ? uiT("ui.eca46c3ea84ec35c") : uiT("ui.f3dfc2f02f831858")}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

function InvestigationStep({ state }: StepProps) {
  const { t: uiT } = useDashboardLanguage();

  const { create } = useOnboarding();
  const locked = useLocked();
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">{uiT("ui.ea8cfdf3b091c8e1")}</p>
      {!state.ready && <p className="text-sm text-muted-foreground">{uiT("ui.9aa42634f12cbf92")}</p>}
      <Button onClick={create} disabled={!state.ready || locked}>
        {uiT("ui.c11364d7598c3309")} <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

interface StepDefinition {
  readonly title: string;
  readonly description: string;
  readonly complete: (state: LensReadiness, storageReady: boolean) => boolean;
  readonly Content: (props: StepProps) => ReactNode;
}

const STEPS: readonly StepDefinition[] = [
  {
    get title() {
      return translateUi("ui.3bfe61916c50a7d2");
    },
    get description() {
      return translateUi("ui.95e6e237ba0ef72b");
    },
    complete: (_state, storageReady) => storageReady,
    Content: StorageStep,
  },
  {
    get title() {
      return translateUi("ui.435bfcfc80cbf1c1");
    },
    get description() {
      return translateUi("ui.4c2e81a8fa77c676");
    },
    complete: (state) => state.tracesReady,
    Content: AgentStep,
  },
  {
    get title() {
      return translateUi("ui.81c1a51a904b487c");
    },
    get description() {
      return translateUi("ui.d513985538f1191b");
    },
    complete: (state) => state.connected,
    Content: WorkerStep,
  },
  {
    get title() {
      return translateUi("ui.fba0d2ed7d2290e3");
    },
    get description() {
      return translateUi("ui.7ac42ea4d2e3bcfe");
    },
    complete: (state) => state.hasInvestigations,
    Content: InvestigationStep,
  },
];

function stepState(complete: boolean, open: boolean): StepState {
  if (complete) return "complete";
  return open ? "current" : "upcoming";
}

export function OnboardingSteps({
  state,
  className,
  includeTracing,
}: {
  state: LensReadiness;
  className?: string;
  includeTracing: boolean;
}) {
  const id = useId();
  const listRef = useRef<HTMLOListElement>(null);
  const offset = includeTracing ? 0 : 2;
  const accessToken = useLensAccessToken();
  const service = useLensService(accessToken);
  const storageReady = Boolean(service.data?.connected && service.data.status.storage_ready && service.data.url);
  const [step, setStep] = useState(() => Math.max(offset, initialSetupStep(state)));
  const visibleStep = !storageReady && step === 1 ? 0 : step;
  const goTo = (index: number) => {
    setStep(index);
    listRef.current?.querySelector<HTMLButtonElement>(`[aria-controls="${id}-${index}"]`)?.focus();
  };
  return (
    <ol
      ref={listRef}
      data-slot="onboarding-steps"
      className={cn("divide-y overflow-hidden rounded-2xl border bg-card", className)}
    >
      {STEPS.slice(offset).map(({ title, description, complete, Content }, index) => {
        const stepIndex = index + offset;
        const open = Math.max(offset, visibleStep) === stepIndex;
        return (
          <li key={title}>
            <h3>
              <button
                type="button"
                id={`${id}-trigger-${stepIndex}`}
                aria-expanded={open}
                aria-controls={`${id}-${stepIndex}`}
                onClick={() => setStep(stepIndex)}
                className="group flex w-full items-start gap-4 p-5 text-left outline-none hover:bg-muted/30 focus-visible:bg-muted/50 sm:p-6"
              >
                <StepIndicator index={index} state={stepState(complete(state, storageReady), open)} />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-medium sm:text-base",
                      !open && "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 font-normal text-muted-foreground">{description}</span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn("mt-1 size-4 shrink-0 text-muted-foreground", open && "rotate-180")}
                />
              </button>
            </h3>
            <div
              id={`${id}-${stepIndex}`}
              role="region"
              aria-labelledby={`${id}-trigger-${stepIndex}`}
              hidden={!open}
              className="px-5 pb-6 sm:pr-6 sm:pb-7 sm:pl-17"
            >
              <Content state={state} goTo={goTo} storageReady={storageReady} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
