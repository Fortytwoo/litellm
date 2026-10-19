"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
/**
 * OutputCard - Displays output message with token count and cost
 * Datadog-style: header with icon/metrics, content below
 */

import { useState } from "react";
import { toast } from "@/lib/toast";
import { COLOR_BORDER } from "./constants";
import { ParsedMessage } from "./prettyMessagesTypes";
import { SectionHeader } from "./SectionHeader";
import { SimpleMessageBlock } from "./SimpleMessageBlock";

interface OutputCardProps {
  message: ParsedMessage | null;
  completionTokens?: number;
  outputCost?: number;
}

export function OutputCard({ message, completionTokens, outputCost }: OutputCardProps) {
  const { t: uiT } = useDashboardLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    if (!message) return;

    navigator.clipboard.writeText(message.content || "");
    toast.success("Output copied");
  };

  return (
    <div className="overflow-hidden rounded-md" style={{ border: `1px solid ${COLOR_BORDER}` }}>
      <SectionHeader
        type="output"
        tokens={completionTokens}
        cost={outputCost}
        onCopy={handleCopy}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{ maxHeight: isCollapsed ? "0px" : "10000px", opacity: isCollapsed ? 0 : 1 }}
      >
        <div className="px-4 py-3">
          {message ? (
            <SimpleMessageBlock
              label={uiT("ui.ac1c297327ac")}
              content={message.content}
              toolCalls={message.toolCalls}
            />
          ) : (
            <span className="text-[13px] text-muted-foreground italic">{uiT("ui.545c815d18b7")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
