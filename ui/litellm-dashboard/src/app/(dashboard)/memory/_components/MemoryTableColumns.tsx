"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { MemoryRow } from "@/components/networking";
import { DateCell, IdCell, IdentityCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { teamDetailHref, userDetailHref } from "@/utils/entityLinks";

interface MemoryRowActionsProps {
  row: MemoryRow;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

function MemoryRowActions({ row, onViewClick, onEditClick, onDeleteClick }: MemoryRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.9834f00962cba0a0")}
        data-testid={`memory-actions-${row.memory_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem data-testid="memory-action-view" onClick={() => onViewClick(row)}>
          <Eye />
          {uiT("ui.dcc839a4015c")}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="memory-action-edit" onClick={() => onEditClick(row)}>
          <Pencil />
          {uiT("ui.464c4ffd019e")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" data-testid="memory-action-delete" onClick={() => onDeleteClick(row)}>
          <Trash2 />
          {uiT("ui.e2d0a54968ea")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface MemoryTableColumnsDeps {
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

export const getMemoryTableColumns = ({
  onViewClick,
  onEditClick,
  onDeleteClick,
}: MemoryTableColumnsDeps): ColumnDef<MemoryRow>[] => [
  {
    id: "memory_id",
    accessorKey: "memory_id",
    meta: { title: "ID" },
    header: "ID",
    size: 180,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.memory_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onViewClick(row.original)}
      />
    ),
  },
  {
    id: "key",
    accessorKey: "key",
    meta: {
      get title() {
        return translateUi("ui.dcd1d5223f73");
      },
    },
    get header() {
      return translateUi("ui.dcd1d5223f73");
    },
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-52 truncate font-mono text-xs" title={row.original.key}>
        {row.original.key}
      </span>
    ),
  },
  {
    id: "value",
    accessorKey: "value",
    meta: {
      get title() {
        return translateUi("ui.324b134f57c70c72");
      },
    },
    get header() {
      return translateUi("ui.324b134f57c70c72");
    },
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm text-muted-foreground" title={row.original.value}>
        {row.original.value || "-"}
      </span>
    ),
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
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const userId = row.original.user_id;
      return <IdCell value={userId} href={userId ? userDetailHref(userId) : undefined} />;
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
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const teamId = row.original.team_id;
      return <IdCell value={teamId} href={teamId ? teamDetailHref(teamId) : undefined} />;
    },
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: {
      get title() {
        return translateUi("ui.3a5ecca188c0");
      },
    },
    get header() {
      return translateUi("ui.3a5ecca188c0");
    },
    size: 170,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{translateUi("ui.ff8059dc6752")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MemoryRowActions
          row={row.original}
          onViewClick={onViewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      </div>
    ),
  },
];
