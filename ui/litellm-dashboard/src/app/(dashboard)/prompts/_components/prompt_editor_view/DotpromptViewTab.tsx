"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { PromptType } from "./types";
import { convertToDotPrompt } from "./utils";

interface DotpromptViewTabProps {
  prompt: PromptType;
}

const DotpromptViewTab: React.FC<DotpromptViewTabProps> = ({ prompt }) => {
  const { t: uiT } = useDashboardLanguage();

  const dotpromptContent = convertToDotPrompt(prompt);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground mb-2">{uiT("ui.66dac32fa2c819e3")}</h3>
        <p className="text-xs text-muted-foreground">{uiT("ui.ac3e2049a92baa15")}</p>
      </div>
      <div className="bg-muted border border-border rounded-lg p-4 overflow-auto">
        <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">{dotpromptContent}</pre>
      </div>
    </div>
  );
};

export default DotpromptViewTab;
