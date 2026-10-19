"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { SortingState } from "@tanstack/react-table";
import { Inbox } from "lucide-react";
import React, { useMemo, useState } from "react";

import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";
import { isProxyAdminRole } from "@/utils/roles";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { ModelAccessGroup, useModelAccessGroups } from "@/app/(dashboard)/hooks/modelAccessGroups/useModelAccessGroups";
import { useDeleteModelAccessGroupBudget } from "@/app/(dashboard)/hooks/modelAccessGroups/useDeleteModelAccessGroupBudget";
import {
  SetModelAccessGroupBudgetParams,
  useSetModelAccessGroupBudget,
} from "@/app/(dashboard)/hooks/modelAccessGroups/useSetModelAccessGroupBudget";
import AccessGroupBudgetModal from "@/app/(dashboard)/models-and-endpoints/components/AccessGroupBudgetModal";
import { getAccessGroupBudgetColumns } from "@/app/(dashboard)/models-and-endpoints/components/AccessGroupBudgetColumns";

const DEFAULT_SORTING: SortingState = [{ id: "access_group", desc: false }];

function EmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.e207d76b9a206e88")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.5bd5a305f293d9a4")}</div>
    </div>
  );
}

export default function AccessGroupBudgetsPanel() {
  const { t: uiT } = useDashboardLanguage();

  const { userRole } = useAuthorized();
  const { data: accessGroups, isLoading } = useModelAccessGroups();
  const setBudget = useSetModelAccessGroupBudget();
  const clearBudget = useDeleteModelAccessGroupBudget();

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [editing, setEditing] = useState<ModelAccessGroup | null>(null);
  const [clearing, setClearing] = useState<ModelAccessGroup | null>(null);

  const canWrite = isProxyAdminRole(userRole ?? "");
  const columns = useMemo(
    () => getAccessGroupBudgetColumns({ canWrite, onSetBudget: setEditing, onClearBudget: setClearing }),
    [canWrite],
  );

  const handleSubmit = (params: SetModelAccessGroupBudgetParams) => {
    if (!editing) return;
    const accessGroup = editing.access_group;
    setBudget.mutate(
      { accessGroup, params },
      {
        onSuccess: () => {
          toast.success(translateUi("ui.41898b8d056b7b87", undefined, { v0: String(accessGroup) }));
          setEditing(null);
        },
      },
    );
  };

  const handleConfirmClear = () => {
    if (!clearing) return;
    const accessGroup = clearing.access_group;
    clearBudget.mutate(accessGroup, {
      onSuccess: () => {
        toast.success(translateUi("ui.d3ab962b9ff6aad9", undefined, { v0: String(accessGroup) }));
        setClearing(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{uiT("ui.7e814eac3533e412")}</p>

      <DataTable
        data={accessGroups ?? []}
        paginationMode="client"
        columns={columns}
        getRowId={(group) => group.access_group}
        sortingMode="client"
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        loadingMessage={uiT("ui.d096d05c4705cbd3")}
        noDataMessage={<EmptyState />}
        size="compact"
      />

      <AccessGroupBudgetModal
        accessGroup={editing}
        isSaving={setBudget.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={handleSubmit}
      />

      <DeleteResourceModal
        isOpen={clearing !== null}
        title={uiT("ui.764f34f885b8a856")}
        message={uiT("ui.d139d6c77494f82f")}
        resourceInformationTitle="Access Group"
        resourceInformation={[
          { label: uiT("ui.de2abd6b489e37a2"), value: clearing?.access_group ?? null, code: true },
          { label: uiT("ui.3e20f0a04b21"), value: clearing?.budget?.max_budget?.toString() ?? null },
        ]}
        onCancel={() => setClearing(null)}
        onOk={handleConfirmClear}
        confirmLoading={clearBudget.isPending}
      />
    </div>
  );
}
