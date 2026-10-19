"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { UiLoadingSpinner } from "../ui/ui-loading-spinner";

interface ChartLoaderProps {
  isDateChanging?: boolean;
}

export const ChartLoader: React.FC<ChartLoaderProps> = ({ isDateChanging = false }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="flex items-center justify-center h-40">
      <div className="flex items-center justify-center gap-3">
        <UiLoadingSpinner className="size-5" />
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm font-medium">
            {isDateChanging ? uiT("ui.0d86add108d6") : uiT("ui.ebb949c33349")}
          </span>
          <span className="text-muted-foreground text-xs mt-1">
            {isDateChanging ? uiT("ui.5fc13833f9b7") : uiT("ui.491118de3cf1")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartLoader;
