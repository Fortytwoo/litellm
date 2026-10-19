"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";

export interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggle({ isCollapsed, onToggle, className }: SidebarToggleProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      className={cn("shrink-0 bg-card! border! border-border! rounded-md!", className)}
      aria-label={isCollapsed ? uiT("ui.80fe9f94b77c") : uiT("ui.9609a1c44e1f")}
    >
      {isCollapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
    </Button>
  );
}
