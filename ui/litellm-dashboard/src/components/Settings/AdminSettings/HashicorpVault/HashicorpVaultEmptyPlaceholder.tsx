"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HashicorpVaultEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function HashicorpVaultEmptyPlaceholder({ onAdd }: HashicorpVaultEmptyPlaceholderProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex w-full flex-col items-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <KeyRound className="size-6 text-muted-foreground" />
      </div>
      <h4 className="text-base font-semibold text-foreground">{uiT("ui.a004b7e480a6eb41")}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{uiT("ui.0f70f09191e0d816")}</p>
      <Button size="lg" onClick={onAdd} className="mt-4">
        {uiT("ui.9bea81f16e1e8b2c")}
      </Button>
    </div>
  );
}
