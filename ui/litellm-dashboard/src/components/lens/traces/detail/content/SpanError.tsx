"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useTracesApi } from "../../api";
import {
  classifyTraceReadFailure,
  isRetryableTraceRead,
  traceReadRetry,
  traceReadRetryDelay,
} from "../../list/traceReadFailure";
import type { ErrorSource } from "../../tree";
import type { Span, SpanErrorPage } from "../../types";
import { errorSource } from "../../utils";
import { TextBody } from "./PayloadBody";

const ERROR_SOURCE_LABEL: Record<ErrorSource, string> = {
  get tool() {
    return translateUi("ui.2e53bdcd0740867b");
  },
  get model() {
    return translateUi("ui.5e2c614c23f0");
  },
  get litellm() {
    return translateUi("ui.3d7d5271cbdb1a64");
  },
};
const TRACEBACK_MARKER = "Traceback (most recent call last):";

/** Exporters record `repr(exc)` + traceback with no separator; keep the exception line. */
export const errorHeadline = (error: string): string =>
  (error.split(TRACEBACK_MARKER, 1)[0].split("\n")[0] ?? "").trim() || error.trim();

/** `ValueError('x not found')` → "ValueError"; plain text → "error". */
const errorReason = (headline: string): string => /^([A-Za-z_][\w.]*)\(/.exec(headline)?.[1] ?? "error";

export function ErrorBlock({ span }: { span: Span }) {
  const { t: uiT } = useDashboardLanguage();

  const source = errorSource(span);
  if (!source) return null;
  const headline = errorHeadline(span.error ?? "") || "Span reported an error status.";
  return (
    <section
      aria-label={uiT("ui.54a0e8c17ebb")}
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-3.5 py-3"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <TriangleAlert className="size-4" />
        {ERROR_SOURCE_LABEL[source]} · {errorReason(headline)}
      </div>
      <pre className="mt-2 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
        {headline}
      </pre>
    </section>
  );
}

interface DiagnosticProps {
  accessToken: string;
  traceId: string;
  traceRef?: string;
  span: Span;
}

/** The full stored error, fetched only on request and paged section by section. */
export function StoredDiagnostic({ accessToken, traceId, traceRef, span }: DiagnosticProps) {
  const { t: uiT } = useDashboardLanguage();

  const traces = useTracesApi(accessToken);
  const [opened, setOpened] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const queryOptions: UseQueryOptions<SpanErrorPage, Error> = {
    queryKey: ["agentTraceSpanError", traceId, traceRef, span.span_id, accessToken, cursor],
    queryFn: () => traces.spanError(traceId, span.span_id, { traceRef, cursor }),
    enabled: opened,
    staleTime: Infinity,
    gcTime: 0,
    retry: traceReadRetry,
    retryDelay: traceReadRetryDelay,
  };
  const query = useQuery(queryOptions);
  const failure = query.error ? classifyTraceReadFailure(query.error) : null;
  return (
    <section aria-label={uiT("ui.13f1c1d22957d4b2")} className="flex flex-col items-start gap-2">
      {span.error_truncated && <p className="text-xs text-muted-foreground">{uiT("ui.788a6a4adf940f84")}</p>}
      {!opened && (
        <Button variant="outline" size="xs" onClick={() => setOpened(true)}>
          {uiT("ui.8125de8d430edead")}
        </Button>
      )}
      {opened && query.isPending && (
        <p role="status" className="text-xs text-muted-foreground">
          {uiT("ui.5e870ef616be3398")}
        </p>
      )}
      {failure && (
        <div role="alert" className="flex items-center gap-2 text-xs">
          {uiT("ui.7acae4187b3cef47")} {failure.message}
          {isRetryableTraceRead(failure) || !cursor ? (
            <Button variant="outline" size="xs" onClick={() => query.refetch()}>
              {uiT("ui.942087cc2d41e013")}
            </Button>
          ) : (
            <Button variant="outline" size="xs" onClick={() => setCursor(null)}>
              {uiT("ui.f2ee2f605eb19d85")}
            </Button>
          )}
        </div>
      )}
      {opened && query.data && (
        <>
          <div className="w-full">
            <TextBody text={query.data.message} format="code" />
          </div>
          <p className="text-xs text-muted-foreground">
            {cursor ? uiT("ui.29f1f4d5ed75d38c") : uiT("ui.9e6b4172e207e657")} {uiT("ui.a8164abe8ebe1523")}
            {query.data.total_chars.toLocaleString()} {uiT("ui.2b14e8028e610d5c")}
          </p>
          <div className="flex gap-2">
            {query.data.next_cursor && (
              <Button variant="outline" size="xs" onClick={() => setCursor(query.data.next_cursor)}>
                {uiT("ui.832f90363e606dc7")}
              </Button>
            )}
            {cursor && (
              <Button variant="outline" size="xs" onClick={() => setCursor(null)}>
                {uiT("ui.f2ee2f605eb19d85")}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
