"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import type { ComponentProps, ReactNode } from "react";
import { Logo } from "@/components/molecules/logo/Logo";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_DECISION_THRESHOLD } from "./decision_model/decisionModelQuestion";
import { GuardrailModeRows } from "./GuardrailModeDisplay";
import { GuardrailStreamScopeDetail } from "./StreamScopeFields";
import ToolPermissionRulesEditor, { type ToolPermissionConfig } from "./tool_permission/ToolPermissionRulesEditor";

interface DecisionModelCheckView {
  name: string;
  action?: string;
  threshold?: number;
  instructions?: string;
}

const DecisionModelSection = ({
  decisionModel,
  checks,
}: {
  decisionModel: string;
  checks: DecisionModelCheckView[];
}) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div>
      <p className="font-medium">{uiT("ui.9aa9d2dad8ea2a17")}</p>
      <div className="font-mono">{decisionModel}</div>
      <p className="mt-2 font-medium">{uiT("ui.de07d07209556c79")}</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-border">
        <div className="flex border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold">
          <span className="flex-1">{uiT("ui.9d60841e0a7891df")}</span>
          <span className="w-24 text-right">{uiT("ui.64cff1319d2f")}</span>
          <span className="w-24 text-right">{uiT("ui.0da627ada476")}</span>
        </div>
        {checks.map((check) => (
          <div key={check.name} className="flex items-center border-b border-border px-4 py-2 text-sm last:border-b-0">
            <span className="flex-1">{check.name.replace(/_/g, " ")}</span>
            <span className="w-24 text-right">
              <Badge variant="secondary">{check.action ?? uiT("ui.496aca80e4d8f29f")}</Badge>
            </span>
            <span className="w-24 text-right">{check.threshold ?? DEFAULT_DECISION_THRESHOLD}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GuardrailReadOnlyDetails = ({
  guardrailId,
  guardrailName,
  displayName,
  litellmParams,
  streamScope,
  defaultOn,
  piiEntityCount,
  createdAt,
  updatedAt,
  showToolPermission,
  toolPermissionConfig,
}: {
  guardrailId: string;
  guardrailName: string;
  displayName: string;
  litellmParams: {
    mode?: unknown;
    logging_only_scope?: string | null;
    guardrail?: string;
    decision_model?: string;
    checks?: DecisionModelCheckView[];
    logging_only_continue_on_input_failure?: boolean | null;
  };
  streamScope: unknown;
  defaultOn: boolean | undefined;
  piiEntityCount: number;
  createdAt: string;
  updatedAt: string;
  showToolPermission: boolean;
  toolPermissionConfig: ToolPermissionConfig;
}) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{uiT("ui.4327f43f4ab4293c")}</p>
        <div className="font-mono">{guardrailId}</div>
      </div>
      <div>
        <p className="font-medium">{uiT("ui.25e74db3ec6ad797")}</p>
        <div>{guardrailName || uiT("ui.1f21756600d7754a")}</div>
      </div>
      <div>
        <p className="font-medium">{uiT("ui.472590ae974d")}</p>
        <div>{displayName}</div>
      </div>
      <GuardrailModeRows litellmParams={litellmParams} />
      <GuardrailStreamScopeDetail raw={streamScope} />
      <div>
        <p className="font-medium">{uiT("ui.53a0a7d96788c7f0")}</p>
        <Badge variant={defaultOn ? "secondary" : "outline"}>
          {defaultOn ? uiT("ui.85a39ab345d672ff") : uiT("ui.1ea442a134b2a184")}
        </Badge>
      </div>
      {litellmParams.guardrail === "decision_model" && litellmParams.decision_model && (
        <DecisionModelSection decisionModel={litellmParams.decision_model} checks={litellmParams.checks ?? []} />
      )}
      {piiEntityCount > 0 && (
        <div>
          <p className="font-medium">{uiT("ui.d64dc41f67460ed4")}</p>
          <div className="mt-2">
            <Badge variant="secondary">
              {piiEntityCount} {uiT("ui.681e1cdba9b7b525")}
            </Badge>
          </div>
        </div>
      )}
      <div>
        <p className="font-medium">{uiT("ui.3d44337010bf")}</p>
        <div>{createdAt}</div>
      </div>
      <div>
        <p className="font-medium">{uiT("ui.048c7f2ef9aa")}</p>
        <div>{updatedAt}</div>
      </div>
      {showToolPermission && <ToolPermissionRulesEditor value={toolPermissionConfig} disabled />}
    </div>
  );
};

export function GuardrailOverviewCards({
  logo,
  displayName,
  createdAt,
  updatedAt,
  children,
}: {
  logo: ComponentProps<typeof Logo>["src"];
  displayName: string;
  createdAt: string;
  updatedAt: string;
  children: ReactNode;
}) {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="block p-6">
        <p>{uiT("ui.472590ae974d")}</p>
        <div className="mt-2 flex items-center space-x-2">
          <Logo src={logo} label={displayName} className="w-6 h-6" />
          <h3 className="text-lg font-medium">{displayName}</h3>
        </div>
      </Card>

      {children}

      <Card className="block p-6">
        <p>{uiT("ui.3d44337010bf")}</p>
        <div className="mt-2">
          <h3 className="text-lg font-medium">{createdAt}</h3>
          <p>
            {uiT("ui.d621a996258eefbf")} {updatedAt}
          </p>
        </div>
      </Card>
    </div>
  );
}

export const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="my-6 flex items-center gap-3">
    <span className="shrink-0 text-sm font-medium text-foreground">{children}</span>
    <Separator className="flex-1" />
  </div>
);
