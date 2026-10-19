"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingForm } from "./OnboardingForm";

function OnboardingContent() {
  const searchParams = useSearchParams()!;
  const action = searchParams.get("action");
  const variant = action === "reset_password" ? "reset_password" : "signup";
  return <OnboardingForm variant={variant} />;
}

export default function Onboarding() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{uiT("ui.47d2a515ef2f")}</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
