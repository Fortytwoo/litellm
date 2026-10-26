"use client";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { CellTooltip, DateCell, IdentityCell } from "@/components/shared/table_cells";
import { keyDetailHref } from "@/utils/entityLinks";

function OwnerCell({ record }: { record: KeyResponse }) {
  const email = record.user?.user_alias?.trim() || record.user?.user_email || record.user_id || null;
  if (!email) return <span className="text-sm">—</span>;
  return (
    <CellTooltip
      content={email}
      trigger={
        <span className="inline-flex max-w-60 truncate">
          <DefaultProxyAdminTag
            userId={record.user_id}
            displayName={record.user?.user_alias?.trim()}
            fallbackLabel={record.user?.user_email}
          />
        </span>
      }
    />
  );
}

export const getProjectKeysTableColumns = (): ColumnDef<KeyResponse>[] => [
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: {
      get title() {
        return translateUi("ui.750c6798ab7ffc9a");
      },
    },
    get header() {
      return translateUi("ui.750c6798ab7ffc9a");
    },
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={<span title={row.original.key_alias ?? undefined}>{row.original.key_alias || "—"}</span>}
        href={row.original.token ? keyDetailHref(row.original.token) : undefined}
        className="max-w-60"
      />
    ),
  },
  {
    id: "owner",
    meta: {
      get title() {
        return translateUi("ui.4b1b8aa3608a26da");
      },
    },
    get header() {
      return translateUi("ui.4b1b8aa3608a26da");
    },
    enableSorting: false,
    cell: ({ row }) => <OwnerCell record={row.original} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: {
      get title() {
        return translateUi("ui.d70b9e24bca2");
      },
    },
    get header() {
      return translateUi("ui.d70b9e24bca2");
    },
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "last_active",
    accessorKey: "last_active",
    meta: {
      get title() {
        return translateUi("ui.b6dc1b957942");
      },
    },
    get header() {
      return translateUi("ui.b6dc1b957942");
    },
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.last_active} precision="date" fallback="Never" />,
  },
];
