"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import CopyButton from "@/components/shared/CopyButton";

import { fieldEntries } from "../content/payload";
import { formatCost } from "../../list/AgentTracesTable";
import type { Span } from "../../types";
import { fmtMs, fmtTok } from "../../utils";
import { FieldTree } from "../content/FieldTree";
import { DetailGroup } from "./DetailGroup";
import { SpendLogLink, unmatchedReason } from "./SpendLogLink";

interface RequestTabProps {
  span: Span;
  accessToken: string;
  /** The run's start, so the request log is looked up at the span's time, whatever range the tabs show. */
  traceStartMs: number;
}

export function RequestTab({ span, accessToken, traceStartMs }: RequestTabProps) {
  const { t: uiT } = useDashboardLanguage();

  if (span.type !== "llm") {
    return <div className="py-16 text-center text-sm text-muted-foreground">{uiT("ui.799a643d81c2ac0e")}</div>;
  }

  const usage = fieldEntries([
    ["model", span.model ?? "—"],
    ["cost", span.spend == null ? "—" : formatCost(span.spend)],
    ["input_tokens", fmtTok(span.input_tokens)],
    ["output_tokens", fmtTok(span.output_tokens)],
    ["total_tokens", fmtTok(span.input_tokens + span.output_tokens)],
    ["latency", fmtMs(span.duration_ms)],
  ]);

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-5">
      <DetailGroup title={uiT("ui.8d59829c1e15")}>
        <FieldTree entries={usage} />
      </DetailGroup>
      <DetailGroup title={uiT("ui.78e702234b408fe0")}>
        <div className="flex flex-col gap-2 py-1.5">
          {span.spend_log_request_id && (
            <div className="flex min-w-0 items-center gap-1">
              <div className="min-w-0 flex-1">
                <FieldTree entries={fieldEntries([["request_id", span.spend_log_request_id]])} mono />
              </div>
              <CopyButton
                variant="action"
                value={span.spend_log_request_id}
                label={uiT("ui.e42a6a0a855f1ab2")}
                iconOnly
              />
            </div>
          )}
          <div className="self-start">
            <SpendLogLink span={span} accessToken={accessToken} traceStartMs={traceStartMs} />
          </div>
          {unmatchedReason(span) && <p className="text-sm text-muted-foreground">{unmatchedReason(span)}</p>}
        </div>
      </DetailGroup>
    </div>
  );
}
