"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";

interface VariableWarningProps {
  extractedVariables: string[];
  variables: Record<string, string>;
}

const VariableWarning: React.FC<VariableWarningProps> = ({ extractedVariables, variables }) => {
  const { t: uiT } = useDashboardLanguage();

  const missingVariables = extractedVariables.filter(
    (varName) => !variables[varName] || variables[varName].trim() === "",
  );

  if (missingVariables.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-warning text-sm">⚠️</span>
        <div className="flex-1">
          <p className="text-sm text-warning font-medium mb-1">{uiT("ui.2fc4cc711de4cb38")}</p>
          <p className="text-xs text-warning">
            {uiT("ui.10c4b48e0b09a118")} {missingVariables.map((varName) => `{{${varName}}}`).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VariableWarning;
