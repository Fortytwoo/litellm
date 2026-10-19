"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React from "react";
import { TriangleAlert } from "lucide-react";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

const REDIS_DOCS_URL = "https://docs.litellm.ai/docs/proxy/redis_requirements";

interface NoRedisWarningBannerProps {
  accessToken: string | null;
}

export const NoRedisWarningBanner: React.FC<NoRedisWarningBannerProps> = ({ accessToken }) => {
  const { t: uiT } = useDashboardLanguage();

  const { data: healthData } = useHealthReadinessDetails(accessToken);

  if (!healthData?.show_no_redis_warning) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{uiT("ui.4078d653e808b1ed")}</p>
        <p>
          {uiT("ui.06540e91a8468cec")}{" "}
          <a className="underline" href={REDIS_DOCS_URL} target="_blank" rel="noreferrer">
            {uiT("ui.510041b735f4686a")}
          </a>
          {uiT("ui.d8e3b7c206b3ee75")} <code className="font-mono">LITELLM_DISABLE_NO_REDIS_WARNING=true</code>{" "}
          {uiT("ui.337bf13c2b0d9d86")}
        </p>
      </div>
    </div>
  );
};
