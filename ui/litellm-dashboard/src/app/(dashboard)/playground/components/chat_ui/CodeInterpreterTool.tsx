"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { toast } from "@/lib/toast";
import { Code, Info, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CodeInterpreterToolProps {
  accessToken: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedContainerId: string | null;
  onContainerChange: (containerId: string | null) => void;
  selectedModel: string;
  disabled?: boolean;
}

const GITHUB_FEATURE_REQUEST_URL = "https://github.com/BerriAI/litellm/issues/new?template=feature_request.yml";

const isOpenAIModel = (model: string): boolean => {
  if (!model) return false;
  const lowerModel = model.toLowerCase();
  return (
    lowerModel.startsWith("openai/") ||
    lowerModel.startsWith("gpt-") ||
    lowerModel.startsWith("o1") ||
    lowerModel.startsWith("o3") ||
    lowerModel.includes("openai")
  );
};

const CodeInterpreterTool: React.FC<CodeInterpreterToolProps> = ({
  enabled,
  onEnabledChange,
  selectedModel,
  disabled = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const isOpenAI = isOpenAIModel(selectedModel);
  const isDisabled = disabled || !isOpenAI;

  const handleToggle = (checked: boolean) => {
    if (checked && !isOpenAI) {
      toast.warning(translateUi("ui.103a2f31ee7d899e"));
      return;
    }
    onEnabledChange(checked);
  };

  return (
    <div className="border border-border rounded-lg p-3 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-info" />
          <span className="font-medium text-foreground">{uiT("ui.730d813367179dfd")}</span>
          <Tooltip>
            <TooltipTrigger aria-label={uiT("ui.3052ddf1b538b109")}>
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{uiT("ui.464ac6909b7d44ee")}</TooltipContent>
          </Tooltip>
        </div>
        <Switch
          checked={enabled && isOpenAI}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
          size="sm"
          aria-label={uiT("ui.71873efa24624ac8")}
        />
      </div>

      {!isOpenAI && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="text-xs text-muted-foreground">
              <span>{uiT("ui.0db47cd3e5f52b8b")} </span>
              <a
                href={GITHUB_FEATURE_REQUEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:text-info/80 underline"
              >
                {uiT("ui.eedf2691b0c91a3f")}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeInterpreterTool;
