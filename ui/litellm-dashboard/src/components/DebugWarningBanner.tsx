"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

interface DebugWarningBannerProps {
  accessToken: string | null;
}

export const DebugWarningBanner: React.FC<DebugWarningBannerProps> = ({ accessToken }) => {
  const { t: uiT } = useDashboardLanguage();

  const { data: healthData } = useHealthReadinessDetails(accessToken);

  // Only show banner if detailed debug mode is explicitly enabled
  if (!healthData?.is_detailed_debug) {
    return null;
  }

  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
      <TriangleAlert className="size-4" aria-hidden />
      <AlertTitle>{uiT("ui.f1d19b10ce563ee6")}</AlertTitle>
      <AlertDescription>
        {uiT("ui.90149bdbaae54dd0")}
        <code>LITELLM_LOG=DEBUG</code>
        {uiT("ui.15efaa483c99f6c8")}
      </AlertDescription>
    </Alert>
  );
};
