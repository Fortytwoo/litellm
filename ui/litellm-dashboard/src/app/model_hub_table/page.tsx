"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ModelHubTable from "@/components/AIHub/ModelHubTable";

function PublicModelHubTableContent() {
  const searchParams = useSearchParams()!;
  const key = searchParams.get("key");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      return;
    }
    setAccessToken(key);
  }, [key]);

  return (
    <ModelHubTable
      accessToken={accessToken}
      publicPage={true}
      premiumUser={false}
      userRole={null}
      canOpenPlayground={false}
    />
  );
}

export default function PublicModelHubTable() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{uiT("ui.47d2a515ef2f")}</div>}>
      <PublicModelHubTableContent />
    </Suspense>
  );
}
