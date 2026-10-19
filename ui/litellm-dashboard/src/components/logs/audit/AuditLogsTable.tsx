"use client";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AUDIT_TABLE_NAME_DISPLAY, AuditLogEntry, getAuditLogsTableColumns } from "./AuditLogsTableColumns";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh: () => void;
  onViewLog: (log: AuditLogEntry) => void;
}

const ALL_VALUE = "all";

const ACTION_OPTIONS = [
  {
    get label() {
      return translateUi("ui.d70b9e24bca2");
    },
    value: "created",
  },
  {
    get label() {
      return translateUi("ui.3a5ecca188c0");
    },
    value: "updated",
  },
  {
    get label() {
      return translateUi("ui.b48ff39c2e0f");
    },
    value: "deleted",
  },
  {
    get label() {
      return translateUi("ui.24b1084102a4");
    },
    value: "rotated",
  },
  {
    get label() {
      return translateUi("ui.1e578bffaae3");
    },
    value: "kill_switch_fired",
  },
] as const;

const TABLE_OPTIONS = [
  {
    get label() {
      return translateUi("ui.f0d66a79c138");
    },
    value: "LiteLLM_VerificationToken",
  },
  {
    get label() {
      return translateUi("ui.1e1a1c078af2");
    },
    value: "LiteLLM_TeamTable",
  },
  {
    get label() {
      return translateUi("ui.6b0cc904d081");
    },
    value: "LiteLLM_UserTable",
  },
  {
    get label() {
      return translateUi("ui.2730183d6b77");
    },
    value: "LiteLLM_OrganizationTable",
  },
  {
    get label() {
      return translateUi("ui.d17d2d78d76e");
    },
    value: "LiteLLM_ProxyModelTable",
  },
  {
    get label() {
      return translateUi("ui.279b44d2ab4b");
    },
    value: "LiteLLM_AgentsTable",
  },
] as const;

const ACTION_FILTER_ITEMS = [
  {
    value: ALL_VALUE,
    get label() {
      return translateUi("ui.d409578af954");
    },
  },
  ...ACTION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const TABLE_FILTER_ITEMS = [
  {
    value: ALL_VALUE,
    get label() {
      return translateUi("ui.46d2924e452f");
    },
  },
  ...TABLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const FILTER_LABELS: Record<string, string> = {
  object_id: "Object ID",
  changed_by: "Changed By",
  team_id: "Team ID",
  key_hash: "Key Hash",
  action: "Action",
  table_name: "Table",
};

const formatFilterValue = (columnId: string, value: unknown): string => {
  const raw = String(value);
  if (columnId === "action") {
    return ACTION_OPTIONS.find((option) => option.value === raw)?.label ?? raw;
  }
  if (columnId === "table_name") {
    return AUDIT_TABLE_NAME_DISPLAY[raw] ?? raw;
  }
  return raw;
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered ? uiT("ui.3fe305a70b64") : uiT("ui.86defd0763a1")}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered ? uiT("ui.0e6b421491e3") : uiT("ui.de1ef2822bbc")}
      </div>
    </div>
  );
}

export function AuditLogsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  searchValue,
  onSearchChange,
  onRefresh,
  onViewLog,
}: AuditLogsTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog }), [onViewLog]);
  const hasActiveSearch = Boolean(searchValue?.trim());

  return (
    <DataTable
      fillHeight
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      isLoading={isLoading}
      loadingMessage="Loading audit logs…"
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0 || hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={uiT("ui.286f0090d3d9")}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={FILTER_LABELS}
            formatFilterValue={formatFilterValue}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={uiT("ui.546ebb8eb993")}
            description={uiT("ui.fc9c0aa7303d")}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={uiT("ui.f79ceb0b0078")}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={uiT("ui.6f35194cb13a")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.02b8ac805184")}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={uiT("ui.76e537b8d0dc")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.fa2758a6173a")}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={uiT("ui.897c385d8a6b")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.415fd17d81f2")}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={uiT("ui.b19b1d701016")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.64cff1319d2f")}>
                  <Select
                    items={ACTION_FILTER_ITEMS}
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={uiT("ui.d409578af954")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{uiT("ui.d409578af954")}</SelectItem>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.16d1c9050a0b")}>
                  <Select
                    items={TABLE_FILTER_ITEMS}
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={uiT("ui.46d2924e452f")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{uiT("ui.46d2924e452f")}</SelectItem>
                      {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
