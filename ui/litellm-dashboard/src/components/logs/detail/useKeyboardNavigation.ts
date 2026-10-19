"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useShortcut } from "@/components/shared/useShortcut";

import { LogEntry } from "../types";

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  currentLog: LogEntry | null;
  allLogs: LogEntry[];
  onClose: () => void;
  onSelectLog?: (log: LogEntry) => void;
}

/** J and K step through the open log's neighbours and Escape closes the drawer. */
export function useKeyboardNavigation({
  isOpen,
  currentLog,
  allLogs,
  onClose,
  onSelectLog,
}: UseKeyboardNavigationProps) {
  const { t: uiT } = useDashboardLanguage();

  const index = currentLog ? allLogs.findIndex((log) => log.request_id === currentLog.request_id) : -1;
  const selectAt = (next: number) => {
    const log = allLogs[next];
    if (currentLog && log) onSelectLog?.(log);
  };
  const selectNextLog = () => selectAt(index + 1);
  const selectPreviousLog = () => {
    if (index > 0) selectAt(index - 1);
  };
  const modal = { layer: "modal", enabled: isOpen } as const;
  useShortcut("escape", onClose, { ...modal, description: uiT("ui.310ff200149b44a3") });
  useShortcut("j", selectNextLog, { ...modal, description: uiT("ui.836ff184e7b41b1e") });
  useShortcut("k", selectPreviousLog, { ...modal, description: uiT("ui.836ff184e7b41b1e") });
  return { selectNextLog, selectPreviousLog };
}
