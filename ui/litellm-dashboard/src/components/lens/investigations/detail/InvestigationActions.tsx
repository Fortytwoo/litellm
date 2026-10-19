"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Pause, Play, Settings2, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { hasActiveJob } from "../../model/status";
import { type Lens } from "../../model/types";

export interface InvestigationIntents {
  readonly onEdit: () => void;
  readonly onDuplicate: () => void;
  readonly onPause: () => void;
  readonly onEnableMonitoring: () => void;
  readonly onCancelRun: () => void;
  readonly onRunNow: () => void;
  readonly onConnectWorker: () => void;
}

export type InvestigationActionsProps = Omit<InvestigationIntents, "onCancelRun" | "onConnectWorker"> & {
  readonly lens: Lens;
  readonly ready: boolean;
  readonly busy: boolean;
};

export function InvestigationActions({
  lens,
  ready,
  busy,
  onEdit,
  onDuplicate,
  onPause,
  onEnableMonitoring,
  onRunNow,
}: InvestigationActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={uiT("ui.76a1fdb0b29e6341")} />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled={busy || hasActiveJob(lens.jobs) || !ready} onClick={onRunNow}>
          <Play />
          {uiT("ui.0991397702fabb40")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Settings2 />
          {uiT("ui.1cdde080223f387f")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!ready} onClick={onDuplicate}>
          <Copy />
          {uiT("ui.02cdaabfca805d6a")}
        </DropdownMenuItem>
        {lens.settings.enabled ? (
          <DropdownMenuItem disabled={busy} onClick={onPause}>
            <Pause />
            {uiT("ui.26d15b0178f26f45")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={!ready || busy} onClick={onEnableMonitoring}>
            <Play />
            {uiT("ui.8015a9029681f303")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
