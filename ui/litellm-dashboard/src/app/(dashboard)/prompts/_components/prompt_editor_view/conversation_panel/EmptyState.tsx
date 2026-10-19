"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Bot } from "lucide-react";

interface EmptyStateProps {
  hasVariables: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasVariables }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <Bot className="mb-4 size-12" aria-hidden="true" />
      <span className="text-base">{hasVariables ? uiT("ui.f913490b2baca3ee") : uiT("ui.8bc048aea6b79654")}</span>
    </div>
  );
};

export default EmptyState;
