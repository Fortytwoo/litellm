"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { KeyRound } from "lucide-react";
import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentVirtualKeysProps {
  keys: KeyResponse[];
  isLoading: boolean;
  onKeyClick: (key: KeyResponse) => void;
}

const AgentVirtualKeys: React.FC<AgentVirtualKeysProps> = ({ keys, isLoading, onKeyClick }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="mt-6">
      <h4 className="text-base font-semibold text-foreground">{uiT("ui.d1c0ad6c4bdd")}</h4>
      {isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">{uiT("ui.e0c65255e48f")}</p>
      ) : keys.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{uiT("ui.831a31a19864de83")}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {keys.map((key) => (
            <div key={key.token} className="flex items-center gap-3 rounded-sm border border-border px-3 py-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{key.key_alias || uiT("ui.ff75eadaa830f082")}</span>
              {key.key_name && <span className="font-mono text-xs text-muted-foreground">{key.key_name}</span>}
              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="link" size="sm" className="ml-auto font-mono" onClick={() => onKeyClick(key)}>
                        {key.token?.slice(0, 12)}...
                      </Button>
                    }
                  />
                  <TooltipContent>{key.token}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentVirtualKeys;
