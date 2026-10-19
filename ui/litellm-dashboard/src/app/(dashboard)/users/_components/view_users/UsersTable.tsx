"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";

import { UserInfo } from "@/components/networking";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Input } from "@/components/ui/input";

import { getUsersTableColumns } from "./UsersTableColumns";

export interface UsersTableTeamOption {
  team_id: string;
  team_alias?: string | null;
}

interface UsersTableProps {
  data: UserInfo[];
  rowCount: number;
  isLoading: boolean;
  possibleUIRoles: Record<string, Record<string, string>> | null;
  teams: UsersTableTeamOption[] | null;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectionEnabled: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onUserClick: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser: (user: UserInfo) => void;
  onResetPassword: (userId: string) => void;
}

const FILTER_LABELS: Record<string, string> = {
  get user_id() {
    return translateUi("ui.7967e089a7b9");
  },
  get sso_user_id() {
    return translateUi("ui.b76f39051ffc");
  },
  get user_role() {
    return translateUi("ui.14736a2eb9f4");
  },
  get team() {
    return translateUi("ui.5985039f106d");
  },
};

function EmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Users className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.bf1e104fb3c8")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.ff762330c43e")}</div>
    </div>
  );
}

export function UsersTable({
  data,
  rowCount,
  isLoading,
  possibleUIRoles,
  teams,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  searchValue,
  onSearchChange,
  selectionEnabled,
  rowSelection,
  onRowSelectionChange,
  onUserClick,
  onDeleteUser,
  onResetPassword,
}: UsersTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useMemo(() => {
    const columnDeps = {
      possibleUIRoles,
      includeSelection: selectionEnabled,
      onUserClick,
      onDeleteUser,
      onResetPassword,
    };
    return getUsersTableColumns(columnDeps);
  }, [possibleUIRoles, selectionEnabled, onUserClick, onDeleteUser, onResetPassword]);

  const roleOptions = useMemo(
    () =>
      Object.entries(possibleUIRoles ?? {}).map(([role, config]) => ({
        label: config.ui_label || role,
        value: role,
      })),
    [possibleUIRoles],
  );

  const teamOptions = useMemo(
    () =>
      (teams ?? []).map((team) => ({
        label: team.team_alias || team.team_id,
        value: team.team_id,
      })),
    [teams],
  );

  const formatFilterValue = (columnId: string, value: unknown): string => {
    const raw = String(value);
    if (columnId === "user_role") {
      return possibleUIRoles?.[raw]?.ui_label || raw;
    }
    if (columnId === "team") {
      return teams?.find((team) => team.team_id === raw)?.team_alias || raw;
    }
    return raw;
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.user_id}
      sortingMode="server"
      sorting={sorting}
      onSortingChange={onSortingChange}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      isLoading={isLoading}
      loadingMessage={uiT("ui.a53ec7ac2a7b8fb1")}
      noDataMessage={<EmptyState />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={uiT("ui.6688287ebdd5")}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={FILTER_LABELS}
            formatFilterValue={formatFilterValue}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={uiT("ui.546ebb8eb993")}
            description={uiT("ui.1516b662c930")}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={uiT("ui.7967e089a7b9")}>
                  <Input
                    value={(get("user_id") as string) ?? ""}
                    onChange={(event) => set("user_id", event.target.value)}
                    placeholder={uiT("ui.76e537b8d0dc")}
                    data-testid="users-filter-user-id"
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.b76f39051ffc")}>
                  <Input
                    value={(get("sso_user_id") as string) ?? ""}
                    onChange={(event) => set("sso_user_id", event.target.value)}
                    placeholder={uiT("ui.4acc3b8b3821")}
                    data-testid="users-filter-sso-id"
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.14736a2eb9f4")}>
                  <SearchSelect
                    options={roleOptions}
                    value={(get("user_role") as string) || undefined}
                    onValueChange={(value) => set("user_role", value ?? undefined)}
                    placeholder={uiT("ui.b34820333f26")}
                    emptyText={uiT("ui.7a309c67fad2")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={uiT("ui.5985039f106d")}>
                  <SearchSelect
                    options={teamOptions}
                    value={(get("team") as string) || undefined}
                    onValueChange={(value) => set("team", value ?? undefined)}
                    placeholder={uiT("ui.d16c308a2ff9")}
                    emptyText={uiT("ui.c83a06f9875f")}
                  />
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
