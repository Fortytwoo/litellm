"use client";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedTeam } from "@/app/(dashboard)/hooks/teams/useTeams";
import { orgDetailHref, userDetailHref } from "@/utils/entityLinks";

function EntityCell({ value, href }: { value: string | null | undefined; href: string | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60" title={value}>
      <IdentityCell title={value} titleClassName="font-normal" href={href} />
    </span>
  );
}

export const getDeletedTeamsTableColumns = (): ColumnDef<DeletedTeam>[] => [
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: {
      get title() {
        return translateUi("ui.6ed5a592c422");
      },
    },
    get header() {
      return translateUi("ui.6ed5a592c422");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.team_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-medium" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_id",
    accessorKey: "team_id",
    meta: {
      get title() {
        return translateUi("ui.fa2758a6173a");
      },
    },
    get header() {
      return translateUi("ui.fa2758a6173a");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: {
      get title() {
        return translateUi("ui.d70b9e24bca2");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.d70b9e24bca2")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: {
      get title() {
        return translateUi("ui.d1b5ad72df63");
      },
      numeric: true,
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.d1b5ad72df63")} />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    accessorKey: "max_budget",
    meta: {
      get title() {
        return translateUi("ui.e9b19e9155c8");
      },
      numeric: true,
    },
    get header() {
      return translateUi("ui.e9b19e9155c8");
    },
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={row.original.max_budget} decimals={0} emptyText={translateUi("ui.11dde17d6c3e")} showZero />
    ),
  },
  {
    id: "models",
    accessorKey: "models",
    meta: {
      get title() {
        return translateUi("ui.d17d2d78d76e");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.d17d2d78d76e");
    },
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "organization_id",
    accessorKey: "organization_id",
    meta: {
      get title() {
        return translateUi("ui.d764d42592fc");
      },
    },
    get header() {
      return translateUi("ui.d764d42592fc");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const orgId = row.original.organization_id;
      return <EntityCell value={orgId} href={orgId ? orgDetailHref(orgId) : undefined} />;
    },
  },
  {
    id: "deleted_at",
    accessorKey: "deleted_at",
    meta: {
      get title() {
        return translateUi("ui.ecf8c7651cb7");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.ecf8c7651cb7")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
  },
  {
    id: "deleted_by",
    accessorKey: "deleted_by",
    meta: {
      get title() {
        return translateUi("ui.279b259e414d");
      },
    },
    get header() {
      return translateUi("ui.279b259e414d");
    },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const deletedBy = row.original.deleted_by;
      return <EntityCell value={deletedBy} href={deletedBy ? userDetailHref(deletedBy) : undefined} />;
    },
  },
];
