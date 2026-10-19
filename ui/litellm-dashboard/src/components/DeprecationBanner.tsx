"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";

const DEPRECATION_DISCUSSION_URL = "https://github.com/BerriAI/litellm/discussions/32090";
const DEPRECATION_TARGET_DATE = "September 1, 2026";

interface DeprecationBannerProps {
  featureName: string;
}

export const DeprecationBanner: React.FC<DeprecationBannerProps> = ({ featureName }) => {
  const { t: uiT } = useDashboardLanguage();

  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{uiT("ui.dfb848fa8b8bd7d2", { v0: String(featureName) })}</p>
        <p className="mt-1 break-words text-muted-foreground">
          {uiT("ui.ea769f3fe374c2b6", { v0: String(featureName), v1: String(DEPRECATION_TARGET_DATE) })}
          <Link
            href={DEPRECATION_DISCUSSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {uiT("ui.5278988bdb981a5a")}
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        aria-label={uiT("ui.7d9eb7acb13e")}
        onClick={() => setIsClosed(true)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};
