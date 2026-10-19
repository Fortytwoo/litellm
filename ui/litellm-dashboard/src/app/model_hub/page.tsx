"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PublicModelHubPage from "@/components/public_model_hub";

function PublicModelHubContent() {
  const searchParams = useSearchParams()!;
  const key = searchParams.get("key");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      return;
    }
    setAccessToken(key);
  }, [key]);

  return <PublicModelHubPage accessToken={accessToken} />;
}

export default function PublicModelHub() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{uiT("ui.47d2a515ef2f")}</div>}>
      <PublicModelHubContent />
    </Suspense>
  );
}
