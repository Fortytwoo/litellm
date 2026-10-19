"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CyberArkEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function CyberArkEmptyPlaceholder({ onAdd }: CyberArkEmptyPlaceholderProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex w-full flex-col items-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <KeyRound className="size-6 text-muted-foreground" />
      </div>
      <h4 className="text-base font-semibold text-foreground">{uiT("ui.c57c343c2a0acad3")}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{uiT("ui.7bd107b87e1aaed3")}</p>
      <Button size="lg" onClick={onAdd} className="mt-4">
        {uiT("ui.e2968b48fcc352df")}
      </Button>
    </div>
  );
}
