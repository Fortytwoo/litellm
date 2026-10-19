"use client";
import { t as translateUi } from "@/i18n";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Copy, Info } from "lucide-react";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionManagementProps {
  endpointType: string | null;
  responsesSessionId: string | null;
  useApiSessionManagement: boolean;
  onToggleSessionManagement: (useApi: boolean) => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  endpointType,
  responsesSessionId,
  useApiSessionManagement,
  onToggleSessionManagement,
}) => {
  const { t: uiT } = useDashboardLanguage();

  if (endpointType !== EndpointType.RESPONSES) {
    return null;
  }

  const handleCopySessionId = async () => {
    if (responsesSessionId) {
      try {
        await navigator.clipboard.writeText(responsesSessionId);
        toast.success(translateUi("ui.1649ce97e28e904f"));
      } catch {
        toast.error(translateUi("ui.f942924062e17908"));
      }
    }
  };

  const getSessionDisplay = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement ? "API Session: Ready" : "UI Session: Ready";
    }

    const sessionPrefix = useApiSessionManagement ? "Response ID" : "UI Session";
    const truncatedId = responsesSessionId.slice(0, 10);
    return `${sessionPrefix}: ${truncatedId}...`;
  };

  const getSessionDescription = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement
        ? "LiteLLM will manage session using previous_response_id"
        : "UI will manage session using chat history";
    }

    return useApiSessionManagement
      ? "LiteLLM API session active - context maintained server-side"
      : "UI session active - context maintained client-side";
  };

  return (
    <div className="mb-4">
      {/* Session Management Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{uiT("ui.38a42323df983de6")}</span>
          <Tooltip>
            <TooltipTrigger aria-label={uiT("ui.d592a1999924646e")}>
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{uiT("ui.22cc13f25c1b2343")}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">{uiT("ui.7c32699ff595e13b")}</span>
          <Switch
            checked={useApiSessionManagement}
            onCheckedChange={onToggleSessionManagement}
            aria-label={uiT("ui.7a74a7881367b5aa")}
            size="sm"
          />
          <span aria-hidden="true">API</span>
        </div>
      </div>

      {/* Session Status Indicator */}
      <div
        className={`text-xs p-2 rounded-md ${
          responsesSessionId
            ? "bg-success/10 text-success border border-success/20"
            : "bg-info/10 text-info border border-info/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Info className="size-3" />
            {getSessionDisplay()}
          </div>
          {responsesSessionId && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopySessionId}
                    aria-label={uiT("ui.9130af7c2e441213")}
                    className="ml-2 hover:bg-success/15"
                  />
                }
              >
                <Copy className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                <div className="text-xs">
                  <div className="mb-1">{uiT("ui.35caf32cc6596efd")}</div>
                  <div className="bg-gray-800 text-gray-100 p-2 rounded-sm font-mono text-xs whitespace-pre-wrap">
                    {translateUi("ui.43251923214c661a", undefined, { v0: String(responsesSessionId) })}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">{translateText(getSessionDescription())}</div>
      </div>
    </div>
  );
};

export default SessionManagement;
