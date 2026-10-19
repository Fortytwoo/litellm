"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { ArrowUpRight, SearchX, TriangleAlert } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { StateMessage } from "@/components/shared/StateMessage";
import { Button, buttonVariants } from "@/components/ui/button";

import { ApiError } from "@/lib/http/client";

const DOCS_URL = "https://docs.litellm.ai/docs/proxy/lens";

function DocsLink() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <a
      href={DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      {uiT("ui.1286b45b4289ef2b")}
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </a>
  );
}

function loadFailureMessage(queryError: unknown, unavailable: boolean): string {
  if (unavailable)
    return "This dashboard may be newer than the proxy. Reload the page, and if it persists, check the proxy deployment.";
  if (queryError instanceof Error) return queryError.message;
  return "Something went wrong while contacting the proxy.";
}

export function InvestigationsLoadFailed({ queryError, refresh }: { queryError: unknown; refresh: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  const unavailable = queryError instanceof ApiError && queryError.status === 404;
  return (
    <StateMessage
      role="alert"
      tone="destructive"
      icon={<TriangleAlert className="size-5" />}
      title={unavailable ? uiT("ui.712985fa0cc6a0e8") : uiT("ui.4c4f4d3e780a77f2")}
      description={loadFailureMessage(queryError, unavailable)}
    >
      <Button size="sm" onClick={() => (unavailable ? window.location.reload() : refresh())}>
        {unavailable ? uiT("ui.437d0d63bfbd9732") : uiT("ui.d8b8392e2c542950")}
      </Button>
      <DocsLink />
    </StateMessage>
  );
}

export function InvestigationError({ message, refresh }: { message: string; refresh: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      <span className="min-w-0">{message}</span>
      <Button variant="ghost" size="sm" onClick={refresh}>
        {uiT("ui.942087cc2d41e013")}
      </Button>
    </div>
  );
}

export function InvestigationsLoading() {
  const { t: uiT } = useDashboardLanguage();

  return <LoadingState title={uiT("ui.c08f7f273262eeaf")} description={uiT("ui.5245c8b433aee62e")} />;
}

export function InvestigationMissing({ selectLens }: { selectLens: (id: string | null) => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <StateMessage
      role="alert"
      icon={<SearchX className="size-5" />}
      title={uiT("ui.08979793aee548b0")}
      description={uiT("ui.5271d3f028533342")}
    >
      <Button size="sm" onClick={() => selectLens(null)}>
        {uiT("ui.1236f00c3d1bc31f")}
      </Button>
    </StateMessage>
  );
}
