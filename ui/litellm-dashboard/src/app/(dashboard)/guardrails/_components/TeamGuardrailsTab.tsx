"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import React, { useState, useEffect, useCallback } from "react";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import {
  SearchIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
  CheckIcon,
  ExternalLinkIcon,
  KeyIcon,
  ServerIcon,
  AlertCircleIcon,
  InfoIcon,
  CircleHelp,
} from "lucide-react";
import { z } from "zod";
import {
  listGuardrailSubmissions,
  approveGuardrailSubmission,
  rejectGuardrailSubmission,
  updateGuardrailCall,
  type GuardrailSubmissionItem,
} from "@/components/networking";
import { toast } from "@/lib/toast";
import TeamDropdown from "@/components/common_components/team_dropdown";
import { useRegisterGuardrail } from "@/app/(dashboard)/hooks/guardrails/useRegisterGuardrail";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { isProxyAdminRole } from "@/utils/roles";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isValidUrl } from "@/lib/forms/urlValidation";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const GUARDRAIL_MODES = [
  {
    value: "pre_call",
    get label() {
      return translateUi("ui.6dd5bb2ee055cb39");
    },
  },
  {
    value: "post_call",
    get label() {
      return translateUi("ui.96a4ac9b04ba6d5b");
    },
  },
  {
    value: "during_call",
    get label() {
      return translateUi("ui.6c3f3a97572500bd");
    },
  },
] as const;

const submitGuardrailSchema = z.object({
  team_id: z
    .string()
    .nullable()
    .pipe(z.string({ error: () => translateUi("ui.f7f8b89b06a8") }).min(1, "Select a team")),
  guardrail_name: z.string().min(1, "Enter a guardrail name"),
  mode: z.string().min(1, "Select a mode"),
  api_base: z.string().min(1, "Enter the API base URL").refine(isValidUrl, "Must be a valid URL"),
  extra_litellm_params: z.string().superRefine((value, ctx) => {
    if (!value) return;
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        ctx.addIssue({
          code: "custom",
          get message() {
            return translateUi("ui.3c8b003bc4a93b0a");
          },
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        get message() {
          return translateUi("ui.f60c824125e6408e");
        },
      });
    }
  }),
  guardrail_info: z.string().superRefine((value, ctx) => {
    if (!value) return;
    try {
      JSON.parse(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        get message() {
          return translateUi("ui.f60c824125e6408e");
        },
      });
    }
  }),
});

type SubmitGuardrailValues = z.output<typeof submitGuardrailSchema>;

const EMPTY_SUBMIT_VALUES: SubmitGuardrailValues = {
  team_id: "",
  guardrail_name: "",
  mode: "pre_call",
  api_base: "",
  extra_litellm_params: "",
  guardrail_info: "",
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    <LocalizedText>{label}</LocalizedText>
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>
        <LocalizedText>{hint}</LocalizedText>
      </TooltipContent>
    </Tooltip>
  </>
);

type GuardrailStatus = "active" | "pending" | "rejected";

type TeamGuardrail = {
  id: string;
  team: string;
  name: string;
  endpoint: string;
  status: GuardrailStatus;
  model: string;
  forwardKey: boolean;
  description: string;
  method: "POST" | "GET";
  customHeaders: {
    key: string;
    value: string;
  }[];
  extraHeaders: string[];
  submittedAt: string;
  submittedBy: string;
  mode?: string;
  unreachable_fallback?: string;
  additionalProviderParams?: Record<string, unknown>;
  guardrailType?: string;
};

function mapStatus(apiStatus: string): GuardrailStatus {
  if (apiStatus === "pending_review") return "pending";
  if (apiStatus === "active" || apiStatus === "rejected") return apiStatus;
  return "active";
}

function formatSubmissionDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

function submissionToTeamGuardrail(item: GuardrailSubmissionItem): TeamGuardrail {
  const params = item.litellm_params ?? {};
  const info = item.guardrail_info ?? {};
  const headers = params.headers;
  const customHeaders: { key: string; value: string }[] = Array.isArray(headers)
    ? headers.map((h: { key?: string; name?: string; value: string }) => ({
        key: (h.key ?? h.name ?? "").toString(),
        value: String(h.value ?? ""),
      }))
    : typeof headers === "object" && headers !== null
      ? Object.entries(headers).map(([key, value]) => ({
          key,
          value: String(value ?? ""),
        }))
      : [];
  const endpoint = (params.api_base as string) ?? (params.url as string) ?? "";
  const model = (info.model as string) ?? (params.model as string) ?? "—";
  const forwardKey = (params.forward_api_key as boolean) ?? true;
  const extraHeaders = Array.isArray(params.extra_headers)
    ? (params.extra_headers as string[]).filter((h): h is string => typeof h === "string")
    : [];
  return {
    id: item.guardrail_id,
    team: item.team_id ?? "—",
    name: item.guardrail_name,
    endpoint,
    status: mapStatus(item.status),
    model,
    forwardKey,
    description: (info.description as string) ?? "",
    method: (params.method as "POST" | "GET") ?? "POST",
    customHeaders,
    extraHeaders,
    submittedAt: formatSubmissionDate(item.submitted_at),
    submittedBy: item.submitted_by_email ?? item.submitted_by_user_id ?? "—",
    mode: params.mode as string | undefined,
    unreachable_fallback: params.unreachable_fallback as string | undefined,
    additionalProviderParams: params.additional_provider_specific_params as Record<string, unknown> | undefined,
    guardrailType: params.guardrail as string | undefined,
  };
}

const STATUS_CONFIG: Record<GuardrailStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: {
    get label() {
      return translateUi("ui.92340695899b");
    },
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  pending: {
    get label() {
      return translateUi("ui.da77d8f5b71aa068");
    },
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  rejected: {
    get label() {
      return translateUi("ui.aea4a04a80426ed8");
    },
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

const TEAM_COLORS: Record<string, string> = {
  "ML Platform": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "Data Science": "bg-info/15 text-info",
  Security: "bg-destructive/15 text-destructive",
  "Customer Success": "bg-warning/15 text-warning",
  Legal: "bg-muted text-foreground",
  Finance: "bg-success/15 text-success",
};

function buildEquivalentConfigYaml(g: TeamGuardrail): string {
  const lines: string[] = [
    "litellm_settings:",
    "  guardrails:",
    `    - guardrail_name: "${g.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    "      litellm_params:",
    `        guardrail: ${g.guardrailType ?? "generic_guardrail_api"}`,
    `        mode: ${g.mode ?? "pre_call"}  # or post_call, during_call`,
    `        api_base: ${g.endpoint || "https://your-guardrail-api.com"}`,
    "        api_key: os.environ/YOUR_GUARDRAIL_API_KEY  # optional",
    `        unreachable_fallback: ${g.unreachable_fallback ?? "fail_closed"}  # default: fail_closed. Set to fail_open to proceed if the guardrail endpoint is unreachable.`,
    `        forward_api_key: ${g.forwardKey}`,
  ];
  if (g.model && g.model !== "—") {
    lines.push(`        model: "${g.model}"  # LLM model name sent to the guardrail for context`);
  }
  if (g.customHeaders.length > 0) {
    lines.push("        headers:  # static headers (sent with every request)");
    for (const h of g.customHeaders) {
      lines.push(`          ${h.key}: "${String(h.value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    }
  }
  if (g.extraHeaders.length > 0) {
    lines.push("        extra_headers:  # forward these client request headers to the guardrail");
    for (const name of g.extraHeaders) {
      lines.push(`          - ${name}`);
    }
  }
  if (g.additionalProviderParams && Object.keys(g.additionalProviderParams).length > 0) {
    lines.push("        additional_provider_specific_params:");
    for (const [k, v] of Object.entries(g.additionalProviderParams)) {
      const val = typeof v === "string" ? `"${v}"` : String(v);
      lines.push(`          ${k}: ${val}`);
    }
  }
  return lines.join("\n");
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
        enabled ? "bg-info" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

type GuardrailCardProps = {
  guardrail: TeamGuardrail;
  isSelected: boolean;
  isHeadersExpanded: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onToggleForwardKey: () => void;
  onToggleHeaders: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function GuardrailCard({
  guardrail: g,
  isSelected,
  isHeadersExpanded,
  isAdmin,
  onSelect,
  onToggleForwardKey,
  onToggleHeaders,
  onApprove,
  onReject,
}: GuardrailCardProps) {
  const { t: uiT } = useDashboardLanguage();

  const status = STATUS_CONFIG[g.status];
  const teamColor = TEAM_COLORS[g.team] ?? "bg-muted text-foreground";
  return (
    <div
      className={`bg-card border rounded-lg p-4 transition-all ${
        isSelected ? "border-info ring-1 ring-info/30" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${teamColor}`}>
              {uiT("ui.47355f46161815a6")} {g.team}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{g.name}</h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{g.description}</p>
          <div className="flex items-center gap-1.5 mb-2">
            <ServerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <code className="text-xs text-muted-foreground font-mono truncate">{g.endpoint}</code>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              {uiT("ui.11a931060dad5d13")} <span className="font-medium text-foreground">{g.model}</span>
            </span>
            <span>
              {uiT("ui.f1bd0eb561db425f")} <span className="font-medium text-foreground">{g.submittedAt}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{uiT("ui.a2eb46ced0c521ff")}</span>
            <Toggle enabled={g.forwardKey} onToggle={onToggleForwardKey} disabled={!isAdmin} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={onSelect}
              className="text-xs border border-border text-muted-foreground hover:bg-muted px-3 py-1.5 rounded-md transition-colors font-medium"
            >
              {isSelected ? uiT("ui.7d9eb7acb13e") : uiT("ui.aff0766a5290e117")}
            </button>
            {isAdmin && g.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={onApprove}
                  className="text-xs bg-success hover:bg-success/80 text-success-foreground px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {uiT("ui.6007acbe30b2cd98")}
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {uiT("ui.ab604a360777735f")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onToggleHeaders}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isHeadersExpanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
          {uiT("ui.2eb6ee8f53f72c75")}
          {g.customHeaders.length > 0 && (
            <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
              {g.customHeaders.length}
            </span>
          )}
        </button>
        {isHeadersExpanded && (
          <div className="mt-2">
            {g.customHeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">{uiT("ui.02c47f05b18dfa27")}</p>
            ) : (
              <div className="space-y-1">
                {g.customHeaders.map((h, i) => (
                  <div key={`${h.key}-${i}`} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground bg-muted border border-border rounded-sm px-2 py-0.5">
                      {h.key}
                    </span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-foreground bg-muted border border-border rounded-sm px-2 py-0.5">
                      {h.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

type DetailPanelProps = {
  guardrail: TeamGuardrail;
  isAdmin: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onToggleForwardKey: () => void;
  onUpdateCustomHeaders: (customHeaders: { key: string; value: string }[]) => Promise<void>;
  onUpdateExtraHeaders: (extraHeaders: string[]) => Promise<void>;
};

function DetailPanel({
  guardrail: g,
  isAdmin,
  onClose,
  onApprove,
  onReject,
  onToggleForwardKey,
  onUpdateCustomHeaders,
  onUpdateExtraHeaders,
}: DetailPanelProps) {
  const { t: uiT } = useDashboardLanguage();

  const [configExpanded, setConfigExpanded] = useState(false);
  const [newExtraHeader, setNewExtraHeader] = useState("");
  const [newStaticHeaderKey, setNewStaticHeaderKey] = useState("");
  const [newStaticHeaderValue, setNewStaticHeaderValue] = useState("");
  const status = STATUS_CONFIG[g.status];
  const teamColor = TEAM_COLORS[g.team] ?? "bg-muted text-foreground";
  return (
    <div className="w-96 shrink-0 bg-card overflow-auto">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${teamColor}`}>
                {uiT("ui.47355f46161815a6")} {g.team}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <h2 className="text-base font-semibold text-foreground">{g.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uiT("ui.1c84cbb4698b4c11")} {g.submittedBy} {uiT("ui.b8d31e852725afb1")} {g.submittedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={uiT("ui.e4deb8a4636bce0e")}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{g.description}</p>
        <div className="space-y-4">
          <ConfigRow label={uiT("ui.3df9726c68ba76d6")}>
            <div className="flex items-center gap-1.5">
              <code className="text-xs font-mono text-foreground break-all">{g.endpoint}</code>
              <a
                href={g.endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-info shrink-0"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </ConfigRow>
          <ConfigRow label={uiT("ui.52a0f9b65b27")}>
            <span className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded-sm">
              {g.method}
            </span>
          </ConfigRow>
          <div className="border border-info/15 bg-info/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <KeyIcon className="h-3.5 w-3.5 text-info" />
                <span className="text-xs font-semibold text-info">{uiT("ui.9d763b4e8c1499e8")}</span>
              </div>
              <Toggle enabled={g.forwardKey} onToggle={onToggleForwardKey} disabled={!isAdmin} />
            </div>
            <p className="text-xs text-info leading-relaxed">
              {uiT("ui.33a359ef835ae2b6")} <code className="font-mono bg-info/15 px-1 rounded-sm">Authorization</code>{" "}
              {uiT("ui.5f75612c5dea3352")}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-foreground">{uiT("ui.2eb6ee8f53f72c75")}</span>
              {g.customHeaders.length > 0 && (
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {g.customHeaders.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{uiT("ui.02af6058d1bde29a")}</p>
            {g.customHeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic mb-2">{uiT("ui.02c47f05b18dfa27")}</p>
            ) : (
              <ul className="list-none space-y-1 mb-2">
                {g.customHeaders.map((h, i) => (
                  <li
                    key={`${h.key}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs font-mono bg-muted border border-border rounded-sm px-2 py-1.5"
                  >
                    <span className="text-foreground truncate">
                      {h.key}: {h.value}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onUpdateCustomHeaders(g.customHeaders.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label={uiT("ui.86790c6d4f116494", { v0: String(h.key) })}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input
                  type="text"
                  value={newStaticHeaderKey}
                  onChange={(e) => setNewStaticHeaderKey(e.target.value)}
                  placeholder={uiT("ui.7ade5280cc2a7532")}
                  className="flex-1 min-w-0 text-xs font-mono border border-border rounded-sm px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const key = newStaticHeaderKey.trim();
                      const value = newStaticHeaderValue.trim();
                      if (key && !g.customHeaders.some((h) => h.key.toLowerCase() === key.toLowerCase())) {
                        onUpdateCustomHeaders([...g.customHeaders, { key, value }]);
                        setNewStaticHeaderKey("");
                        setNewStaticHeaderValue("");
                      }
                    }
                  }}
                />
                <input
                  type="text"
                  value={newStaticHeaderValue}
                  onChange={(e) => setNewStaticHeaderValue(e.target.value)}
                  placeholder={uiT("ui.8e37953d23daca5f")}
                  className="flex-1 min-w-0 text-xs font-mono border border-border rounded-sm px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const key = newStaticHeaderKey.trim();
                      const value = newStaticHeaderValue.trim();
                      if (key && !g.customHeaders.some((h) => h.key.toLowerCase() === key.toLowerCase())) {
                        onUpdateCustomHeaders([...g.customHeaders, { key, value }]);
                        setNewStaticHeaderKey("");
                        setNewStaticHeaderValue("");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const key = newStaticHeaderKey.trim();
                    const value = newStaticHeaderValue.trim();
                    if (key && !g.customHeaders.some((h) => h.key.toLowerCase() === key.toLowerCase())) {
                      onUpdateCustomHeaders([...g.customHeaders, { key, value }]);
                      setNewStaticHeaderKey("");
                      setNewStaticHeaderValue("");
                    }
                  }}
                  className="text-xs font-medium text-info border border-info/20 bg-info/10 hover:bg-info/15 px-2 py-1.5 rounded-sm transition-colors shrink-0"
                >
                  {uiT("ui.9fd728c66c9a")}
                </button>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold text-foreground">{uiT("ui.39e648eff94fda13")}</span>
              {g.extraHeaders.length > 0 && (
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {g.extraHeaders.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{uiT("ui.2ef077d82c47cc14")}</p>
            {g.extraHeaders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic mb-2">{uiT("ui.d9ec4564eae347f5")}</p>
            ) : (
              <ul className="list-none space-y-1 mb-2">
                {g.extraHeaders.map((name, i) => (
                  <li
                    key={`${name}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs font-mono bg-muted border border-border rounded-sm px-2 py-1.5"
                  >
                    <span className="text-foreground truncate">{name}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onUpdateExtraHeaders(g.extraHeaders.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label={uiT("ui.86790c6d4f116494", { v0: String(name) })}
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {isAdmin && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExtraHeader}
                  onChange={(e) => setNewExtraHeader(e.target.value)}
                  placeholder={uiT("ui.a12cac1b75887f82")}
                  className="flex-1 min-w-0 text-xs font-mono border border-border rounded-sm px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const name = newExtraHeader.trim().toLowerCase();
                      if (name && !g.extraHeaders.map((h) => h.toLowerCase()).includes(name)) {
                        onUpdateExtraHeaders([...g.extraHeaders, name]);
                        setNewExtraHeader("");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newExtraHeader.trim().toLowerCase();
                    if (name && !g.extraHeaders.map((h) => h.toLowerCase()).includes(name)) {
                      onUpdateExtraHeaders([...g.extraHeaders, name]);
                      setNewExtraHeader("");
                    }
                  }}
                  className="text-xs font-medium text-info border border-info/20 bg-info/10 hover:bg-info/15 px-2 py-1.5 rounded-sm transition-colors"
                >
                  {uiT("ui.9fd728c66c9a")}
                </button>
              </div>
            )}
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setConfigExpanded(!configExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-semibold text-foreground bg-muted hover:bg-border transition-colors"
            >
              <span>{uiT("ui.c32dbe873b857044")}</span>
              {configExpanded ? (
                <ChevronUpIcon className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {configExpanded && (
              <pre className="p-3 text-xs font-mono text-foreground bg-card border-t border-border overflow-x-auto whitespace-pre-wrap break-all">
                {buildEquivalentConfigYaml(g)}
              </pre>
            )}
          </div>
          <div className="flex items-start gap-2 bg-muted border border-border rounded-lg p-3">
            <InfoIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {uiT("ui.c6ffc5162f4f0ad1")}{" "}
              <a
                href="https://docs.litellm.ai/docs/adding_provider/generic_guardrail_api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:underline"
              >
                {uiT("ui.c3218ee3aab304c9")}
              </a>{" "}
              {uiT("ui.bb467a376026cf0e")}
            </p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-border space-y-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-border text-foreground hover:bg-muted text-sm font-medium py-2 rounded-md transition-colors"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            {uiT("ui.6369e13f0d9a1b8e")}
          </button>
          {isAdmin && g.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 bg-success hover:bg-success/80 text-success-foreground text-sm font-medium py-2 rounded-md transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                {uiT("ui.6007acbe30b2cd98")}
              </button>
              <button
                type="button"
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium py-2 rounded-md transition-colors"
              >
                <XIcon className="h-4 w-4" />
                {uiT("ui.ab604a360777735f")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  action: "approve" | "reject";
  guardrailName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDialog({ action, guardrailName, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t: uiT } = useDashboardLanguage();

  const isApprove = action === "approve";
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-overlay">
      <div className="bg-card rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
            isApprove ? "bg-success/15" : "bg-destructive/15"
          }`}
        >
          {isApprove ? (
            <CheckIcon className="h-5 w-5 text-success" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-destructive" />
          )}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {isApprove ? uiT("ui.0229cdc3d6d96fc7") : uiT("ui.54b9bbf93decffbe")}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {uiT("ui.a846d5dbb89b0376")} {action}{" "}
          <span className="font-medium text-foreground">
            {uiT("ui.8a331fdde7032f33")}
            {guardrailName} {uiT("ui.8a331fdde7032f33")}
          </span>
          ? {isApprove ? uiT("ui.cba45cc5507d29b9") : uiT("ui.b64f56091501dd8d")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-foreground hover:bg-muted text-sm font-medium py-2 rounded-md transition-colors"
          >
            {uiT("ui.19766ed6ccb2")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              isApprove
                ? "bg-success text-success-foreground hover:bg-success/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
            }`}
          >
            {isApprove ? uiT("ui.6007acbe30b2cd98") : uiT("ui.ab604a360777735f")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TeamGuardrailsTabProps {
  accessToken: string | null;
}

export function TeamGuardrailsTab({ accessToken }: TeamGuardrailsTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const { userRole } = useAuthorized();
  const isAdmin = userRole ? isProxyAdminRole(userRole) : false;
  const [guardrails, setGuardrails] = useState<TeamGuardrail[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending_review: 0,
    active: 0,
    rejected: 0,
  });
  const [search, setSearch] = useState("");
  const [searchDebounced] = useDebouncedValue(search, { wait: DEBOUNCE_WAIT_MS });
  const [statusFilter, setStatusFilter] = useState<"all" | GuardrailStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const submitForm = useZodForm(submitGuardrailSchema, { defaultValues: EMPTY_SUBMIT_VALUES });
  const registerGuardrail = useRegisterGuardrail();

  const fetchSubmissions = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const statusParam =
        statusFilter === "all" ? undefined : statusFilter === "pending" ? "pending_review" : statusFilter;
      const res = await listGuardrailSubmissions(accessToken, {
        status: statusParam,
        search: searchDebounced.trim() || undefined,
      });
      setGuardrails(res.submissions.map(submissionToTeamGuardrail));
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
      setGuardrails([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, statusFilter, searchDebounced]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSubmitGuardrail = submitForm.handleSubmit(async (values) => {
    const litellm_params: Record<string, unknown> = {
      ...(values.extra_litellm_params ? JSON.parse(values.extra_litellm_params) : {}),
      guardrail: "generic_guardrail_api",
      mode: values.mode,
      api_base: values.api_base,
    };
    try {
      await registerGuardrail.mutateAsync({
        team_id: values.team_id,
        guardrail_name: values.guardrail_name,
        litellm_params,
        guardrail_info: values.guardrail_info ? JSON.parse(values.guardrail_info) : undefined,
      });
      toast.success(translateUi("ui.de939f1ea99cad79"));
      setIsSubmitModalOpen(false);
      submitForm.reset();
      fetchSubmissions();
    } catch {
      return;
    }
  });

  const filtered = guardrails;
  const selected = guardrails.find((g) => g.id === selectedId) ?? null;
  const totalCount = summary.total;
  const pendingCount = summary.pending_review;
  const activeCount = summary.active;
  const rejectedCount = summary.rejected;

  async function toggleForwardKey(id: string) {
    if (!accessToken) return;
    const g = guardrails.find((x) => x.id === id);
    if (!g) return;
    const newValue = !g.forwardKey;
    try {
      await updateGuardrailCall(accessToken, id, {
        litellm_params: { forward_api_key: newValue },
      });
      setGuardrails((prev) => prev.map((x) => (x.id === id ? { ...x, forwardKey: newValue } : x)));
      toast.success(newValue ? translateUi("ui.7a617569023c8b74") : translateUi("ui.0a79b462266756a3"));
    } catch {
      toast.fromError("Failed to update forward API key");
    }
  }

  async function updateCustomHeaders(id: string, customHeaders: { key: string; value: string }[]) {
    if (!accessToken) return;
    const headersObj: Record<string, string> = {};
    for (const { key, value } of customHeaders) {
      if (key.trim()) headersObj[key.trim()] = value;
    }
    try {
      await updateGuardrailCall(accessToken, id, {
        litellm_params: { headers: headersObj },
      });
      setGuardrails((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                customHeaders: customHeaders.filter((h) => h.key.trim()),
              }
            : x,
        ),
      );
      toast.success(translateUi("ui.ddc806f5842bd1d7"));
    } catch {
      toast.fromError("Failed to update static headers");
    }
  }

  async function updateExtraHeaders(id: string, extraHeaders: string[]) {
    if (!accessToken) return;
    try {
      await updateGuardrailCall(accessToken, id, {
        litellm_params: { extra_headers: extraHeaders },
      });
      setGuardrails((prev) => prev.map((x) => (x.id === id ? { ...x, extraHeaders } : x)));
      toast.success(translateUi("ui.50d6bfd56ff03c55"));
    } catch {
      toast.fromError("Failed to update forward client headers");
    }
  }

  async function handleApprove(id: string) {
    if (!accessToken) return;
    try {
      await approveGuardrailSubmission(accessToken, id);
      setConfirmAction(null);
      if (selectedId === id) setSelectedId(null);
      await fetchSubmissions();
      toast.success(translateUi("ui.3fd207bf31da1380"));
    } catch {
      toast.fromError("Failed to approve guardrail");
    }
  }

  async function handleReject(id: string) {
    if (!accessToken) return;
    try {
      await rejectGuardrailSubmission(accessToken, id);
      setConfirmAction(null);
      if (selectedId === id) setSelectedId(null);
      await fetchSubmissions();
      toast.success(translateUi("ui.ad6111a6657ecf37"));
    } catch {
      toast.fromError("Failed to reject guardrail");
    }
  }

  function toggleHeaders(id: string) {
    setExpandedHeaders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-full">
      <div className={`flex-1 min-w-0 p-6 overflow-auto ${selected ? "border-r border-border" : ""}`}>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label={uiT("ui.6d4030b8e8b92bda")} value={totalCount} color="text-foreground" />
          <StatCard label={uiT("ui.da77d8f5b71aa068")} value={pendingCount} color="text-warning" />
          <StatCard label={uiT("ui.92340695899b")} value={activeCount} color="text-success" />
          <StatCard label={uiT("ui.aea4a04a80426ed8")} value={rejectedCount} color="text-destructive" />
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={uiT("ui.965213f4c71289ea")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-info"
            />
          </div>
          <select
            aria-label={uiT("ui.94d5a7703a8250de")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-info bg-background"
          >
            <option value="all">{uiT("ui.4310add71be8b78a")}</option>
            <option value="pending">{uiT("ui.da77d8f5b71aa068")}</option>
            <option value="active">{uiT("ui.92340695899b")}</option>
            <option value="rejected">{uiT("ui.aea4a04a80426ed8")}</option>
          </select>
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="ml-auto flex items-center gap-2 bg-info hover:bg-info/80 text-info-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {uiT("ui.e66e4f73f5eee8a7")}
          </button>
        </div>
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm">{uiT("ui.45ed14ba3a19966b")}</div>
          )}
          {error && <div className="text-center py-12 text-destructive text-sm">{error}</div>}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">{uiT("ui.b2f6d8d6ac952371")}</div>
          )}
          {!isLoading &&
            !error &&
            filtered.map((g) => (
              <GuardrailCard
                key={g.id}
                guardrail={g}
                isSelected={selectedId === g.id}
                isHeadersExpanded={expandedHeaders.has(g.id)}
                isAdmin={isAdmin}
                onSelect={() => setSelectedId(selectedId === g.id ? null : g.id)}
                onToggleForwardKey={() => toggleForwardKey(g.id)}
                onToggleHeaders={() => toggleHeaders(g.id)}
                onApprove={() => setConfirmAction({ id: g.id, action: "approve" })}
                onReject={() => setConfirmAction({ id: g.id, action: "reject" })}
              />
            ))}
        </div>
      </div>
      {selected && (
        <DetailPanel
          guardrail={selected}
          isAdmin={isAdmin}
          onClose={() => setSelectedId(null)}
          onApprove={() => setConfirmAction({ id: selected.id, action: "approve" })}
          onReject={() => setConfirmAction({ id: selected.id, action: "reject" })}
          onToggleForwardKey={() => toggleForwardKey(selected.id)}
          onUpdateCustomHeaders={(customHeaders) => updateCustomHeaders(selected.id, customHeaders)}
          onUpdateExtraHeaders={(extraHeaders) => updateExtraHeaders(selected.id, extraHeaders)}
        />
      )}
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction.action}
          guardrailName={guardrails.find((g) => g.id === confirmAction.id)?.name ?? ""}
          onConfirm={() =>
            confirmAction.action === "approve" ? handleApprove(confirmAction.id) : handleReject(confirmAction.id)
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <Dialog
        open={isSubmitModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSubmitModalOpen(false);
            submitForm.reset();
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{uiT("ui.79fe689f37aa04c6")}</DialogTitle>
          </DialogHeader>
          <div className="rounded-md bg-info/10 border border-info/20 px-4 py-3 text-sm text-info mb-4">
            {uiT("ui.3108147414dd165a")}
          </div>
          <TooltipProvider>
            <form onSubmit={handleSubmitGuardrail}>
              <FieldGroup>
                <FormField control={submitForm.control} name="team_id" label={uiT("ui.5985039f106d")}>
                  {({ id, value, onChange }) => <TeamDropdown id={id} value={value} onChange={onChange} />}
                </FormField>
                <FormField control={submitForm.control} name="guardrail_name" label={uiT("ui.25e74db3ec6ad797")}>
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={uiT("ui.eb4d0be27490a039")} />}
                </FormField>
                <FormField control={submitForm.control} name="mode" label={uiT("ui.5e23ec6a300dc60a")}>
                  {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                    <Select items={GUARDRAIL_MODES} value={value} onValueChange={onChange}>
                      <SelectTrigger
                        id={id}
                        aria-invalid={ariaInvalid}
                        aria-describedby={ariaDescribedBy}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GUARDRAIL_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value} title={mode.label}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField control={submitForm.control} name="api_base" label={uiT("ui.2dc1d97c8fafa224")}>
                  {({ ref, ...field }) => (
                    <Input
                      {...field}
                      ref={ref}
                      placeholder="https://your-guardrail-api.com/v1/check"
                      className="font-mono"
                    />
                  )}
                </FormField>
                <FormField
                  control={submitForm.control}
                  name="extra_litellm_params"
                  label={labelWithHint(
                    "Additional litellm_params (optional)",
                    "JSON object merged into litellm_params. e.g. forward_api_key, headers, model, unreachable_fallback",
                  )}
                >
                  {({ ref, ...field }) => (
                    <Textarea
                      {...field}
                      ref={ref}
                      rows={3}
                      className="font-mono text-xs"
                      placeholder='{"forward_api_key": true, "headers": {"X-Custom": "value"}}'
                    />
                  )}
                </FormField>
                <FormField control={submitForm.control} name="guardrail_info" label={uiT("ui.53f0cf315848c5d1")}>
                  {({ ref, ...field }) => (
                    <Textarea
                      {...field}
                      ref={ref}
                      rows={3}
                      className="font-mono text-xs"
                      placeholder='{"description": "Detects PII in requests"}'
                    />
                  )}
                </FormField>
              </FieldGroup>
            </form>
          </TooltipProvider>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitModalOpen(false);
                submitForm.reset();
              }}
            >
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button onClick={handleSubmitGuardrail}>{uiT("ui.5acdc339980686e4")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
