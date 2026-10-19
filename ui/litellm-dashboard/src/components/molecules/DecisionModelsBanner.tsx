"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { DECISIONS_DOCS_URL, DECISIONS_PROVIDERS_DOCS_URL, SYSTEM_ONE_PLAYGROUND_ROUTE } from "@/lib/decisionModels";
import { uiHref } from "@/utils/uiHref";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hideDecisionModelsBanner";

const DecisionModelsBanner: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  if (dismissed) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-4 rounded-lg border bg-muted/40 px-4 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-background">
        <Sparkles className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="m-0 text-sm font-semibold text-foreground">{uiT("ui.0dd3a43ed8f00bcc")}</h4>
        <p className="m-0 mt-0.5 text-xs text-muted-foreground">
          {uiT("ui.37c52bf6aa924831")} <code>/v1/decisions</code> {uiT("ui.7175517a370b5cd2")}{" "}
          <code>/v1/systemone</code>
          {uiT("ui.8370c9ff8afff348")}{" "}
          <a href={DECISIONS_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline">
            {uiT("ui.fb0b1fe59b19aa07")}
          </a>
        </p>
      </div>
      <Button
        variant="outline"
        className="shrink-0"
        nativeButton={false}
        role="link"
        render={<a href={DECISIONS_PROVIDERS_DOCS_URL} target="_blank" rel="noopener noreferrer" />}
      >
        {uiT("ui.a74c313ba65bb415")}
      </Button>
      <Button
        className="shrink-0"
        nativeButton={false}
        role="link"
        render={<a href={uiHref(SYSTEM_ONE_PLAYGROUND_ROUTE)} />}
      >
        {uiT("ui.4399457eb00bbe6d")}
        <ArrowRight />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setDismissed(true);
          localStorage.setItem(STORAGE_KEY, "true");
        }}
        className="shrink-0"
        aria-label={uiT("ui.ea8c089e16a3")}
      >
        <X />
      </Button>
    </div>
  );
};

export default DecisionModelsBanner;
