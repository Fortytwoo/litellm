"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";

import { isRetryableTraceRead, type TraceReadFailure } from "../../list/traceReadFailure";

interface PagingBannerProps {
  readonly loaded: number;
  readonly total: number;
  readonly failure: TraceReadFailure | null;
  readonly busy: boolean;
  readonly onLoadMore: () => void;
  readonly onRefresh: () => void;
}

/** What the loaded steps are still worth after a later page fails, and what the user can do about it. */
function pageFailureMessage(failure: TraceReadFailure): string {
  switch (failure.kind) {
    case "changed":
      return "This trace changed while you were browsing. Refresh to continue from its latest steps.";
    case "invalid":
      return "This page could not be continued. Refresh the trace to start over.";
    case "too_large":
      return "A step on the next page is too large to load here. Your loaded steps are still available.";
    case "unavailable":
    case "unknown":
      return "Could not load more steps. Your loaded steps are still available.";
  }
}

/**
 * Progress through the steps, or what the loaded steps are still worth after a later page failed.
 * Retry keeps the loaded pages and asks for the same page again; Refresh starts a new traversal.
 * Only a temporary failure gets a Retry, because a changed, invalid, or oversized read fails the
 * same way every time.
 */
export function PagingBanner({ loaded, total, failure, busy, onLoadMore, onRefresh }: PagingBannerProps) {
  const { t: uiT } = useDashboardLanguage();

  const retryable = failure !== null && isRetryableTraceRead(failure);
  const nextLabel = failure ? "Retry" : "Load more steps";
  return (
    <div
      className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground"
      role="status"
    >
      <span>
        {failure
          ? pageFailureMessage(failure)
          : uiT("ui.3ac65bd69a773862", { v0: String(loaded.toLocaleString()), v1: String(total.toLocaleString()) })}
      </span>
      <span className="flex items-center gap-2">
        {failure && (
          <Button size="xs" variant={retryable ? "ghost" : "outline"} disabled={busy} onClick={onRefresh}>
            {uiT("ui.7b24cfd99e307478")}
          </Button>
        )}
        {(!failure || retryable) && (
          <Button size="xs" variant="outline" disabled={busy} onClick={onLoadMore}>
            {busy ? uiT("ui.ba3bbbe10d8b") : nextLabel}
          </Button>
        )}
      </span>
    </div>
  );
}
