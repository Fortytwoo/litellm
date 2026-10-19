"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

interface CloudZeroEmptyPlaceholderProps {
  startCreation: () => void;
}

export default function CloudZeroEmptyPlaceholder({ startCreation }: CloudZeroEmptyPlaceholderProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-dashed border-border bg-card p-12 text-center">
      <div className="flex flex-col items-center gap-2">
        <Inbox className="size-10 text-muted-foreground" aria-hidden />
        <h4 className="text-base font-semibold">{uiT("ui.2eb6214a151b5a70")}</h4>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{uiT("ui.b3d6f389317751d0")}</p>
        <Button size="lg" onClick={startCreation} className="mt-4">
          {uiT("ui.6628fc509e5631ce")}
        </Button>
      </div>
    </div>
  );
}
