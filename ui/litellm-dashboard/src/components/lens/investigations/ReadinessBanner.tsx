"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import type { ComponentProps } from "react";
import { uiHref } from "@/utils/uiHref";
import { cn } from "@/lib/cva.config";

export type ReadinessBannerProps = ComponentProps<"div"> & { activityReady: boolean };

export function ReadinessBanner({ activityReady, className, ...props }: ReadinessBannerProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div
      {...props}
      data-slot="readiness-banner"
      role="status"
      className={cn("flex flex-wrap items-center gap-2 border-y py-3 text-sm text-muted-foreground", className)}
    >
      {activityReady ? uiT("ui.1f1b3f0e23ec4a13") : uiT("ui.cb9591cc3d4609da")}
      {!activityReady && (
        <a className="font-medium underline" href={uiHref("lens/?tab=traces")}>
          {uiT("ui.e28240a2ad8dd34d")}
        </a>
      )}
    </div>
  );
}
