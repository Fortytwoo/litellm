"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { useDisableShowPrompts } from "@/app/(dashboard)/hooks/useDisableShowPrompts";
import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cva.config";
import { Github, Slack } from "lucide-react";
import React from "react";

const COMMUNITY_LINKS = [
  {
    href: "https://www.litellm.ai/support",
    get label() {
      return translateUi("ui.033266fbae5e96f8");
    },
    get tooltip() {
      return translateUi("ui.804692a53897444d");
    },
    Icon: Slack,
  },
  {
    href: "https://github.com/BerriAI/litellm",
    get label() {
      return translateUi("ui.576ff4b9f9be9924");
    },
    get tooltip() {
      return translateUi("ui.576ff4b9f9be9924");
    },
    Icon: Github,
  },
] as const;

export const CommunityEngagementButtons: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const disableShowPrompts = useDisableShowPrompts();

  if (disableShowPrompts) {
    return null;
  }

  return (
    <TooltipProvider>
      <ButtonGroup aria-label={uiT("ui.5edfe472e2ffb7d2")}>
        {COMMUNITY_LINKS.map(({ href, label, tooltip, Icon }) => (
          <Tooltip key={href}>
            <TooltipTrigger
              render={
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "text-muted-foreground")}
                />
              }
            >
              <Icon />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </ButtonGroup>
    </TooltipProvider>
  );
};
