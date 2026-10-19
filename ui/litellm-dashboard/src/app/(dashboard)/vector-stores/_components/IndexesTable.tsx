"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { SortingState } from "@tanstack/react-table";
import { Inbox } from "lucide-react";
import React, { useMemo, useState } from "react";

import { DataTable } from "@/components/shared/DataTable";

import type { VectorStoreIndex } from "./IndexesTab";
import { getIndexesTableColumns } from "./IndexesTableColumns";

interface IndexesTableProps {
  data: VectorStoreIndex[];
  resolveVectorStoreId: (name: string) => string | undefined;
  onViewVectorStore: (vectorStoreId: string) => void;
  isLoading?: boolean;
}

const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

function EmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.1e0b4cf62b324232")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.6b98f8516e01af7b")}</div>
    </div>
  );
}

const IndexesTable: React.FC<IndexesTableProps> = ({
  data,
  resolveVectorStoreId,
  onViewVectorStore,
  isLoading = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const columns = useMemo(
    () => getIndexesTableColumns({ resolveVectorStoreId, onViewVectorStore }),
    [resolveVectorStoreId, onViewVectorStore],
  );

  return (
    <DataTable
      data={data}
      paginationMode="client"
      columns={columns}
      getRowId={(row, index) => row.id || String(index)}
      sortingMode="client"
      sorting={sorting}
      onSortingChange={setSorting}
      isLoading={isLoading}
      loadingMessage={uiT("ui.9f3a5d6b2e554a61")}
      noDataMessage={<EmptyState />}
      size="compact"
    />
  );
};

export default IndexesTable;
