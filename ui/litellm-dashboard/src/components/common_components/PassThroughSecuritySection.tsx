"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface PassThroughSecuritySectionProps {
  premiumUser: boolean;
  authEnabled: boolean;
  onAuthChange: (checked: boolean) => void;
}

const PassThroughSecuritySection: React.FC<PassThroughSecuritySectionProps> = ({
  premiumUser,
  authEnabled,
  onAuthChange,
}) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Card className="block p-6">
      <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.8f6fb4eb7f42c0e2")}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{uiT("ui.c294c1a465f5f0fb")}</p>
      {premiumUser ? (
        <Switch checked={authEnabled} onCheckedChange={onAuthChange} />
      ) : (
        <div>
          <div className="mb-3 flex items-center">
            <Switch disabled checked={false} />
            <span className="ml-2 text-sm text-muted-foreground">{uiT("ui.38f95534c7410f0b")}</span>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
            <p className="text-sm text-warning">
              {uiT("ui.5ad54d0da9edc1eb")}{" "}
              <a href="https://www.litellm.ai/#pricing" target="_blank" rel="noopener noreferrer" className="underline">
                {uiT("ui.fcec91509759ad99")}
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PassThroughSecuritySection;
