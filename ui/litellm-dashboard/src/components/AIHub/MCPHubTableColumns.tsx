"use client";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Info, MoreHorizontal } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { MCP_REACHABLE_DESCRIPTION } from "@/components/mcp_tools/types";
import { IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

export interface MCPServerData {
  server_id: string;
  server_name: string;
  alias?: string | null;
  description?: string | null;
  url: string;
  transport: string;
  auth_type: string;
  credentials?: any;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  teams: string[];
  mcp_access_groups: string[];
  allowed_tools: string[];
  extra_headers: any[];
  mcp_info: Record<string, any>;
  static_headers: Record<string, any>;
  status: string;
  last_health_check?: string | null;
  health_check_error?: string | null;
  command?: string | null;
  args: string[];
  env: Record<string, any>;
  [key: string]: any;
}

const STATUS_TONES: Record<string, StatusTone> = {
  active: "success",
  inactive: "error",
  unknown: "neutral",
  healthy: "success",
  reachable: "info",
  unhealthy: "error",
};

interface MCPHubRowActionsProps {
  server: MCPServerData;
  onServerClick: (server: MCPServerData) => void;
}

function MCPHubRowActions({ server, onServerClick }: MCPHubRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.2c8c64269c55f3a2")}
        data-testid={`mcp-hub-actions-${server.server_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem data-testid="mcp-hub-action-details" onClick={() => onServerClick(server)}>
          <Info />
          {uiT("ui.d1bf045bb524dae5")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="mcp-hub-action-copy"
          onClick={() => void copyToClipboard(server.server_name, "Server name copied")}
        >
          <Copy />
          {uiT("ui.9758ba7e0b38a9fd")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MCPHubTableColumnsDeps {
  onServerClick: (server: MCPServerData) => void;
}

export const getMCPHubTableColumns = ({ onServerClick }: MCPHubTableColumnsDeps): ColumnDef<MCPServerData>[] => [
  {
    id: "server_name",
    accessorKey: "server_name",
    meta: {
      get title() {
        return translateUi("ui.bc4816425ebe8079");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.bc4816425ebe8079")} />,
    size: 200,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell title={row.original.server_name} className="max-w-72" onClick={() => onServerClick(row.original)} />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    meta: {
      get title() {
        return translateUi("ui.526e0087cc3f");
      },
      className: "hidden md:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.526e0087cc3f")} />,
    size: 240,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-xs" title={row.original.description || undefined}>
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "transport",
    accessorKey: "transport",
    meta: {
      get title() {
        return translateUi("ui.aaead4abf5d0fd5e");
      },
      skeleton: "badge",
      className: "hidden md:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.aaead4abf5d0fd5e")} />,
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono font-normal">
        {row.original.transport}
      </Badge>
    ),
  },
  {
    id: "auth_type",
    accessorKey: "auth_type",
    meta: {
      get title() {
        return translateUi("ui.f3690a28345f92e0");
      },
      skeleton: "badge",
      className: "hidden md:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.f3690a28345f92e0")} />,
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.auth_type === "none" ? "neutral" : "success"} label={row.original.auth_type} />
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
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.920e413c7d41")} />,
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <StatusBadge
        tone={STATUS_TONES[row.original.status] || "neutral"}
        label={row.original.status || translateUi("ui.b23a6a8439c0")}
        tooltip={row.original.status === "reachable" ? MCP_REACHABLE_DESCRIPTION : undefined}
      />
    ),
  },
  {
    id: "allowed_tools",
    meta: {
      get title() {
        return translateUi("ui.ea93d6a262ec");
      },
      skeleton: "chips",
      className: "hidden lg:table-cell",
    },
    get header() {
      return translateUi("ui.ea93d6a262ec");
    },
    size: 180,
    enableSorting: false,
    cell: ({ row }) => {
      const tools = row.original.allowed_tools || [];
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {tools.length > 0
              ? translateUi("ui.cf2edb8a435f0f5f", undefined, {
                  v0: String(tools.length),
                  v1: String(tools.length !== 1 ? translateUi("inflections.s") : ""),
                })
              : translateUi("ui.81c151f98a190da7")}
          </span>
          {tools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tools.slice(0, 2).map((tool) => (
                <Badge key={tool} variant="secondary">
                  {tool}
                </Badge>
              ))}
              {tools.length > 2 && <span className="text-xs text-muted-foreground">+{tools.length - 2}</span>}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: {
      get title() {
        return translateUi("ui.dfd60b9aa5ca");
      },
      className: "hidden xl:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.dfd60b9aa5ca")} />,
    size: 140,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <span className="block max-w-60 truncate text-xs" title={row.original.created_by || undefined}>
        {row.original.created_by ? <DefaultProxyAdminTag userId={row.original.created_by} /> : "-"}
      </span>
    ),
  },
  {
    id: "is_public",
    accessorFn: (row) => row.mcp_info?.is_public === true,
    meta: {
      get title() {
        return translateUi("ui.5d01fd2c718f714c");
      },
      skeleton: "badge",
      className: "hidden md:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.5d01fd2c718f714c")} />,
    size: 100,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const publicA = rowA.original.mcp_info?.is_public === true ? 1 : 0;
      const publicB = rowB.original.mcp_info?.is_public === true ? 1 : 0;
      return publicA - publicB;
    },
    cell: ({ row }) => {
      const isPublic = row.original.mcp_info?.is_public === true;
      return (
        <StatusBadge
          tone={isPublic ? "success" : "neutral"}
          label={isPublic ? translateUi("ui.78797afdac993780") : translateUi("ui.bc96567e77ca7ec8")}
        />
      );
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
        <MCPHubRowActions server={row.original} onServerClick={onServerClick} />
      </div>
    ),
  },
];
