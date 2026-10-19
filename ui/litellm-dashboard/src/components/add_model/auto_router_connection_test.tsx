"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";

import {
  testModelGroupConnection,
  ModelGroupConnectionResult,
  testAutoRouterRouting,
  AutoRouterRoutingTestRequest,
} from "../networking";
import { AutoRouterTestTarget } from "./build_auto_router_test_targets";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AutoRouterConnectionTestProps {
  accessToken: string;
  targets: AutoRouterTestTarget[];
  jevRequest?: AutoRouterRoutingTestRequest;
  onTestComplete?: () => void;
}

type TargetResult = { status: "pending" } | ModelGroupConnectionResult;

const cleanErrorMessage = (error: string): string => {
  const mainError = error.split("stack trace:")[0].trim();
  return mainError.replace(/^litellm\.(.*?)Error: /, "");
};

const AutoRouterConnectionTest: React.FC<AutoRouterConnectionTestProps> = ({
  accessToken,
  targets,
  jevRequest,
  onTestComplete,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [results, setResults] = React.useState<TargetResult[]>(() => targets.map(() => ({ status: "pending" })));
  const [jevResult, setJevResult] = React.useState<TargetResult>({ status: "pending" });

  React.useEffect(() => {
    let cancelled = false;
    const probeJev = async () => {
      if (!jevRequest) return;
      const response = await testAutoRouterRouting(accessToken, jevRequest);
      if (cancelled) return;
      if (response.status === "error") {
        setJevResult(response);
        return;
      }
      const decision = response.result.routing_decision;
      setJevResult(
        decision.cause === "jev_classifier"
          ? { status: "success" }
          : {
              status: "error",
              error: translateUi("ui.bdbb8af5f8958627", undefined, { v0: String(decision.cause ?? "unknown") }),
            },
      );
    };
    const run = async () => {
      await Promise.all([
        probeJev(),
        ...targets.map(async (target, index) => {
          const result = target.requestParams
            ? await testModelGroupConnection(accessToken, target.modelGroup, target.mode, target.requestParams)
            : await testModelGroupConnection(accessToken, target.modelGroup, target.mode);
          if (cancelled) return;
          const cleaned: TargetResult =
            result.status === "error" ? { status: "error", error: cleanErrorMessage(result.error) } : result;
          setResults((prev) => prev.map((r, i) => (i === index ? cleaned : r)));
        }),
      ]);
      if (!cancelled && onTestComplete) onTestComplete();
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- probes run once per mount; the parent remounts via `key` to start a fresh test, and re-running on prop identity changes would refire paid requests
  }, []);

  if (targets.length === 0 && !jevRequest) {
    return <p className="text-sm text-muted-foreground">{uiT("ui.32bd189a6b5e3fdd")}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="mb-2 text-sm text-muted-foreground">{uiT("ui.0d8d2fe012315fe8")}</p>
      {jevRequest && (
        <div role="status" aria-label={uiT("ui.b8687c517e98a0dd")} className="rounded-lg border p-3 text-sm">
          <strong>{uiT("ui.2b508ccdc73ed12d")}</strong>
          <p>
            {jevResult.status === "pending" && "Testing OSS classification"}
            {jevResult.status === "success" && "OSS classification succeeded"}
            {jevResult.status === "error" && jevResult.error}
          </p>
        </div>
      )}
      {targets.map((target, index) => {
        const result = results[index] ?? { status: "pending" };
        return (
          <div
            key={`${target.labels.join("-")}-${target.modelGroup}-${target.mode}`}
            data-testid="auto-router-test-row"
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <div className="pt-0.5">
              {result.status === "pending" && (
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" data-testid="test-status-pending" />
              )}
              {result.status === "success" && (
                <CircleCheck className="size-5 text-primary" data-testid="test-status-success" />
              )}
              {result.status === "error" && (
                <CircleX className="size-5 text-destructive" data-testid="test-status-error" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{target.labels.join(", ")}</span>{" "}
              <span className="text-muted-foreground">
                {"->"} {target.modelGroup}
                {target.mode === "embedding" ? uiT("ui.47c8a18148f4e551") : ""}
              </span>
              {result.status === "error" && (
                <p className="mt-1 text-xs text-destructive" data-testid="test-error-message">
                  {result.error}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AutoRouterConnectionTest;

export function AutoRouterConnectionTestDialog({
  open,
  onClose,
  testId,
  ...props
}: AutoRouterConnectionTestProps & { open: boolean; onClose: () => void; testId: number }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.0ec99e1bdc5ce188")}</DialogTitle>
        </DialogHeader>
        {open && <AutoRouterConnectionTest key={testId} {...props} />}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {uiT("ui.7d9eb7acb13e")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
