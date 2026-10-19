"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { cx } from "@/lib/cva.config";
import { UiLoadingSpinner } from "../ui/ui-loading-spinner";

export default function LoadingScreen() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className={cx("h-screen", "flex items-center justify-center gap-4")}>
      <div className="text-lg font-medium py-2 pr-4 border-r border-r-gray-200">{uiT("ui.118fffb377c529a3")}</div>

      <div className="flex items-center justify-center gap-2">
        <UiLoadingSpinner className="size-4" />
        <span className="text-muted-foreground text-sm">{uiT("ui.47d2a515ef2f")}</span>
      </div>
    </div>
  );
}
