"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React from "react";

import { MemoryRow } from "@/components/networking";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MemoryDetailDrawerProps {
  row: MemoryRow | null;
  onClose: () => void;
}

const CODE_CLASS = "rounded-sm border border-border bg-muted px-1 py-0.5 font-mono text-xs text-foreground";
const BLOCK_CLASS = "mt-1 rounded-md bg-muted p-3 font-mono whitespace-pre-wrap text-foreground";
const LABEL_CLASS = "text-sm font-semibold text-foreground";

function formatTimestamp(ts?: string): string {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

export function MemoryDetailDrawer({ row, onClose }: MemoryDetailDrawerProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Sheet
      open={!!row}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:sm:w-[720px] data-[side=right]:sm:max-w-full">
        <SheetHeader className="border-b">
          <SheetTitle>{row ? <code className={CODE_CLASS}>{row.key}</code> : uiT("ui.c3963aedaac6")}</SheetTitle>
        </SheetHeader>
        {row && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <span className={`block ${LABEL_CLASS}`}>Memory ID</span>
                <code className={CODE_CLASS}>{row.memory_id}</code>
              </div>
              <div>
                <span className={`block ${LABEL_CLASS}`}>{uiT("ui.7967e089a7b9")}</span>
                <span className={row.user_id ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                  {row.user_id ?? "-"}
                </span>
              </div>
              <div>
                <span className={`block ${LABEL_CLASS}`}>{uiT("ui.fa2758a6173a")}</span>
                <span className={row.team_id ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                  {row.team_id ?? "-"}
                </span>
              </div>
            </div>
            <div>
              <span className={LABEL_CLASS}>Value</span>
              <p className={`${BLOCK_CLASS} text-[13px]`}>{row.value}</p>
            </div>
            {row.metadata !== undefined && row.metadata !== null && (
              <div>
                <span className={LABEL_CLASS}>{uiT("ui.9eddf573cb50")}</span>
                <p className={`${BLOCK_CLASS} text-xs`}>{JSON.stringify(row.metadata, null, 2)}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {uiT("ui.d70b9e24bca2")} {formatTimestamp(row.created_at)}
                {row.created_by ? ` by ${row.created_by}` : ""}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {uiT("ui.3a5ecca188c0")} {formatTimestamp(row.updated_at)}
                {row.updated_by ? ` by ${row.updated_by}` : ""}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default MemoryDetailDrawer;
