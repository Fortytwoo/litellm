"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import React from "react";

export const DEFAULT_ESCALATION_KEYWORDS = ["LITELLM ESCALATE"];

interface EscalationKeywordsProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

const EscalationKeywords: React.FC<EscalationKeywordsProps> = ({ keywords, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="w-full max-w-none">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="m-0 text-xl font-semibold text-foreground">{uiT("ui.bed538d7dd9bc498")}</h4>
        <SimpleTooltip content={uiT("ui.6c35b01c3a0bcecf")}>
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <span className="mb-2 block text-xs text-muted-foreground">{uiT("ui.89077f22278d4f74")}</span>
      <MultiSelect
        options={keywords.map((keyword) => ({ label: keyword, value: keyword }))}
        value={keywords}
        onValueChange={onChange}
        placeholder={uiT("ui.9f396729bf5d2629")}
        emptyText={uiT("ui.bf87caa3c0811954")}
        allowCustomValues
        className="w-full"
      />
    </div>
  );
};

export default EscalationKeywords;
