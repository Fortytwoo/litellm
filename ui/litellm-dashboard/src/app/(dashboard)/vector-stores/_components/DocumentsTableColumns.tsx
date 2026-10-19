"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentUpload } from "@/components/vector_store_management/types";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const STATUS_CONFIG: Record<DocumentUpload["status"], { tone: StatusTone; label: string }> = {
  uploading: {
    tone: "info",
    get label() {
      return translateUi("ui.8b898ca34ce71371");
    },
  },
  done: {
    tone: "success",
    get label() {
      return translateUi("ui.5fa7aac5375c5815");
    },
  },
  error: {
    tone: "error",
    get label() {
      return translateUi("ui.54a0e8c17ebb");
    },
  },
  removed: {
    tone: "neutral",
    get label() {
      return translateUi("ui.4118fb4fed0ecec9");
    },
  },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function DocumentRowActions({ document, onRemove }: { document: DocumentUpload; onRemove: (uid: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.6d00dc1d2fea0851")}
        data-testid={`document-actions-${document.uid}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="document-action-copy"
          onClick={() => void copyToClipboard(document.uid, "Document ID copied to clipboard")}
        >
          <Copy />
          {uiT("ui.cd80b47ab62939a8")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="document-action-remove"
          onClick={() => onRemove(document.uid)}
        >
          <Trash2 />
          {uiT("ui.c3812fc4acb8")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DocumentsTableColumnsDeps {
  onRemove: (uid: string) => void;
}

export const getDocumentsTableColumns = ({ onRemove }: DocumentsTableColumnsDeps): ColumnDef<DocumentUpload>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: {
      get title() {
        return translateUi("ui.dcd1d5223f73");
      },
    },
    get header() {
      return translateUi("ui.dcd1d5223f73");
    },
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="block max-w-72 truncate text-sm" title={row.original.name}>
          {row.original.name}
        </span>
        {row.original.size ? (
          <span className="text-xs text-muted-foreground">({formatFileSize(row.original.size)})</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    meta: {
      get title() {
        return translateUi("ui.920e413c7d41");
      },
      skeleton: "badge",
    },
    get header() {
      return translateUi("ui.920e413c7d41");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status] ?? { tone: "neutral", label: row.original.status };
      return <StatusBadge tone={config.tone} label={config.label} />;
    },
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
        <DocumentRowActions document={row.original} onRemove={onRemove} />
      </div>
    ),
  },
];
