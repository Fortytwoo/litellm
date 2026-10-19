"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

export const AUTOROUTER_CLASSIFIER_ORIGIN = "autorouter_classifier";

export function ClassifyTag({ origin, className }: { origin?: string | null; className?: string }) {
  const { t: uiT } = useDashboardLanguage();

  if (origin !== AUTOROUTER_CLASSIFIER_ORIGIN) return null;
  return (
    <Badge
      variant="secondary"
      title={uiT("ui.f3291bb20aa4")}
      className={cn("px-2 py-0 text-[10px] font-normal", className)}
    >
      {uiT("ui.dabe0f6c6a45")}
    </Badge>
  );
}
