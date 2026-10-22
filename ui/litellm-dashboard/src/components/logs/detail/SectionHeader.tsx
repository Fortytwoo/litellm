"use client";
import { formatMoney } from "@/utils/currency";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
/**
 * SectionHeader - Datadog-style header with icon, label, metrics, and copy
 */

import { ChevronDown, ChevronUp, Copy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cva.config";

interface SectionHeaderProps {
  type: "input" | "output";
  tokens?: number;
  cost?: number;
  onCopy: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  turnCount?: number;
}

const SUMMARY_CLASSES = "flex flex-1 items-center gap-4";

export function SectionHeader({
  type,
  tokens,
  cost,
  onCopy,
  isCollapsed,
  onToggleCollapse,
  turnCount,
}: SectionHeaderProps) {
  const { t: uiT } = useDashboardLanguage();

  const summary = (
    <>
      {onToggleCollapse &&
        (isCollapsed ? (
          <ChevronDown className="size-2.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="size-2.5 text-muted-foreground" />
        ))}

      <div className="flex items-center gap-2">
        {type === "input" ? (
          <MessageSquare className="size-3.5 text-muted-foreground" />
        ) : (
          <span className="text-sm opacity-60 grayscale">✨</span>
        )}
        <span className="text-sm font-medium">
          {type === "input" ? uiT("ui.36ecb4f86691") : uiT("ui.b2439bcb8dee")}
        </span>
      </div>

      {tokens !== undefined && (
        <span className="text-xs text-muted-foreground">
          {uiT("logs.tokensLabel", { tokens: tokens.toLocaleString() })}
        </span>
      )}

      {cost !== undefined && (
        <span className="text-xs text-muted-foreground">
          {uiT("ui.564970ae3734")}
          {formatMoney(cost, 6)}
        </span>
      )}

      {turnCount !== undefined && turnCount > 0 && (
        <span className="text-xs text-muted-foreground">{uiT("logs.turnsLabel", { turns: turnCount })}</span>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-muted px-4 py-2.5 transition-colors",
        isCollapsed ? "border-b-0" : "border-b border-border",
      )}
    >
      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
          className={cn(SUMMARY_CLASSES, "-mx-2 cursor-pointer rounded-md px-2 py-1 text-left hover:bg-accent")}
        >
          {summary}
        </button>
      ) : (
        <div className={SUMMARY_CLASSES}>{summary}</div>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={type === "input" ? uiT("ui.f5b9c167e606") : uiT("ui.8577c32cb26f")}
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            />
          }
        >
          <Copy />
        </TooltipTrigger>
        <TooltipContent>{uiT("ui.e21f935f11d7")}</TooltipContent>
      </Tooltip>
    </div>
  );
}
