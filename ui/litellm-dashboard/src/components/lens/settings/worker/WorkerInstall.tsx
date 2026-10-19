"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import type { ComponentProps, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cva.config";
import { SettingsCard } from "../SettingsSection";

export type WorkerInstallProps = ComponentProps<"div"> & {
  connected: boolean;
  /** Rendered once the worker connects, in place of the install steps. */
  children: ReactNode;
};

export function WorkerInstall({ connected, children, className, ...props }: WorkerInstallProps) {
  const { t: uiT } = useDashboardLanguage();

  if (!connected)
    return (
      <SettingsCard {...props} data-slot="worker-install" className={cn("flex flex-col gap-5", className)}>
        <header className="space-y-1">
          <h3 className="text-base font-semibold">{uiT("ui.ce987265ac957fd8")}</h3>
          <p className="text-sm text-muted-foreground">{uiT("ui.2c78c85c0cf9e4c2")}</p>
        </header>
        <p role="status" className="text-sm text-muted-foreground">
          {uiT("ui.39661a31194530f9")}
        </p>
      </SettingsCard>
    );
  return (
    <SettingsCard
      {...props}
      data-slot="worker-install"
      className={cn("flex flex-col items-center gap-5 text-center", className)}
    >
      <header className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="text-base font-semibold">{uiT("ui.ef97ae2ac82650ff")}</h3>
        <p className="text-sm text-muted-foreground">{uiT("ui.aa1055c4c7f11efd")}</p>
      </header>
      {children}
    </SettingsCard>
  );
}
