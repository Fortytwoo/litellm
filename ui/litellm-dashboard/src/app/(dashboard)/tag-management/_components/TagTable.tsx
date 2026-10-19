"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { SortingState, Table } from "@tanstack/react-table";
import { Inbox, SearchX } from "lucide-react";
import React, { useMemo, useState } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { Tag } from "@/components/tag_management/types";
import { Input } from "@/components/ui/input";

import { getTagTableColumns } from "./tagTableColumns";

interface TagTableProps {
  data: Tag[];
  onEdit: (tag: Tag) => void;
  onDelete: (tagName: string) => void;
  onSelectTag: (tagName: string) => void;
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
      <div className="text-sm font-medium text-foreground">{uiT("ui.b57d852b14d2e386")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.795e526b741866a4")}</div>
    </div>
  );
}

function NoMatchingTags() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <SearchX className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.7cfcab74d09c507e")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.186a1f795b25560b")}</div>
    </div>
  );
}

function TagFilters({ table }: { table: Table<Tag> }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label={uiT("ui.ef19fb543296757e")}
        placeholder={uiT("ui.f353921e828c4ef6")}
        className="h-8 w-56"
        value={(table.getColumn("name")?.getFilterValue() as string | undefined) ?? ""}
        onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
      />
      <Input
        aria-label={uiT("ui.9009f2cee539eda7")}
        placeholder={uiT("ui.d4f85cc4ddd65d0c")}
        className="h-8 w-56"
        value={(table.getColumn("description")?.getFilterValue() as string | undefined) ?? ""}
        onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
      />
    </div>
  );
}

const TagTable: React.FC<TagTableProps> = ({ data, onEdit, onDelete, onSelectTag, isLoading = false }) => {
  const { t: uiT } = useDashboardLanguage();

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const columns = useMemo(() => getTagTableColumns({ onSelectTag, onEdit, onDelete }), [onSelectTag, onEdit, onDelete]);

  return (
    <DataTable
      data={data}
      paginationMode="client"
      columns={columns}
      getRowId={(tag, index) => tag.name || String(index)}
      fillHeight
      sortingMode="client"
      sorting={sorting}
      onSortingChange={setSorting}
      isLoading={isLoading}
      loadingMessage={uiT("ui.23acfd6690fb5c78")}
      filterMode="client"
      toolbar={(table) => <TagFilters table={table} />}
      noDataMessage={data.length === 0 ? <EmptyState /> : <NoMatchingTags />}
      size="compact"
    />
  );
};

export default TagTable;
