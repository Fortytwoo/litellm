"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React from "react";

interface AdminOnlyNoticeProps {
  pageTitle: string;
}

export const AdminOnlyNotice: React.FC<AdminOnlyNoticeProps> = ({ pageTitle }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="p-6 w-full min-w-0 flex-1">
      <h1 className="text-2xl font-semibold text-foreground mb-2">{pageTitle}</h1>
      <p className="text-sm text-muted-foreground">
        {pageTitle} {uiT("ui.134e6634fb23")}
      </p>
    </div>
  );
};
