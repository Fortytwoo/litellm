"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import React from "react";

interface ResetFiltersButtonProps {
  onClick: () => void;
  label?: string;
}

export const ResetFiltersButton: React.FC<ResetFiltersButtonProps> = ({
  onClick,
  label = translateUi("ui.660f3d76f4f2"),
}) => {
  useDashboardLanguage();

  return (
    <Button variant="outline" onClick={onClick}>
      <RotateCcw className="size-4" />
      {label}
    </Button>
  );
};
