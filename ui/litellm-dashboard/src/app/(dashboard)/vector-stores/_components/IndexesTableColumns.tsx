"use client";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell } from "@/components/shared/table_cells";
import { userDetailHref } from "@/utils/entityLinks";

import type { VectorStoreIndex } from "./IndexesTab";

interface IndexesTableColumnsDeps {
  resolveVectorStoreId: (name: string) => string | undefined;
  onViewVectorStore: (vectorStoreId: string) => void;
}

export const getIndexesTableColumns = ({
  resolveVectorStoreId,
  onViewVectorStore,
}: IndexesTableColumnsDeps): ColumnDef<VectorStoreIndex>[] => [
  {
    id: "index_name",
    accessorKey: "index_name",
    meta: {
      get title() {
        return translateUi("ui.0f53d21d5f51a27b");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.0f53d21d5f51a27b")} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="block max-w-60 truncate text-sm font-medium" title={row.original.index_name}>
        {row.original.index_name || "-"}
      </span>
    ),
  },
  {
    id: "vector_store_name",
    accessorFn: (row) => row.litellm_params.vector_store_name,
    meta: {
      get title() {
        return translateUi("ui.ae81a470f59d4a38");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.ae81a470f59d4a38")} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.litellm_params.vector_store_name;
      const vectorStoreId = name ? resolveVectorStoreId(name) : undefined;
      if (vectorStoreId) {
        return (
          <IdentityCell
            title={name}
            titleClassName="font-normal"
            className="max-w-60"
            onClick={() => onViewVectorStore(vectorStoreId)}
          />
        );
      }
      return (
        <span className="block max-w-60 truncate text-sm" title={name}>
          {name || "-"}
        </span>
      );
    },
  },
  {
    id: "vector_store_index",
    accessorFn: (row) => row.litellm_params.vector_store_index,
    meta: {
      get title() {
        return translateUi("ui.b8ecf135a0000fee");
      },
    },
    get header() {
      return translateUi("ui.b8ecf135a0000fee");
    },
    size: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <span
        className="block max-w-60 truncate font-mono text-xs"
        title={row.original.litellm_params.vector_store_index}
      >
        {row.original.litellm_params.vector_store_index || "-"}
      </span>
    ),
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
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const createdBy = row.original.created_by;
      if (createdBy) {
        return (
          <IdentityCell
            title={<DefaultProxyAdminTag userId={createdBy} />}
            titleClassName="font-normal"
            className="max-w-48"
            href={userDetailHref(createdBy)}
          />
        );
      }
      return <span className="block max-w-48 truncate text-sm">-</span>;
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: {
      get title() {
        return translateUi("ui.3d44337010bf");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.3d44337010bf")} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
];
