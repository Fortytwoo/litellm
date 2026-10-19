"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { buttonVariants } from "@/components/ui/button";
import { getLoginUrl } from "@/utils/returnUrlUtils";

export function OnboardingErrorView() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert variant="error">
        <CircleAlert />
        <AlertTitle>{uiT("ui.88169fcbdb8d4ef9")}</AlertTitle>
        <AlertDescription>{uiT("ui.5ba67e3602fe6d1d")}</AlertDescription>
      </Alert>
      <div className="mt-4">
        <a href={getLoginUrl()} className={buttonVariants({ variant: "outline" })}>
          {uiT("ui.40c55c13690170c6")}
        </a>
      </div>
    </div>
  );
}
