"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
/**
 * CollapsibleMessage - Collapsible message with arrow and char count
 * Used for system messages
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CollapsibleMessageProps {
  label: string;
  content?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleMessage({ label, content, defaultExpanded = false }: CollapsibleMessageProps) {
  const { t: uiT } = useDashboardLanguage();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const charCount = content?.length || 0;

  if (!content || charCount === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mb-2">
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded py-1 text-left transition-colors hover:bg-muted">
        {isExpanded ? (
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-[10px] uppercase tracking-[0.5px] text-muted-foreground">{roleLabel(label, uiT)}</span>
        <span className="text-[10px] text-muted-foreground">
          {uiT("supplement.characters", { count: charCount.toLocaleString() })}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent
        keepMounted
        className="mt-1 border-l border-border pl-4 text-[13px] leading-[1.7] break-words whitespace-pre-wrap text-foreground"
      >
        {content}
      </CollapsibleContent>
    </Collapsible>
  );
}

function roleLabel(label: string, translate: (key: string) => string): string {
  const role = label.toLowerCase();
  return ["user", "assistant", "system", "tool"].includes(role) ? translate("supplement." + role + "Role") : label;
}
