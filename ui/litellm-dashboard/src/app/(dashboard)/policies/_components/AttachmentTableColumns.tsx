"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, StatusBadge } from "@/components/shared/table_cells";
import { PolicyAttachment } from "@/components/policies/types";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

import ImpactPopover from "./impact_popover";

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.slice(0, 2).map((value) => (
        <StatusBadge key={value} tone="neutral" label={value} />
      ))}
      {values.length > 2 && (
        <StatusBadge tone="neutral" label={`+${values.length - 2}`} tooltip={values.slice(2).join(", ")} />
      )}
    </div>
  );
}

interface AttachmentRowActionsProps {
  attachment: PolicyAttachment;
  isAdmin: boolean;
  onDeleteClick: (attachmentId: string) => void;
}

const CONFIG_ATTACHMENT_HINT =
  "Config attachments are defined in the config file and cannot be deleted from the dashboard.";

function AttachmentRowActions({ attachment, isAdmin, onDeleteClick }: AttachmentRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  const isConfigAttachment = attachment.definition_location === "config";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.9c70a27fcfab8f47")}
        data-testid={`attachment-actions-${attachment.attachment_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="attachment-action-copy-id"
          onClick={() => void copyToClipboard(attachment.attachment_id, "Attachment ID copied")}
        >
          <Copy />
          {uiT("ui.f6251307ade7da43")}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="attachment-action-delete"
              disabled={isConfigAttachment}
              title={isConfigAttachment ? CONFIG_ATTACHMENT_HINT : undefined}
              onClick={() => onDeleteClick(attachment.attachment_id)}
            >
              <Trash2 />
              {uiT("ui.fb45068b16d6c71f")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AttachmentTableColumnsDeps {
  isAdmin: boolean;
  accessToken: string | null;
  onDeleteClick: (attachmentId: string) => void;
}

export const getAttachmentTableColumns = ({
  isAdmin,
  accessToken,
  onDeleteClick,
}: AttachmentTableColumnsDeps): ColumnDef<PolicyAttachment>[] => [
  {
    id: "attachment_id",
    accessorKey: "attachment_id",
    meta: {
      get title() {
        return translateUi("ui.b949685bdf56c53b");
      },
    },
    get header() {
      return translateUi("ui.b949685bdf56c53b");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.attachment_id} variant="plain" />,
  },
  {
    id: "policy_name",
    accessorKey: "policy_name",
    meta: {
      get title() {
        return translateUi("ui.c611981fab983bc6");
      },
      skeleton: "badge",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.c611981fab983bc6")} />,
    size: 180,
    enableSorting: true,
    cell: ({ row }) => <StatusBadge tone="info" label={row.original.policy_name} />,
  },
  {
    id: "scope",
    accessorFn: (row) => row.scope ?? "",
    meta: {
      get title() {
        return translateUi("ui.b073f6c68ef87211");
      },
      skeleton: "badge",
    },
    get header() {
      return translateUi("ui.b073f6c68ef87211");
    },
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const scope = row.original.scope;
      if (!scope) {
        return <span className="text-muted-foreground">-</span>;
      }
      if (scope === "*") {
        return <StatusBadge tone="warning" label={translateUi("ui.39ed4b2e22f06566")} />;
      }
      return (
        <span className="block max-w-40 truncate text-xs" title={scope}>
          {scope}
        </span>
      );
    },
  },
  {
    id: "teams",
    meta: {
      get title() {
        return translateUi("ui.1e1a1c078af2");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.1e1a1c078af2");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.teams ?? []} />,
  },
  {
    id: "keys",
    meta: {
      get title() {
        return translateUi("ui.f0d66a79c138");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.f0d66a79c138");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.keys ?? []} />,
  },
  {
    id: "models",
    meta: {
      get title() {
        return translateUi("ui.d17d2d78d76e");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.d17d2d78d76e");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.models ?? []} />,
  },
  {
    id: "tags",
    meta: {
      get title() {
        return translateUi("ui.1331275bc537");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.1331275bc537");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.tags ?? []} />,
  },
  {
    id: "priority",
    accessorFn: (row) => row.priority ?? Number.POSITIVE_INFINITY,
    meta: {
      get title() {
        return translateUi("ui.d60dbba079223254");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.d60dbba079223254")} />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) =>
      row.original.priority == null ? (
        <span className="text-muted-foreground">-</span>
      ) : (
        <span className="font-mono text-xs">{row.original.priority}</span>
      ),
  },
  {
    id: "default",
    accessorFn: (row) => (row.default ? 1 : 0),
    meta: {
      get title() {
        return translateUi("ui.21b111cbfe6e");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.21b111cbfe6e")} />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) =>
      row.original.default ? (
        <StatusBadge tone="info" label={translateUi("ui.21b111cbfe6e")} tooltip={translateUi("ui.59dbe61a989da3fc")} />
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "created_at",
    accessorFn: (row) => row.created_at ?? "",
    meta: {
      get title() {
        return translateUi("ui.3d44337010bf");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.3d44337010bf")} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{translateUi("ui.ff8059dc6752")}</span>,
    size: 88,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <ImpactPopover attachment={row.original} accessToken={accessToken} />
        <AttachmentRowActions attachment={row.original} isAdmin={isAdmin} onDeleteClick={onDeleteClick} />
      </div>
    ),
  },
];
