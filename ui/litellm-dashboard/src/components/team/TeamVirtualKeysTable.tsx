"use client";
import { useUserDisplayLookup } from "@/app/(dashboard)/hooks/users/useUsers";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
  DateCell,
  ENTITY_CELL_TITLE_CLASSES,
  IdCell,
  IdentityCell,
  MoneyCell,
  UserPopoverCell,
} from "@/components/shared/table_cells";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableSortHeader,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { orgDetailHref, userDetailHref } from "@/utils/entityLinks";
import { DEFAULT_PROXY_ADMIN_USER_ID } from "@/utils/sentinels";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { ColumnDef, ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getModelDisplayName } from "../key_team_helpers/fetch_available_models_team_key";
import { deriveKeyModelScope } from "../key_scope";
import { KeyResponse, Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";
import KeyInfoView from "../templates/key_info_view";

interface TeamVirtualKeysTableProps {
  teamId: string;
  teamAlias?: string;
  organization: Organization | null;
}

/**
 * TeamVirtualKeysTable – variant of VirtualKeysTable scoped to a single team.
 * Displays all virtual keys belonging to the team with same format and styling.
 */
const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

export function TeamVirtualKeysTable({ teamId, teamAlias, organization }: TeamVirtualKeysTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const [selectedKey, setSelectedKey] = useState<KeyResponse | null>(null);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery] = useDebouncedValue(searchInput, { wait: DEBOUNCE_WAIT_MS });

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const getFilterValue = useCallback(
    (columnId: string): string | undefined => {
      const entry = columnFilters.find((filter) => filter.id === columnId);
      return typeof entry?.value === "string" && entry.value.trim() ? entry.value.trim() : undefined;
    },
    [columnFilters],
  );

  const sortBy = sorting.length > 0 ? sorting[0].id : "created_at";
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  const pageIndex = tablePagination.pageIndex;
  const pageSize = tablePagination.pageSize;

  const keyListOptions = {
    teamID: teamId,
    search: searchQuery.trim() || undefined,
    userID: getFilterValue("user_id"),
    keyHash: getFilterValue("key_hash"),
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    expand: "user",
  };

  const { data: keys, isPending: isLoading, isFetching, refetch } = useKeys(pageIndex + 1, pageSize, keyListOptions);

  const displayKeys = useMemo(() => {
    const kList = keys?.keys || [];
    const orgId = organization?.organization_id;
    if (!orgId) return kList;
    return kList.map((k: KeyResponse) => ({
      ...k,
      organization_id: (k.organization_id ?? k.org_id) || orgId,
    }));
  }, [keys?.keys, organization?.organization_id]);

  const { data: userNames = {} } = useUserDisplayLookup(
    displayKeys.flatMap((key) => (key.user_id ? [key.user_id] : [])),
  );
  const rowCount = keys?.total_count ?? 0;
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  const currentTeam: Team = useMemo(
    () => ({
      team_id: teamId,
      team_alias: teamAlias || teamId,
      models: [],
      max_budget: null,
      budget_duration: null,
      tpm_limit: null,
      rpm_limit: null,
      organization_id: organization?.organization_id || "",
      created_at: "",
      keys: [],
      members_with_roles: [],
      spend: 0,
    }),
    [teamId, teamAlias, organization],
  );

  const handleStorageChange = useCallback(() => {
    refetch?.();
  }, [refetch]);

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleStorageChange]);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>((updaterOrValue) => {
    setColumnFilters(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns: ColumnDef<KeyResponse>[] = useMemo(
    () => [
      {
        id: "token",
        accessorKey: "token",
        meta: { title: uiT("ui.d54d56ee0a42") },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.d54d56ee0a42")} variant="header-cycle" />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => (
          <IdCell value={info.getValue() as string | null} onClick={() => setSelectedKey(info.row.original)} />
        ),
      },
      {
        id: "key_alias",
        accessorKey: "key_alias",
        meta: { title: uiT("ui.1e7044ffa52d") },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.1e7044ffa52d")} variant="header-cycle" />
        ),
        size: 150,
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <SimpleTooltip content={value}>
              <span className="block max-w-full truncate font-mono text-xs">{value ?? "-"}</span>
            </SimpleTooltip>
          );
        },
      },
      {
        id: "key_name",
        accessorKey: "key_name",
        header: uiT("ui.eeefa4cae35a"),
        size: 120,
        enableSorting: false,
        cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        id: "organization_id",
        accessorKey: "organization_id",
        header: uiT("ui.1f466322634e2d85"),
        size: 140,
        enableSorting: false,
        cell: (info) => {
          const orgId = info.getValue() as string | null;
          if (!orgId) return "-";
          return (
            <SimpleTooltip content={orgId}>
              <IdentityCell title={orgId} titleClassName={ENTITY_CELL_TITLE_CLASSES} href={orgDetailHref(orgId)} />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "user_email",
        accessorKey: "user",
        header: uiT("ui.b512d97e7cbf"),
        size: 160,
        enableSorting: false,
        cell: (info) => {
          const user = info.getValue() as { user_alias?: string; user_email?: string } | undefined;
          const value =
            user?.user_alias?.trim() ||
            (info.row.original.user_id && userNames[info.row.original.user_id]) ||
            user?.user_email ||
            info.row.original.user_id;
          const userId = info.row.original.user_id;
          return (
            <SimpleTooltip content={value}>
              <IdentityCell
                title={value ?? "-"}
                titleClassName={ENTITY_CELL_TITLE_CLASSES}
                href={value && userId ? userDetailHref(userId) : undefined}
              />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "user_id",
        accessorKey: "user_id",
        header: uiT("ui.7967e089a7b9"),
        size: 70,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          if (userId === DEFAULT_PROXY_ADMIN_USER_ID) {
            return <DefaultProxyAdminTag userId={userId} />;
          }
          return (
            <SimpleTooltip content={userId}>
              <IdentityCell
                title={userId ?? "-"}
                titleClassName={ENTITY_CELL_TITLE_CLASSES}
                href={userId ? userDetailHref(userId) : undefined}
              />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        meta: { title: uiT("ui.3d44337010bf") },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.3d44337010bf")} variant="header-cycle" />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
      },
      {
        id: "created_by",
        accessorKey: "created_by",
        header: uiT("ui.dfd60b9aa5ca"),
        size: 130,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          if (!userId) return "-";
          const { created_by_user } = info.row.original;
          return (
            <UserPopoverCell
              userAlias={created_by_user?.user_alias ?? null}
              userEmail={created_by_user?.user_email ?? null}
              userId={userId}
              width={130}
            />
          );
        },
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        meta: { title: uiT("ui.e35c8e4f5cb5") },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.e35c8e4f5cb5")} variant="header-cycle" />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Never" />,
      },
      {
        id: "last_active",
        accessorKey: "last_active",
        header: uiT("ui.b6dc1b957942"),
        size: 130,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Unknown" />,
      },
      {
        id: "expires",
        accessorKey: "expires",
        header: uiT("ui.f6725f3af08a"),
        size: 120,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Never" />,
      },
      {
        id: "spend",
        accessorKey: "spend",
        meta: { title: uiT("ui.d1b5ad72df63"), numeric: true },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.d1b5ad72df63")} variant="header-cycle" />
        ),
        size: 100,
        enableSorting: true,
        cell: (info) => <MoneyCell value={info.getValue() as number | null} decimals={4} />,
      },
      {
        id: "max_budget",
        accessorKey: "max_budget",
        meta: { title: uiT("ui.e9b19e9155c8"), numeric: true },
        header: ({ column }) => (
          <DataTableSortHeader column={column} title={uiT("ui.e9b19e9155c8")} variant="header-cycle" />
        ),
        size: 110,
        enableSorting: true,
        cell: (info) => (
          <MoneyCell
            value={info.getValue() as number | null}
            decimals={0}
            emptyText={uiT("ui.11dde17d6c3e")}
            showZero
          />
        ),
      },
      {
        id: "budget_reset_at",
        accessorKey: "budget_reset_at",
        header: uiT("ui.26479c1937fc"),
        size: 130,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} fallback="Never" />,
      },
      {
        id: "models",
        accessorKey: "models",
        header: uiT("ui.d17d2d78d76e"),
        size: 200,
        enableSorting: false,
        cell: (info) => {
          const models = info.getValue() as string[];
          const scope = deriveKeyModelScope(info.row.original.allowed_routes, info.row.original.key_type);
          const emptyModelsBadge = !scope.hasModelAccess ? (
            <SimpleTooltip content={uiT("ui.5254286816a971dd", { v0: String(scope.label) })}>
              <Badge variant="secondary" className="mb-1">
                {uiT("ui.47bff7723801")}
              </Badge>
            </SimpleTooltip>
          ) : (
            <Badge variant="destructive" className="mb-1">
              {uiT("ui.72d4bf586944")}
            </Badge>
          );
          return (
            <div className="flex flex-col py-2">
              {Array.isArray(models) ? (
                <div className="flex flex-col">
                  {models.length === 0 ? (
                    emptyModelsBadge
                  ) : (
                    <>
                      <div className="flex items-start">
                        {models.length > 3 && (
                          <button
                            type="button"
                            aria-label={
                              expandedAccordions[info.row.id] ? uiT("ui.5a4b088d252a800d") : uiT("ui.d3491ad376b42c21")
                            }
                            className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() =>
                              setExpandedAccordions((prev) => ({
                                ...prev,
                                [info.row.id]: !prev[info.row.id],
                              }))
                            }
                          >
                            {expandedAccordions[info.row.id] ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {models.slice(0, 3).map((model, index) =>
                            model === "all-proxy-models" ? (
                              <Badge key={index} variant="destructive">
                                {uiT("ui.72d4bf586944")}
                              </Badge>
                            ) : (
                              <Badge key={index}>
                                {model.length > 30
                                  ? `${getModelDisplayName(model).slice(0, 30)}...`
                                  : getModelDisplayName(model)}
                              </Badge>
                            ),
                          )}
                          {models.length > 3 && !expandedAccordions[info.row.id] && (
                            <Badge variant="secondary">
                              +{models.length - 3}{" "}
                              {models.length - 3 === 1 ? uiT("ui.a18677f44f551abf") : uiT("ui.60a165e7b26764fc")}
                            </Badge>
                          )}
                          {expandedAccordions[info.row.id] && (
                            <div className="flex flex-wrap gap-1">
                              {models.slice(3).map((model, index) =>
                                model === "all-proxy-models" ? (
                                  <Badge key={index + 3} variant="destructive">
                                    {uiT("ui.72d4bf586944")}
                                  </Badge>
                                ) : (
                                  <Badge key={index + 3}>
                                    {model.length > 30
                                      ? `${getModelDisplayName(model).slice(0, 30)}...`
                                      : getModelDisplayName(model)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "rate_limits",
        header: uiT("ui.ed129d234fd4"),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => {
          const key = row.original;
          return (
            <div>
              <div>
                {uiT("ui.22506bb2e2fc9c02")} {key.tpm_limit !== null ? key.tpm_limit : uiT("ui.11dde17d6c3e")}
              </div>
              <div>
                {uiT("ui.0a9c9fab18f38f0e")} {key.rpm_limit !== null ? key.rpm_limit : uiT("ui.11dde17d6c3e")}
              </div>
            </div>
          );
        },
      },
    ],
    [expandedAccordions, uiT, userNames],
  );

  const handleSortingChange = useCallback((updaterOrValue: React.SetStateAction<SortingState>) => {
    setSorting(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="w-full">
      {selectedKey ? (
        <KeyInfoView
          keyId={selectedKey.token}
          onClose={() => setSelectedKey(null)}
          keyData={selectedKey}
          teams={[currentTeam]}
          onDelete={refetch}
        />
      ) : (
        <div className="py-4">
          <DataTable
            data={displayKeys}
            columns={columns}
            sortingMode="server"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            paginationMode="server"
            pagination={tablePagination}
            onPaginationChange={setTablePagination}
            rowCount={rowCount}
            filterMode="server"
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            enableColumnResizing
            columnResizeMode="onChange"
            isLoading={isLoading || isFetching}
            loadingMessage={uiT("ui.e0c65255e48f")}
            size="compact"
            toolbar={(table) => (
              <>
                <DataTableToolbar
                  table={table}
                  searchValue={searchInput}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder={uiT("ui.6b082513627498c0")}
                  onRefresh={() => refetch?.()}
                  isRefreshing={isFetching}
                  onOpenFilters={() => setFiltersOpen(true)}
                  filterLabels={{ user_id: "User ID", key_hash: "Key ID" }}
                />
                <DataTableFilterDrawer
                  table={table}
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                  title={uiT("ui.546ebb8eb993")}
                  description={uiT("ui.fd2b1d8a62749d25", { v0: String(teamAlias ?? "this team") })}
                >
                  {({ get, set }) => (
                    <>
                      <DataTableFilterField label={uiT("ui.7967e089a7b9")}>
                        <Input
                          value={(get("user_id") as string) ?? ""}
                          onChange={(event) => set("user_id", event.target.value)}
                          placeholder={uiT("ui.cbb1af4b9f772810")}
                        />
                      </DataTableFilterField>
                      <DataTableFilterField label={uiT("ui.d54d56ee0a42")}>
                        <Input
                          value={(get("key_hash") as string) ?? ""}
                          onChange={(event) => set("key_hash", event.target.value)}
                          placeholder={uiT("ui.36e94dae7366c3c6")}
                        />
                      </DataTableFilterField>
                    </>
                  )}
                </DataTableFilterDrawer>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}
