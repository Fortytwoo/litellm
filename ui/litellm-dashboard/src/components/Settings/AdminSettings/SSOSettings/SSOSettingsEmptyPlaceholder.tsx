"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SSOSettingsEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function SSOSettingsEmptyPlaceholder({ onAdd }: SSOSettingsEmptyPlaceholderProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex w-full flex-col items-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Shield className="size-6 text-muted-foreground" />
      </div>
      <h4 className="text-base font-semibold text-foreground">{uiT("ui.9245d6cab029390f")}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{uiT("ui.f872024e2dbf5fa0")}</p>
      <Button size="lg" onClick={onAdd} className="mt-4">
        {uiT("ui.80d3a144bdecbba3")}
      </Button>
    </div>
  );
}
