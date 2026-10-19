"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React, { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { ArrowLeft, MoreVertical, Plus } from "lucide-react";
import {
  GuardrailPipeline,
  PipelineStep,
  PipelineTestResult,
  PolicyCreateRequest,
  PolicyUpdateRequest,
  Policy,
} from "@/components/policies/types";
import { Guardrail } from "@/components/guardrails/types";
import {
  testPipelineCall,
  listPolicyVersions,
  createPolicyVersion,
  updatePolicyVersionStatus,
} from "@/components/networking";
import { getComplianceDatasetPrompts, getFrameworks } from "@/data/compliancePrompts";
import type { CompliancePrompt } from "@/data/compliancePrompts";

const TEST_SOURCE_QUICK = "quick_chat";
const TEST_SOURCE_ALL = "__all__";

function getPromptsForTestSource(source: string): CompliancePrompt[] {
  if (source === TEST_SOURCE_QUICK) return [];
  if (source === TEST_SOURCE_ALL) return getComplianceDatasetPrompts();
  const fw = getFrameworks().find((f) => f.name === source);
  return fw ? fw.categories.flatMap((c) => c.prompts) : [];
}

const ACTION_OPTIONS = [
  {
    get label() {
      return translateUi("ui.226366c3301a2d1f");
    },
    value: "next",
  },
  {
    get label() {
      return translateUi("ui.e213c161d5cefa52");
    },
    value: "allow",
  },
  {
    get label() {
      return translateUi("ui.211d0bb8cf4f");
    },
    value: "block",
  },
  {
    get label() {
      return translateUi("ui.5728c5204f7352a0");
    },
    value: "modify_response",
  },
];

const ACTION_LABELS: Record<string, string> = {
  get allow() {
    return translateUi("ui.e213c161d5cefa52");
  },
  get block() {
    return translateUi("ui.211d0bb8cf4f");
  },
  get next() {
    return translateUi("ui.226366c3301a2d1f");
  },
  get modify_response() {
    return translateUi("ui.5728c5204f7352a0");
  },
};

function createDefaultStep(): PipelineStep {
  return {
    guardrail: "",
    on_pass: "next",
    on_fail: "block",
    pass_data: false,
    modify_response_message: null,
  };
}

function insertStep(steps: PipelineStep[], atIndex: number): PipelineStep[] {
  const newSteps = [...steps];
  newSteps.splice(atIndex, 0, createDefaultStep());
  return newSteps;
}

function removeStep(steps: PipelineStep[], index: number): PipelineStep[] {
  if (steps.length <= 1) return steps;
  const newSteps = [...steps];
  newSteps.splice(index, 1);
  return newSteps;
}

function updateStepAtIndex(steps: PipelineStep[], index: number, updated: Partial<PipelineStep>): PipelineStep[] {
  return steps.map((s, i) => (i === index ? { ...s, ...updated } : s));
}

/**
 * Derives a pipeline from a policy. When the policy has a pipeline, use it.
 * When it only has guardrails_add (legacy/simple form), convert those guardrails
 * into pipeline steps in order.
 */
function derivePipelineFromPolicy(policy: Policy | null | undefined): GuardrailPipeline {
  if (!policy) {
    return { mode: "pre_call", steps: [createDefaultStep()] };
  }
  if (policy.pipeline?.steps?.length) {
    return policy.pipeline;
  }
  const guardrails = policy.guardrails_add || [];
  if (guardrails.length > 0) {
    return {
      mode: policy.pipeline?.mode ?? "pre_call",
      steps: guardrails.map((g) => ({
        guardrail: g,
        on_pass: "next" as const,
        on_fail: "block" as const,
        pass_data: false,
        modify_response_message: null,
      })),
    };
  }
  return { mode: "pre_call", steps: [createDefaultStep()] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (matching the reference image)
// ─────────────────────────────────────────────────────────────────────────────

const GuardrailIcon: React.FC = () => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: "50%",
      backgroundColor: "color-mix(in oklab, var(--color-info) 10%, transparent)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: "var(--color-info)" }}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
    </svg>
  </div>
);

const PlayIcon: React.FC = () => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: "50%",
      backgroundColor: "var(--color-muted)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      style={{ color: "var(--color-muted-foreground)" }}
    >
      <polygon points="6,3 20,12 6,21" />
    </svg>
  </div>
);

const PassIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "var(--color-success)" }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const FailIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "var(--color-destructive)" }}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const ApiFailureIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "var(--color-warning)" }}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Connector
// ─────────────────────────────────────────────────────────────────────────────

interface ConnectorProps {
  onInsert: () => void;
}

const Connector: React.FC<ConnectorProps> = ({ onInsert }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="flex flex-col items-center" style={{ height: 56 }}>
      <div style={{ width: 1, flex: 1, backgroundColor: "var(--color-border)" }} />
      <button
        onClick={onInsert}
        className="z-raised flex items-center justify-center"
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1px solid var(--color-border)",
          backgroundColor: "var(--color-card)",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-info)";
          e.currentTarget.style.backgroundColor = "color-mix(in oklab, var(--color-info) 10%, transparent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.backgroundColor = "var(--color-card)";
        }}
        title={uiT("ui.521fab65d364f07f")}
      >
        <Plus style={{ width: 12, height: 12, color: "var(--color-muted-foreground)" }} />
      </button>
      <div style={{ width: 1, flex: 1, backgroundColor: "var(--color-border)" }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step Card (editable)
// ─────────────────────────────────────────────────────────────────────────────

interface StepCardProps {
  step: PipelineStep;
  stepIndex: number;
  totalSteps: number;
  onChange: (updated: Partial<PipelineStep>) => void;
  onDelete: () => void;
  availableGuardrails: Guardrail[];
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  onChange,
  onDelete,
  availableGuardrails,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const guardrailOptions = availableGuardrails.map((g) => ({
    label: g.guardrail_name || g.guardrail_id,
    value: g.guardrail_name || g.guardrail_id,
  }));

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        backgroundColor: "var(--color-card)",
        maxWidth: 720,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between" style={{ padding: "14px 20px 0 20px" }}>
        <div className="flex items-center gap-2">
          <GuardrailIcon />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--color-info)",
              letterSpacing: "0.06em",
            }}
          >
            {uiT("ui.ab8b74ea4407659e")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
            {uiT("ui.8e6a6cca7aae1d1e")} {stepIndex + 1}
          </span>
          <button
            onClick={onDelete}
            disabled={totalSteps <= 1}
            style={{
              background: "none",
              border: "none",
              cursor: totalSteps <= 1 ? "not-allowed" : "pointer",
              opacity: totalSteps <= 1 ? 0.3 : 1,
              padding: 2,
              display: "flex",
              alignItems: "center",
            }}
            title={uiT("ui.0e31c0819a7f551d")}
          >
            <MoreVertical style={{ width: 16, height: 16, color: "var(--color-muted-foreground)" }} />
          </button>
        </div>
      </div>

      {/* Guardrail selector */}
      <div style={{ padding: "12px 20px 16px 20px" }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {uiT("ui.ba3f7a9c79a7")}
        </label>
        <SearchSelect
          options={guardrailOptions}
          value={step.guardrail || undefined}
          onValueChange={(value) => onChange({ guardrail: value ?? undefined })}
          placeholder={uiT("ui.65b5f765cbde265a")}
          emptyText={uiT("ui.8cdd5f5fbb0f2781")}
        />
      </div>

      {/* ON PASS section */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 20px" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <PassIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
            {uiT("ui.85c5543ae08da7bf")}
          </span>
        </div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {uiT("ui.64cff1319d2f")}
        </label>
        <Select value={step.on_pass} onValueChange={(value) => onChange({ on_pass: value as PipelineStep["on_pass"] })}>
          <SelectTrigger className="w-full">
            <SelectValue>{ACTION_LABELS[step.on_pass] || step.on_pass}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {step.on_pass === "modify_response" && (
          <div style={{ marginTop: 8 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-muted-foreground)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {uiT("ui.9e6e71a948f6a744")}
            </label>
            <Input
              placeholder={uiT("ui.3bf3c31747706f0c")}
              value={step.modify_response_message || ""}
              onChange={(e) => onChange({ modify_response_message: e.target.value || null })}
            />
          </div>
        )}
      </div>

      {/* ON FAIL section */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 20px" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <FailIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
            {uiT("ui.46494402b4bd4497")}
          </span>
        </div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {uiT("ui.64cff1319d2f")}
        </label>
        <Select value={step.on_fail} onValueChange={(value) => onChange({ on_fail: value as PipelineStep["on_fail"] })}>
          <SelectTrigger className="w-full">
            <SelectValue>{ACTION_LABELS[step.on_fail] || step.on_fail}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {step.on_fail === "modify_response" && (
          <div style={{ marginTop: 8 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-muted-foreground)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {uiT("ui.9e6e71a948f6a744")}
            </label>
            <Input
              placeholder={uiT("ui.3bf3c31747706f0c")}
              value={step.modify_response_message || ""}
              onChange={(e) => onChange({ modify_response_message: e.target.value || null })}
            />
          </div>
        )}
      </div>

      {/* ON API FAILURE (technical / provider outage) — optional; defaults to ON FAIL */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "14px 20px" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <ApiFailureIcon />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
            {uiT("ui.faf9ef70e2dc8ac6")}
          </span>
        </div>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {uiT("ui.64cff1319d2f")}
        </label>
        <Select
          value={step.on_error ?? null}
          onValueChange={(value) =>
            onChange({ on_error: value === null ? undefined : (value as PipelineStep["on_error"]) })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {step.on_error != null ? ACTION_LABELS[step.on_error] || step.on_error : uiT("ui.3b49de5a51af901d")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>{uiT("ui.3b49de5a51af901d")}</SelectItem>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {step.on_error === "modify_response" && step.on_fail !== "modify_response" && (
          <div style={{ marginTop: 8 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-muted-foreground)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {uiT("ui.9e6e71a948f6a744")}
            </label>
            <Input
              placeholder={uiT("ui.3bf3c31747706f0c")}
              value={step.modify_response_message || ""}
              onChange={(e) => onChange({ modify_response_message: e.target.value || null })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface PipelineFlowBuilderProps {
  pipeline: GuardrailPipeline;
  onChange: (pipeline: GuardrailPipeline) => void;
  availableGuardrails: Guardrail[];
}

const PipelineFlowBuilder: React.FC<PipelineFlowBuilderProps> = ({ pipeline, onChange, availableGuardrails }) => {
  const { t: uiT } = useDashboardLanguage();

  const handleInsertStep = (atIndex: number) => {
    onChange({ ...pipeline, steps: insertStep(pipeline.steps, atIndex) });
  };

  const handleRemoveStep = (index: number) => {
    onChange({ ...pipeline, steps: removeStep(pipeline.steps, index) });
  };

  const handleUpdateStep = (index: number, updated: Partial<PipelineStep>) => {
    onChange({
      ...pipeline,
      steps: updateStepAtIndex(pipeline.steps, index, updated),
    });
  };

  return (
    <div className="flex flex-col items-center" style={{ padding: "16px 0" }}>
      {/* Trigger Card */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "16px 20px",
          backgroundColor: "var(--color-card)",
          maxWidth: 720,
          width: "100%",
        }}
      >
        <div className="flex items-center gap-3">
          <PlayIcon />
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--color-muted-foreground)",
                letterSpacing: "0.06em",
                display: "block",
                marginBottom: 2,
              }}
            >
              {uiT("ui.f3bbca3a684e7f2d")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)", display: "block" }}>
              {uiT("ui.53aacf1d5f0202a4")}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{uiT("ui.b422ae40c0863f5a")}</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      {pipeline.steps.map((step, index) => (
        <React.Fragment key={index}>
          <Connector onInsert={() => handleInsertStep(index)} />
          <StepCard
            step={step}
            stepIndex={index}
            totalSteps={pipeline.steps.length}
            onChange={(updated) => handleUpdateStep(index, updated)}
            onDelete={() => handleRemoveStep(index)}
            availableGuardrails={availableGuardrails}
          />
        </React.Fragment>
      ))}

      {/* Bottom connector */}
      <Connector onInsert={() => handleInsertStep(pipeline.steps.length)} />

      {/* End card */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "14px 20px",
          backgroundColor: "var(--color-card)",
          maxWidth: 720,
          width: "100%",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "var(--color-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--color-muted-foreground)",
                letterSpacing: "0.06em",
                display: "block",
                marginBottom: 2,
              }}
            >
              {uiT("ui.b891f9e2a6962626")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)", display: "block" }}>
              {uiT("ui.6c1fc6fb7449ae9e")}
            </span>
            <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{uiT("ui.c1bd08cb1d3e932c")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Read-only display for policy info view
// ─────────────────────────────────────────────────────────────────────────────

interface PipelineInfoDisplayProps {
  pipeline: GuardrailPipeline;
}

export const PipelineInfoDisplay: React.FC<PipelineInfoDisplayProps> = ({ pipeline }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="flex flex-col items-center" style={{ padding: "16px 0" }}>
      {/* Trigger */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "14px 20px",
          backgroundColor: "var(--color-card)",
          maxWidth: 720,
          width: "100%",
        }}
      >
        <div className="flex items-center gap-3">
          <PlayIcon />
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--color-muted-foreground)",
                letterSpacing: "0.06em",
                display: "block",
                marginBottom: 2,
              }}
            >
              {uiT("ui.f3bbca3a684e7f2d")}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)" }}>
              {uiT("ui.53aacf1d5f0202a4")}
            </span>
          </div>
        </div>
      </div>

      {/* Steps */}
      {pipeline.steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Connector */}
          <div style={{ width: 1, height: 32, backgroundColor: "var(--color-border)" }} />

          {/* Step card */}
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "14px 20px",
              backgroundColor: "var(--color-card)",
              maxWidth: 720,
              width: "100%",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div className="flex items-center gap-2">
                <GuardrailIcon />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--color-info)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {uiT("ui.ab8b74ea4407659e")}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>
                {uiT("ui.8e6a6cca7aae1d1e")} {index + 1}
              </span>
            </div>

            {/* Name */}
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-foreground)", marginBottom: 8 }}>
              {step.guardrail}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--color-muted)", marginBottom: 10 }} />

            {/* Pass / Fail / API failure */}
            <div className="flex flex-col gap-2" style={{ fontSize: 13, color: "var(--color-foreground)" }}>
              <span className="flex items-center gap-1.5">
                <PassIcon /> {uiT("ui.1609809f52cf78a5")} {ACTION_LABELS[step.on_pass] || step.on_pass}
              </span>
              <span className="flex items-center gap-1.5">
                <FailIcon /> {uiT("ui.8b13f8fde9e1a6d6")} {ACTION_LABELS[step.on_fail] || step.on_fail}
              </span>
              <span className="flex items-center gap-1.5">
                <ApiFailureIcon /> {uiT("ui.aea32c331b21dc37")}{" "}
                {step.on_error != null
                  ? ACTION_LABELS[step.on_error] || step.on_error
                  : uiT("ui.28ddcc641f6f35c1", { v0: String(ACTION_LABELS[step.on_fail] || step.on_fail) })}
              </span>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Test Panel (right drawer)
// ─────────────────────────────────────────────────────────────────────────────

interface PipelineTestPanelProps {
  pipeline: GuardrailPipeline;
  accessToken: string | null;
  onClose: () => void;
}

const OUTCOME_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pass: {
    bg: "color-mix(in oklab, var(--color-success) 10%, transparent)",
    color: "var(--color-success)",
    get label() {
      return translateUi("ui.2f9acb02faa121bb");
    },
  },
  fail: {
    bg: "color-mix(in oklab, var(--color-destructive) 10%, transparent)",
    color: "var(--color-destructive)",
    get label() {
      return translateUi("ui.425305e25df9df10");
    },
  },
  error: {
    bg: "color-mix(in oklab, var(--color-warning) 10%, transparent)",
    color: "var(--color-warning)",
    get label() {
      return translateUi("ui.d98ee0e5f9399db9");
    },
  },
};

const TERMINAL_STYLES: Record<string, { bg: string; color: string }> = {
  allow: { bg: "color-mix(in oklab, var(--color-success) 10%, transparent)", color: "var(--color-success)" },
  block: { bg: "color-mix(in oklab, var(--color-destructive) 10%, transparent)", color: "var(--color-destructive)" },
  modify_response: { bg: "color-mix(in oklab, var(--color-info) 10%, transparent)", color: "var(--color-info)" },
};

interface ComplianceRunEntry {
  prompt: CompliancePrompt;
  result: PipelineTestResult | null;
  error?: string;
  matched: boolean;
}

function complianceMatchExpected(expected: "pass" | "fail", terminalAction: string): boolean {
  if (expected === "pass") {
    return terminalAction === "allow" || terminalAction === "modify_response";
  }
  return terminalAction === "block";
}

const testSourceOptions = [
  {
    value: TEST_SOURCE_QUICK,
    get label() {
      return translateUi("ui.2acf219daaf10625");
    },
  },
  ...getFrameworks().map((f) => ({
    value: f.name,
    get label() {
      return f.name;
    },
  })),
  {
    value: TEST_SOURCE_ALL,
    get label() {
      return translateUi("ui.2296f7295dea5d48");
    },
  },
];

const PipelineTestPanel: React.FC<PipelineTestPanelProps> = ({ pipeline, accessToken, onClose }) => {
  const { t: uiT } = useDashboardLanguage();

  const [testSource, setTestSource] = useState<string>(TEST_SOURCE_QUICK);
  const [testMessage, setTestMessage] = useState("Hello, can you help me?");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complianceResults, setComplianceResults] = useState<ComplianceRunEntry[]>([]);

  const isQuickChat = testSource === TEST_SOURCE_QUICK;
  const promptsForSource = getPromptsForTestSource(testSource);
  const isDataset = promptsForSource.length > 0;

  const handleRunTest = async () => {
    if (!accessToken) return;

    const emptySteps = pipeline.steps.filter((s) => !s.guardrail);
    if (emptySteps.length > 0) {
      setError("All steps must have a guardrail selected");
      return;
    }

    setError(null);
    setIsRunning(true);
    setResult(null);
    setComplianceResults([]);

    if (isQuickChat) {
      try {
        const data = await testPipelineCall(accessToken, pipeline, [{ role: "user", content: testMessage }]);
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsRunning(false);
      }
      return;
    }

    const entries: ComplianceRunEntry[] = [];
    for (const prompt of promptsForSource) {
      try {
        const data = await testPipelineCall(accessToken, pipeline, [{ role: "user", content: prompt.prompt }]);
        const matched = complianceMatchExpected(prompt.expectedResult, data.terminal_action);
        entries.push({ prompt, result: data, matched });
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        entries.push({
          prompt,
          result: null,
          error: errMsg,
          matched: false,
        });
      }
    }
    setComplianceResults(entries);
    setIsRunning(false);
  };

  return (
    <div
      style={{
        width: 400,
        borderLeft: "1px solid var(--color-border)",
        backgroundColor: "var(--color-card)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)" }}>
          {uiT("ui.9a4e3b0f7ccea8bb")}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "var(--color-muted-foreground)",
            padding: "0 4px",
          }}
        >
          x
        </button>
      </div>

      {/* Input section */}
      <div style={{ padding: 16, borderBottom: "1px solid var(--color-border)" }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {uiT("ui.cad945b0b274767a")}
        </label>
        <Select value={testSource} onValueChange={(value) => value !== null && setTestSource(value)}>
          <SelectTrigger className="mb-3 w-full">
            <SelectValue>
              {testSourceOptions.find((option) => option.value === testSource)?.label ?? testSource}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {testSourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isQuickChat && (
          <>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-muted-foreground)",
                display: "block",
                marginBottom: 6,
              }}
            >
              {uiT("ui.2f77668a9dfbf8d5")}
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder={uiT("ui.46f03ee61e6805a9")}
              rows={3}
              style={{
                width: "100%",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
                backgroundColor: "var(--color-card)",
                color: "var(--color-foreground)",
              }}
            />
          </>
        )}
        {isDataset && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
              padding: "8px 10px",
              backgroundColor: "var(--color-muted)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            {testSource === TEST_SOURCE_ALL
              ? uiT("ui.f66e4f8561103d0b")
              : uiT("ui.81268b3250ca98f1", { v0: String(promptsForSource.length), v1: String(testSource) })}
          </div>
        )}
        <Button onClick={handleRunTest} disabled={isRunning} style={{ marginTop: 8, width: "100%" }}>
          {uiT("ui.f3c5e08fb592ef7b")}
        </Button>
      </div>

      {/* Results section */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {error && (
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "color-mix(in oklab, var(--color-destructive) 10%, transparent)",
              border: "1px solid color-mix(in oklab, var(--color-destructive) 30%, transparent)",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--color-destructive)",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div>
            {/* Step results */}
            {result.step_results.map((step, i) => {
              const style = OUTCOME_STYLES[step.outcome] || OUTCOME_STYLES.error;
              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 8,
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                      {uiT("ui.8e6a6cca7aae1d1e")} {i + 1}: {step.guardrail_name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: style.bg,
                        color: style.color,
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                    {uiT("ui.7d9fda4ea853")} {ACTION_LABELS[step.action_taken] || step.action_taken}
                    {step.duration_seconds != null && (
                      <span style={{ marginLeft: 8 }}>
                        ({(step.duration_seconds * 1000).toFixed(0)}
                        {uiT("ui.9e7d85a50dc37f9f")}
                      </span>
                    )}
                  </div>
                  {step.error_detail && (
                    <div style={{ fontSize: 12, color: "var(--color-destructive)", marginTop: 4 }}>
                      {step.error_detail}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Terminal result */}
            <div
              style={{
                borderTop: "1px solid var(--color-border)",
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                  {uiT("ui.6e7d50e84f47")}
                </span>
                {(() => {
                  const ts = TERMINAL_STYLES[result.terminal_action] || TERMINAL_STYLES.block;
                  return (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: ts.bg,
                        color: ts.color,
                        padding: "3px 10px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      {result.terminal_action === "modify_response"
                        ? uiT("ui.5728c5204f7352a0")
                        : result.terminal_action}
                    </span>
                  );
                })()}
              </div>
              {result.error_message && (
                <div style={{ fontSize: 12, color: "var(--color-destructive)", marginTop: 6 }}>
                  {result.error_message}
                </div>
              )}
              {result.modify_response_message && (
                <div style={{ fontSize: 12, color: "var(--color-info)", marginTop: 6 }}>
                  {uiT("ui.e8209287d0b81929")} {result.modify_response_message}
                </div>
              )}
            </div>
          </div>
        )}

        {complianceResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-foreground)",
                marginBottom: 8,
              }}
            >
              {uiT("ui.93879cc712c35624")}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-muted-foreground)",
                marginBottom: 10,
              }}
            >
              {complianceResults.filter((e) => e.matched).length} / {complianceResults.length}{" "}
              {uiT("ui.e300a2534831ec5f")}
            </div>
            <div
              style={{
                maxHeight: 320,
                overflowY: "auto",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
              }}
            >
              {complianceResults.map((entry, i) => {
                const actual = entry.result?.terminal_action ?? (entry.error ? "error" : "—");
                const matchStyle = entry.matched
                  ? { bg: "color-mix(in oklab, var(--color-success) 10%, transparent)", color: "var(--color-success)" }
                  : {
                      bg: "color-mix(in oklab, var(--color-destructive) 10%, transparent)",
                      color: "var(--color-destructive)",
                    };
                return (
                  <div
                    key={entry.prompt.id ?? i}
                    style={{
                      padding: "8px 10px",
                      borderBottom: i < complianceResults.length - 1 ? "1px solid var(--color-border)" : "none",
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        color: "var(--color-foreground)",
                        marginBottom: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={entry.prompt.prompt}
                    >
                      {entry.prompt.prompt}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ color: "var(--color-muted-foreground)" }}>
                        {uiT("ui.749034ea977812e8")} {entry.prompt.expectedResult}
                      </span>
                      <span style={{ color: "var(--color-muted-foreground)" }}>→</span>
                      <span style={{ color: "var(--color-muted-foreground)" }}>
                        {uiT("ui.226f61b72685932a")} {actual}
                      </span>
                      <span
                        style={{
                          backgroundColor: matchStyle.bg,
                          color: matchStyle.color,
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {entry.matched ? "✓" : "✗"}
                      </span>
                    </div>
                    {entry.error && (
                      <div style={{ color: "var(--color-destructive)", marginTop: 4 }}>{entry.error}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!result && !error && complianceResults.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--color-muted-foreground)", fontSize: 13, marginTop: 24 }}>
            {uiT("ui.a79fae544c96acbf")}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Policy Versions Sidebar (left sidebar when editing a policy)
// ─────────────────────────────────────────────────────────────────────────────

const VERSION_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: "var(--color-muted)", color: "var(--color-muted-foreground)" },
  published: { bg: "color-mix(in oklab, var(--color-info) 10%, transparent)", color: "var(--color-info)" },
  production: { bg: "color-mix(in oklab, var(--color-success) 10%, transparent)", color: "var(--color-success)" },
};

interface PolicyVersionsSidebarProps {
  policyName: string;
  editingPolicyId: string | null;
  editingVersionStatus?: "draft" | "published" | "production";
  accessToken: string | null;
  versions: Policy[];
  isLoading: boolean;
  isCreatingVersion?: boolean;
  isUpdatingStatus?: boolean;
  onNewVersion: () => void;
  onSelectVersion: (policy: Policy) => void;
  onPublish?: () => void;
  onPromoteToProduction?: () => void;
}

const PolicyVersionsSidebar: React.FC<PolicyVersionsSidebarProps> = ({
  policyName,
  editingPolicyId,
  editingVersionStatus,
  accessToken,
  versions,
  isLoading,
  isCreatingVersion = false,
  isUpdatingStatus = false,
  onNewVersion,
  onSelectVersion,
  onPublish,
  onPromoteToProduction,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const canPublish = editingVersionStatus === "draft" && onPublish;
  const canPromote = editingVersionStatus === "published" && onPromoteToProduction;

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        backgroundColor: "var(--color-card)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        {/* Versions section */}
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--color-muted-foreground)",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 4,
            }}
          >
            {uiT("ui.f89ea27036ac1d31")}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.4,
              display: "block",
              marginBottom: 12,
            }}
          >
            {uiT("ui.3a84183e5f39340c")}
          </span>
          <Button
            onClick={onNewVersion}
            disabled={!accessToken || isCreatingVersion}
            style={{ width: "100%", marginBottom: 12 }}
          >
            {uiT("ui.bab6df01c6723126")}
          </Button>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
              <UiLoadingSpinner className="size-4" />
            </div>
          ) : versions.length === 0 ? (
            <span style={{ fontSize: 13, color: "var(--color-muted-foreground)" }}>{uiT("ui.9f3bfc4a2e942c2a")}</span>
          ) : (
            <div className="flex flex-col gap-1">
              {versions.map((v) => {
                const statusStyle = VERSION_STATUS_STYLES[v.version_status ?? "draft"] ?? VERSION_STATUS_STYLES.draft;
                const isActive = v.policy_id === editingPolicyId;
                return (
                  <button
                    key={v.policy_id}
                    type="button"
                    onClick={() => onSelectVersion(v)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: isActive ? "1px solid var(--color-info)" : "1px solid var(--color-border)",
                      backgroundColor: isActive
                        ? "color-mix(in oklab, var(--color-info) 10%, transparent)"
                        : "var(--color-card)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                        v{v.version_number ?? 1}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {v.version_status ?? uiT("ui.7743ce348d9284d6")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Publish / Promote to production for selected version */}
          {(canPublish || canPromote) && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              {canPublish && (
                <>
                  <Button
                    variant="secondary"
                    onClick={onPublish}
                    disabled={!accessToken || isUpdatingStatus}
                    style={{ width: "100%", marginBottom: 8 }}
                  >
                    {uiT("ui.859390eb495b2ead")}
                  </Button>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-muted-foreground)",
                      lineHeight: 1.4,
                      display: "block",
                      marginBottom: canPromote ? 8 : 0,
                    }}
                  >
                    {uiT("ui.548b3b364643be11")}
                  </span>
                </>
              )}
              {canPromote && (
                <>
                  <Button
                    onClick={onPromoteToProduction}
                    disabled={!accessToken || isUpdatingStatus}
                    style={{ width: "100%", marginBottom: 8 }}
                  >
                    {uiT("ui.8d158e1e26f55e93")}
                  </Button>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-muted-foreground)",
                      lineHeight: 1.4,
                      display: "block",
                    }}
                  >
                    {uiT("ui.022c21de2ac4a0a6")}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Silent Mirroring section */}
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--color-muted-foreground)",
                letterSpacing: "0.06em",
              }}
            >
              {uiT("ui.8ed8b08bf7dc8413")}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: "color-mix(in oklab, var(--color-info) 10%, transparent)",
                color: "var(--color-info)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {uiT("ui.bf3efc6a0ecb26d0")}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              color: "var(--color-muted-foreground)",
              lineHeight: 1.5,
              display: "block",
            }}
          >
            {uiT("ui.a3d2be072f152e1d")}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-screen Flow Builder Page
// ─────────────────────────────────────────────────────────────────────────────

interface FlowBuilderPageProps {
  onBack: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  editingPolicy?: Policy | null;
  availableGuardrails: Guardrail[];
  createPolicy: (accessToken: string, policyData: any) => Promise<any>;
  updatePolicy: (accessToken: string, policyId: string, policyData: any) => Promise<any>;
  onVersionCreated?: (newPolicy: Policy) => void;
  onSelectVersion?: (policy: Policy) => void;
  onVersionStatusUpdated?: (updatedPolicy: Policy) => void;
}

export const FlowBuilderPage: React.FC<FlowBuilderPageProps> = ({
  onBack,
  onSuccess,
  accessToken,
  editingPolicy,
  availableGuardrails,
  createPolicy,
  updatePolicy,
  onVersionCreated,
  onSelectVersion,
  onVersionStatusUpdated,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const isEditing = !!editingPolicy?.policy_id;
  const showVersionsSidebar = !!editingPolicy?.policy_name;

  const [policyName, setPolicyName] = useState(editingPolicy?.policy_name || "");
  const [description, setDescription] = useState(editingPolicy?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [pipeline, setPipeline] = useState<GuardrailPipeline>(() => derivePipelineFromPolicy(editingPolicy));
  const [versions, setVersions] = useState<Policy[]>([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync local state when editingPolicy changes (e.g. user switched version)
  React.useEffect(() => {
    setPolicyName(editingPolicy?.policy_name || "");
    setDescription(editingPolicy?.description || "");
    setPipeline(derivePipelineFromPolicy(editingPolicy));
  }, [
    editingPolicy?.policy_id,
    editingPolicy?.policy_name,
    editingPolicy?.description,
    editingPolicy?.pipeline,
    editingPolicy?.guardrails_add,
  ]);

  // Fetch versions when editing an existing policy by name
  React.useEffect(() => {
    if (!showVersionsSidebar || !editingPolicy?.policy_name || !accessToken) {
      setVersions([]);
      return;
    }
    let cancelled = false;
    setIsVersionsLoading(true);
    listPolicyVersions(accessToken, editingPolicy.policy_name)
      .then((res) => {
        if (!cancelled) setVersions(res.versions || []);
      })
      .catch(() => {
        if (!cancelled) setVersions([]);
      })
      .finally(() => {
        if (!cancelled) setIsVersionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showVersionsSidebar, editingPolicy?.policy_name, accessToken]);

  const handleNewVersion = async () => {
    if (!accessToken || !editingPolicy?.policy_name) return;
    setIsCreatingVersion(true);
    try {
      const newPolicy = await createPolicyVersion(accessToken, editingPolicy.policy_name);
      toast.success(translateUi("ui.e46f32a483b6bac6"));
      onVersionCreated?.(newPolicy);
      const list = await listPolicyVersions(accessToken, editingPolicy.policy_name);
      setVersions(list.versions ?? []);
    } catch (error) {
      toast.fromError("Failed to create version: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleSelectVersion = (policy: Policy) => {
    onSelectVersion?.(policy);
  };

  const handlePublishVersion = async () => {
    if (!accessToken || !editingPolicy?.policy_id) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updatePolicyVersionStatus(accessToken, editingPolicy.policy_id, "published");
      toast.success(translateUi("ui.0bb25fe3319ad3b2"));
      const list = await listPolicyVersions(accessToken, editingPolicy.policy_name ?? "");
      setVersions(list.versions ?? []);
      onVersionStatusUpdated?.(updated);
    } catch (error) {
      toast.fromError("Failed to publish: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePromoteToProduction = async () => {
    if (!accessToken || !editingPolicy?.policy_id) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updatePolicyVersionStatus(accessToken, editingPolicy.policy_id, "production");
      toast.success(translateUi("ui.b69291a1dbb3933d"));
      const list = await listPolicyVersions(accessToken, editingPolicy.policy_name ?? "");
      setVersions(list.versions ?? []);
      onVersionStatusUpdated?.(updated);
    } catch (error) {
      toast.fromError("Failed to promote to production: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSave = async () => {
    if (!policyName.trim()) {
      toast.error(translateUi("ui.9bf7673f42d3b819"));
      return;
    }
    if (!accessToken) {
      toast.error(translateUi("ui.86895250093a18e4"));
      return;
    }

    const emptySteps = pipeline.steps.filter((s) => !s.guardrail);
    if (emptySteps.length > 0) {
      toast.error(translateUi("ui.15b24dff55537d38"));
      return;
    }

    setIsSubmitting(true);
    try {
      const guardrailsFromPipeline = pipeline.steps.map((s) => s.guardrail).filter(Boolean);

      const data: PolicyCreateRequest | PolicyUpdateRequest = {
        policy_name: policyName,
        description: description || undefined,
        guardrails_add: guardrailsFromPipeline,
        guardrails_remove: [],
        pipeline: pipeline,
      };

      if (isEditing && editingPolicy) {
        await updatePolicy(accessToken, editingPolicy.policy_id, data as PolicyUpdateRequest);
        toast.success(translateUi("ui.90a491bd0bda0676"));
        onSuccess();
      } else {
        await createPolicy(accessToken, data as PolicyCreateRequest);
        toast.success(translateUi("ui.5ab1e5e029233089"));
        onSuccess();
        onBack();
      }
    } catch (error) {
      console.error("Failed to save policy:", error);
      toast.fromError("Failed to save policy: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-muted">
      {/* Header bar */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-card)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18, color: "var(--color-muted-foreground)" }} />
          </button>
          <span style={{ fontSize: 14, color: "var(--color-muted-foreground)" }}>{uiT("ui.d3ad1f1f8c9c")}</span>
          <span style={{ fontSize: 14, color: "var(--color-border)" }}>/</span>
          <Input
            placeholder={uiT("ui.97f534be5d14139b")}
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            disabled={isEditing}
            style={{ width: 240 }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: "color-mix(in oklab, var(--color-info) 10%, transparent)",
              color: "var(--color-info)",
              padding: "3px 8px",
              borderRadius: 4,
              letterSpacing: "0.02em",
            }}
          >
            {uiT("ui.f1273dc72c95d57e")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onBack}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button variant="secondary" onClick={() => setShowTestPanel(!showTestPanel)}>
            {showTestPanel ? uiT("ui.0e294ef522d7171d") : uiT("ui.9a4e3b0f7ccea8bb")}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isEditing ? uiT("ui.829fd2b15750a73f") : uiT("ui.06440082fecfdfb9")}
          </Button>
        </div>
      </div>

      {/* Description bar */}
      <div
        style={{
          padding: "8px 24px",
          backgroundColor: "var(--color-card)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <Input
          placeholder={uiT("ui.7fd5ddfaf37eb08f")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ maxWidth: 500 }}
        />
      </div>

      {/* Sidebar (when editing) + Flow builder canvas + test panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {showVersionsSidebar && (
          <PolicyVersionsSidebar
            policyName={policyName}
            editingPolicyId={editingPolicy?.policy_id ?? null}
            editingVersionStatus={editingPolicy?.version_status}
            accessToken={accessToken}
            versions={versions}
            isLoading={isVersionsLoading}
            isCreatingVersion={isCreatingVersion}
            isUpdatingStatus={isUpdatingStatus}
            onNewVersion={handleNewVersion}
            onSelectVersion={handleSelectVersion}
            onPublish={handlePublishVersion}
            onPromoteToProduction={handlePromoteToProduction}
          />
        )}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            padding: "32px 24px",
          }}
        >
          <div style={{ maxWidth: 760, width: "100%" }}>
            <PipelineFlowBuilder pipeline={pipeline} onChange={setPipeline} availableGuardrails={availableGuardrails} />
          </div>
        </div>

        {showTestPanel && (
          <PipelineTestPanel pipeline={pipeline} accessToken={accessToken} onClose={() => setShowTestPanel(false)} />
        )}
      </div>
    </div>
  );
};

export { createDefaultStep };
export default PipelineFlowBuilder;
