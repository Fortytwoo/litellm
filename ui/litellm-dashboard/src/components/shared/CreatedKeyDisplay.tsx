"use client";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

interface CreatedKeyDisplayProps {
  apiKey: string;
}

/**
 * Shared component for displaying a newly-created virtual key.
 * Used on the Virtual Keys page and in the Add Agent wizard.
 */
const CreatedKeyDisplay: React.FC<CreatedKeyDisplayProps> = ({ apiKey }) => {
  const { t: uiT } = useDashboardLanguage();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    toast.success(uiT("ui.340f5dc832f4"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="mb-2">
        {uiT("ui.db384fd2c5a9")} <b>{uiT("ui.178b8e9ce4bb")}</b> {uiT("ui.2b1286d3916d")}
      </p>

      <p className="text-sm text-muted-foreground mt-3 mb-1">{uiT("ui.e9576af27df1")}</p>
      <div className="bg-muted rounded-md p-2.5 mb-2.5">
        <pre className="m-0 whitespace-normal break-words text-foreground">{apiKey}</pre>
      </div>

      <CopyToClipboard text={apiKey} onCopy={handleCopy}>
        <Button className="mt-3">{copied ? uiT("ui.ea61bc15688d") : uiT("ui.7c0365ce2b23")}</Button>
      </CopyToClipboard>
    </div>
  );
};

export default CreatedKeyDisplay;
