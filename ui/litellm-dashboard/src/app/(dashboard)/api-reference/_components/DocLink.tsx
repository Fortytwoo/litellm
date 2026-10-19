"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/cva.config";

export type DocLinkProps = {
  href?: string;
  className?: string;
};

const DocLink = ({ href, className }: DocLinkProps) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={uiT("ui.40898560936030f7")}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-medium text-foreground shadow-xs",
        "hover:bg-card focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring active:translate-y-[0.5px]",
        className,
      )}
    >
      <span>{uiT("ui.f7f5339feecfcb10")}</span>
      <ExternalLink aria-hidden className="h-4 w-4 opacity-80" />
      <span className="sr-only">{uiT("ui.1d1833565142090c")}</span>
    </a>
  );
};

export default DocLink;
