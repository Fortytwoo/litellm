"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { Database } from "lucide-react";
import React, { useMemo } from "react";

import { MemoryRow } from "@/components/networking";
import { DataTable, DataTableToolbar } from "@/components/shared/DataTable";

import { getMemoryTableColumns } from "./MemoryTableColumns";

interface MemoryTableProps {
  data: MemoryRow[];
  isLoading: boolean;
  rowCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  hasActiveSearch: boolean;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

function MemoryEmptyState({ hasActiveSearch }: { hasActiveSearch: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Database className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {hasActiveSearch ? uiT("ui.d80cc44dc205ff4f") : uiT("ui.fea634eddd3fd472")}
      </div>
      <div className="text-sm text-muted-foreground">
        {hasActiveSearch ? uiT("ui.1b60159ad22a6789") : uiT("ui.689e2d0f42a4f179")}
      </div>
    </div>
  );
}

export function MemoryTable({
  data,
  isLoading,
  rowCount,
  pagination,
  onPaginationChange,
  searchValue,
  onSearchChange,
  isRefreshing,
  onRefresh,
  hasActiveSearch,
  onViewClick,
  onEditClick,
  onDeleteClick,
}: MemoryTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const columns = useMemo(() => {
    const columnDeps = { onViewClick, onEditClick, onDeleteClick };
    return getMemoryTableColumns(columnDeps);
  }, [onViewClick, onEditClick, onDeleteClick]);

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.memory_id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      isLoading={isLoading}
      loadingMessage={uiT("ui.bf187332928a7a70")}
      noDataMessage={<MemoryEmptyState hasActiveSearch={hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={uiT("ui.4405022d2ff639f7")}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          showViewOptions={false}
        />
      )}
    />
  );
}

export default MemoryTable;
