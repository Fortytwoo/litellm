"use client";
import { useUserDisplayLookup } from "@/app/(dashboard)/hooks/users/useUsers";
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
  const { data: userNames = {} } = useUserDisplayLookup(
    [row?.created_by, row?.updated_by].filter((id): id is string => Boolean(id)),
  );

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
                <span className={`block ${LABEL_CLASS}`}>{uiT("ui.56f76171dc6eeace")}</span>
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
              <span className={LABEL_CLASS}>{uiT("ui.8e37953d23daca5f")}</span>
              <p className={`${BLOCK_CLASS} text-[13px]`}>{row.value}</p>
            </div>
            {row.metadata !== undefined && row.metadata !== null && (
              <div>
                <span className={LABEL_CLASS}>{uiT("ui.9eddf573cb50")}</span>
                <p className={`${BLOCK_CLASS} text-xs`}>{JSON.stringify(row.metadata, null, 2)}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span title={row.created_by || undefined}>
                {uiT("ui.d70b9e24bca2")} {formatTimestamp(row.created_at)}
                {row.created_by ? uiT("ui.c66bf4d522a7d8fc", { v0: userNames[row.created_by] || row.created_by }) : ""}
              </span>
              <span aria-hidden="true">·</span>
              <span title={row.updated_by || undefined}>
                {uiT("ui.3a5ecca188c0")} {formatTimestamp(row.updated_at)}
                {row.updated_by ? uiT("ui.c66bf4d522a7d8fc", { v0: userNames[row.updated_by] || row.updated_by }) : ""}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default MemoryDetailDrawer;
