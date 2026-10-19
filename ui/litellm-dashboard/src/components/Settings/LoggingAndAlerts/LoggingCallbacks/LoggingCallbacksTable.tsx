"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Inbox, Plus } from "lucide-react";
import React, { useMemo } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";

import {
  AvailableCallbacks,
  CallbackRow,
  callbackRowMode,
  getLoggingCallbacksTableColumns,
} from "./LoggingCallbacksTableColumns";
import { AlertingObject } from "./types";

type LoggingCallbacksProps = {
  callbacks: AlertingObject[];
  availableCallbacks?: AvailableCallbacks;
  isLoading?: boolean;
  onTest?: (callback: AlertingObject) => void | Promise<void>;
  onEdit?: (callback: AlertingObject) => void;
  onDelete?: (callback: AlertingObject) => void;
  onAdd?: () => void;
};

function EmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.1fc5a09e1a907637")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.c0053d7dd39fb62d")}</div>
    </div>
  );
}

export const LoggingCallbacksTable: React.FC<LoggingCallbacksProps> = ({
  callbacks,
  availableCallbacks = {},
  isLoading = false,
  onTest = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onAdd = () => {},
}) => {
  const { t: uiT } = useDashboardLanguage();

  const columns = useMemo(() => {
    const deps = { availableCallbacks, onTest, onEdit, onDelete };
    return getLoggingCallbacksTableColumns(deps);
  }, [availableCallbacks, onTest, onEdit, onDelete]);

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{uiT("ui.6d69be8c30004269")}</h3>
      <div>
        <Button onClick={onAdd}>
          <Plus />
          {uiT("ui.46b3900d24541a88")}
        </Button>
      </div>
      <DataTable
        data={callbacks as CallbackRow[]}
        columns={columns}
        getRowId={(callback, index) => `${callback.name || index}-${callbackRowMode(callback)}`}
        isLoading={isLoading}
        loadingMessage={uiT("ui.324383b6b6574a01")}
        noDataMessage={<EmptyState />}
        size="compact"
      />
    </div>
  );
};
