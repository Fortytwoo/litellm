"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Agent } from "@/components/agents/types";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface AgentRowActionsProps {
  agent: Agent;
  onDeleteClick: (agentId: string, agentName: string) => void;
}

function AgentRowActions({ agent, onDeleteClick }: AgentRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.2befb4b6e315904a")}
        data-testid={`agent-actions-${agent.agent_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          variant="destructive"
          data-testid="agent-action-delete"
          onClick={() => onDeleteClick(agent.agent_id, agent.agent_name)}
        >
          <Trash2 />
          {uiT("ui.e2d0a54968ea")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AgentsTableColumnsDeps {
  isAdmin: boolean;
  onAgentClick: (agentId: string) => void;
  onDeleteClick: (agentId: string, agentName: string) => void;
}

export const getAgentsTableColumns = ({
  isAdmin,
  onAgentClick,
  onDeleteClick,
}: AgentsTableColumnsDeps): ColumnDef<Agent>[] => [
  {
    id: "agent_name",
    accessorKey: "agent_name",
    meta: {
      get title() {
        return translateUi("ui.28145084c72576a9");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.28145084c72576a9")} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.agent_name;
      return (
        <span className="block max-w-52 truncate text-sm font-medium text-foreground" title={name || undefined}>
          {name || "-"}
        </span>
      );
    },
  },
  {
    id: "agent_id",
    accessorKey: "agent_id",
    meta: {
      get title() {
        return translateUi("ui.510bce732db77286");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.510bce732db77286")} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.agent_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onAgentClick(row.original.agent_id)}
      />
    ),
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
    size: 130,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "model",
    meta: {
      get title() {
        return translateUi("ui.5e2c614c23f0");
      },
    },
    get header() {
      return translateUi("ui.5e2c614c23f0");
    },
    size: 170,
    enableSorting: false,
    cell: ({ row }) => {
      const model = row.original.litellm_params?.model;
      if (!model) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      return (
        <Badge variant="outline" className="max-w-40 font-normal">
          <span className="min-w-0 truncate" title={model}>
            {model}
          </span>
        </Badge>
      );
    },
  },
  {
    id: "created_at",
    accessorFn: (agent) => {
      const timestamp = agent.created_at ? new Date(agent.created_at).getTime() : 0;
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
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
    id: "status",
    meta: {
      get title() {
        return translateUi("ui.920e413c7d41");
      },
    },
    get header() {
      return translateUi("ui.920e413c7d41");
    },
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const hasKeys = (row.original.keys?.length ?? 0) > 0;
      if (row.original.jwt_auth_configured)
        return <StatusBadge tone="success" label={translateUi("ui.88594454ad2cfb20")} />;
      return hasKeys ? (
        <StatusBadge tone="success" label={translateUi("ui.92340695899b")} />
      ) : (
        <StatusBadge tone="warning" label={translateUi("ui.f0cae79a3657c1db")} />
      );
    },
  },
  ...(isAdmin
    ? [
        {
          id: "actions",
          meta: { className: "text-right", headerClassName: "text-right" },
          header: () => <span className="sr-only">{translateUi("ui.ff8059dc6752")}</span>,
          size: 64,
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <AgentRowActions agent={row.original} onDeleteClick={onDeleteClick} />
            </div>
          ),
        } satisfies ColumnDef<Agent>,
      ]
    : []),
];
