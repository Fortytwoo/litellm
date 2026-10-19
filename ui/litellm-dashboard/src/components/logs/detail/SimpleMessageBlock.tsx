/**
 * SimpleMessageBlock - Simple message display without collapsing
 * Used for messages in tree view and last user message
 */

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/cva.config";
import { ToolCall } from "./prettyMessagesTypes";
import { SimpleToolCallBlock } from "./SimpleToolCallBlock";

interface SimpleMessageBlockProps {
  label: string;
  content?: string;
  toolCalls?: ToolCall[];
  isCompact?: boolean;
}

export function SimpleMessageBlock({ label, content, toolCalls, isCompact = false }: SimpleMessageBlockProps) {
  const { t: uiT } = useDashboardLanguage();
  // Don't show "null" for empty content
  const displayContent = content && content !== "null" && content.length > 0 ? content : null;
  const hasToolCalls = toolCalls && toolCalls.length > 0;

  // If no content and no tool calls, don't render
  if (!displayContent && !hasToolCalls) {
    return null;
  }

  return (
    <div className={cn(isCompact && "mb-2")}>
      <span className="mb-[3px] block text-[10px] uppercase tracking-[0.5px] text-muted-foreground">
        {roleLabel(label, uiT)}
      </span>

      {displayContent && (
        <div
          className={cn(
            "whitespace-pre-wrap break-words text-[13px] leading-[1.7] text-foreground",
            hasToolCalls && "mb-1.5",
          )}
        >
          {displayContent}
        </div>
      )}

      {/* Inline tool calls for assistant messages in history */}
      {hasToolCalls && (
        <div>
          {toolCalls.map((tc, index) => (
            <SimpleToolCallBlock key={tc.id || index} tool={tc} compact={isCompact} />
          ))}
        </div>
      )}
    </div>
  );
}

function roleLabel(label: string, translate: (key: string) => string): string {
  const role = label.toLowerCase();
  return ["user", "assistant", "system", "tool"].includes(role) ? translate("supplement." + role + "Role") : label;
}
