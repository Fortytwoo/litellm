"use client";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedKeyResponse } from "@/app/(dashboard)/hooks/keys/useKeys";
import { userDetailHref } from "@/utils/entityLinks";

function TruncatedTextCell({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60 truncate" title={value}>
      {value}
    </span>
  );
}

function UserLinkCell({ userId }: { userId: string | null | undefined }) {
  if (!userId) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60" title={userId}>
      <IdentityCell title={userId} titleClassName="font-normal" href={userDetailHref(userId)} />
    </span>
  );
}

export const getDeletedKeysTableColumns = (): ColumnDef<DeletedKeyResponse>[] => [
  {
    id: "token",
    accessorKey: "token",
    meta: {
      get title() {
        return translateUi("ui.d54d56ee0a42");
      },
    },
    get header() {
      return translateUi("ui.d54d56ee0a42");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.token} variant="plain" />,
  },
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: {
      get title() {
        return translateUi("ui.1e7044ffa52d");
      },
    },
    get header() {
      return translateUi("ui.1e7044ffa52d");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.key_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-mono text-xs" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: {
      get title() {
        return translateUi("ui.85cf10057e87");
      },
    },
    get header() {
      return translateUi("ui.85cf10057e87");
    },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.team_alias} />,
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
    id: "user_email",
    accessorKey: "user_email",
    meta: {
      get title() {
        return translateUi("ui.5809bbd8a352");
      },
    },
    get header() {
      return translateUi("ui.5809bbd8a352");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.user_email} />,
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: {
      get title() {
        return translateUi("ui.7967e089a7b9");
      },
    },
    get header() {
      return translateUi("ui.7967e089a7b9");
    },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.user_id} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: {
      get title() {
        return translateUi("ui.3d44337010bf");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.3d44337010bf")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: {
      get title() {
        return translateUi("ui.dfd60b9aa5ca");
      },
    },
    get header() {
      return translateUi("ui.dfd60b9aa5ca");
    },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.created_by} />,
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
    cell: ({ row }) => <UserLinkCell userId={row.original.deleted_by} />,
  },
];
