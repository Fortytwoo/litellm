"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell } from "@/components/shared/table_cells";
import { Tag } from "@/components/tag_management/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

export const DYNAMIC_SPEND_TAG_DESCRIPTION =
  "This is just a spend tag that was passed dynamically in a request. It does not control any LLM models.";

const isDynamicSpendTag = (tag: Tag) => tag.description === DYNAMIC_SPEND_TAG_DESCRIPTION;

function TagNameCell({ tag, onSelectTag }: { tag: Tag; onSelectTag: (tagName: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  if (isDynamicSpendTag(tag)) {
    return (
      <CellTooltip
        content={uiT("ui.d8d70410f8d33df1")}
        trigger={<span className="block max-w-60 truncate font-mono text-xs text-muted-foreground">{tag.name}</span>}
      />
    );
  }
  return (
    <IdentityCell
      title={tag.name}
      titleClassName="font-mono text-xs font-normal text-primary"
      className="max-w-60"
      onClick={() => onSelectTag(tag.name)}
    />
  );
}

function TagModelsCell({ tag }: { tag: Tag }) {
  const { t: uiT } = useDashboardLanguage();

  const models = tag.models ?? [];
  if (models.length === 0) {
    return <Badge variant="secondary">{uiT("ui.77781174637c")}</Badge>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {models.map((modelId) => (
        <CellTooltip
          key={modelId}
          content={uiT("ui.50d7d1fb9a8c81d7", { v0: String(modelId) })}
          trigger={
            <Badge variant="outline" className="cursor-default">
              {tag.model_info?.[modelId] || modelId}
            </Badge>
          }
        />
      ))}
    </div>
  );
}

interface TagRowActionsProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tagName: string) => void;
}

function TagRowActions({ tag, onEdit, onDelete }: TagRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  const isDynamic = isDynamicSpendTag(tag);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.23690351aa3dc71d")}
        data-testid={`tag-actions-${tag.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={isDynamic}
          data-testid="tag-action-edit"
          title={isDynamic ? uiT("ui.9bbc780778062613") : undefined}
          onClick={() => onEdit(tag)}
        >
          <Pencil />
          {uiT("ui.464c4ffd019e")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isDynamic}
          data-testid="tag-action-delete"
          title={isDynamic ? uiT("ui.8a66825cd9b1a1d1") : undefined}
          onClick={() => onDelete(tag.name)}
        >
          <Trash2 />
          {uiT("ui.e2d0a54968ea")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TagTableColumnsDeps {
  onSelectTag: (tagName: string) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (tagName: string) => void;
}

export const getTagTableColumns = ({ onSelectTag, onEdit, onDelete }: TagTableColumnsDeps): ColumnDef<Tag>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: {
      get title() {
        return translateUi("ui.077b1b77d3100997");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.077b1b77d3100997")} />,
    size: 260,
    enableSorting: true,
    filterFn: "includesString",
    cell: ({ row }) => <TagNameCell tag={row.original} onSelectTag={onSelectTag} />,
  },
  {
    id: "description",
    accessorKey: "description",
    meta: {
      get title() {
        return translateUi("ui.526e0087cc3f");
      },
    },
    get header() {
      return translateUi("ui.526e0087cc3f");
    },
    size: 300,
    enableSorting: false,
    filterFn: "includesString",
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description}>
          {description || "-"}
        </span>
      );
    },
  },
  {
    id: "models",
    meta: {
      get title() {
        return translateUi("ui.bd7237634a25de42");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.bd7237634a25de42");
    },
    size: 240,
    enableSorting: false,
    cell: ({ row }) => <TagModelsCell tag={row.original} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: {
      get title() {
        return translateUi("ui.d70b9e24bca2");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.d70b9e24bca2")} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
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
        <TagRowActions tag={row.original} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
  },
];
