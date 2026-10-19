"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { Aperture, ArrowUpRight } from "lucide-react";
import { useState } from "react";

import litellmMonogram from "../../../../../../public/assets/logos/litellm_monogram.svg";
import { Button } from "@/components/ui/button";

import { LogDetailsDrawer } from "../../../../logs/detail";
import { formatCost } from "../../list/AgentTracesTable";
import type { Span } from "../../types";
import { useSpanRequestLog } from "../useSpanRequestLog";

const UNMATCHED_REASON: Record<Exclude<NonNullable<Span["spend_match"]>, "matched">, string> = {
  no_call_id: "This step records no usable call identifier or transport context",
  no_spend_log: "No matching spend log belongs to this run",
  incomplete_evidence: "This step does not account for every request in the call",
  ambiguous: "Recorded identifiers do not select one compatible spend log",
};

const LENS_TRACE = {
  get label() {
    return translateUi("ui.dbb15cd3aca89369");
  },
  icon: <Aperture aria-hidden />,
};

export const unmatchedReason = (span: Span): string | null =>
  span.spend_match && span.spend_match !== "matched" ? UNMATCHED_REASON[span.spend_match] : null;

export function SpendLogLink({
  span,
  accessToken,
  traceStartMs,
}: {
  span: Span;
  accessToken: string;
  traceStartMs: number;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [open, setOpen] = useState(false);
  const requestId = span.spend_log_request_id ?? null;
  const logQuery = useSpanRequestLog(accessToken, requestId, traceStartMs + span.start_offset_ms, open);
  const reason = unmatchedReason(span);

  if (requestId == null) {
    if (!reason) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={reason}>
        {uiT("ui.204a5eb2cd28")} <span className="font-medium text-foreground">{uiT("ui.32dd83c99484d9a5")}</span>
      </span>
    );
  }

  const missing = open && logQuery.isSuccess && logQuery.data === null;
  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onClick={() => setOpen(true)}
        title={requestId}
        aria-label={uiT("ui.dc9d20cf407333b5", { v0: String(requestId) })}
        className="tabular-nums active:scale-[0.97] motion-reduce:transition-none"
      >
        <img src={litellmMonogram.src} alt="" aria-hidden className="size-3.5" />
        <span className="font-medium">{uiT("ui.572467803502d298")}</span>
        {span.spend != null && <span className="text-muted-foreground">{formatCost(span.spend)}</span>}
        <ArrowUpRight data-icon="inline-end" />
      </Button>
      {missing && <span className="text-xs text-muted-foreground">{uiT("ui.91e62269d7dfe9b4")}</span>}
      <LogDetailsDrawer
        open={open && Boolean(logQuery.data)}
        onClose={() => setOpen(false)}
        logEntry={logQuery.data ?? null}
        accessToken={accessToken}
        backTo={LENS_TRACE}
      />
    </>
  );
}
