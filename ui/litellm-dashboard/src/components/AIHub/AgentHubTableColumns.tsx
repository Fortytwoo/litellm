"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Info, MoreHorizontal } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/table_cells";
import { IdentityCell } from "@/components/shared/table_cells";
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

export interface AgentHubData {
  agent_id?: string;
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities?: {
    streaming?: boolean;
    [key: string]: any;
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: Array<{
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
  }>;
  supportsAuthenticatedExtendedCard?: boolean;
  is_public?: boolean;
  [key: string]: any;
}

interface AgentHubRowActionsProps {
  agent: AgentHubData;
  onAgentClick: (agent: AgentHubData) => void;
}

function AgentHubRowActions({ agent, onAgentClick }: AgentHubRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.2befb4b6e315904a")}
        data-testid={`agent-hub-actions-${agent.agent_id || agent.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem data-testid="agent-hub-action-details" onClick={() => onAgentClick(agent)}>
          <Info />
          {uiT("ui.d1bf045bb524dae5")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="agent-hub-action-copy"
          onClick={() => void copyToClipboard(agent.name, "Agent name copied")}
        >
          <Copy />
          {uiT("ui.3501411e98639126")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AgentHubTableColumnsDeps {
  onAgentClick: (agent: AgentHubData) => void;
}

export const getAgentHubTableColumns = ({ onAgentClick }: AgentHubTableColumnsDeps): ColumnDef<AgentHubData>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: {
      get title() {
        return translateUi("ui.28145084c72576a9");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.28145084c72576a9")} />,
    size: 200,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell title={row.original.name} className="max-w-72" onClick={() => onAgentClick(row.original)} />
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
    id: "version",
    accessorKey: "version",
    meta: {
      get title() {
        return translateUi("ui.dd167905de0defca");
      },
      skeleton: "badge",
      className: "hidden lg:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.dd167905de0defca")} />,
    size: 100,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono font-normal">
        v{row.original.version}
      </Badge>
    ),
  },
  {
    id: "protocolVersion",
    accessorKey: "protocolVersion",
    meta: {
      get title() {
        return translateUi("ui.cf0883343f4abef7");
      },
      className: "hidden lg:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.cf0883343f4abef7")} />,
    size: 100,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => <span className="text-xs">{row.original.protocolVersion || "-"}</span>,
  },
  {
    id: "skills",
    meta: {
      get title() {
        return translateUi("ui.66d0f523a379");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.66d0f523a379");
    },
    size: 180,
    enableSorting: false,
    cell: ({ row }) => {
      const skills = row.original.skills || [];
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {skills.length} {translateUi("ui.9c53c074d7ac6a27")}
            {skills.length !== 1 ? "s" : ""}
          </span>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 2).map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
              {skills.length > 2 && <span className="text-xs text-muted-foreground">+{skills.length - 2}</span>}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "capabilities",
    meta: {
      get title() {
        return translateUi("ui.9460f16ac9b5171e");
      },
      skeleton: "chips",
    },
    get header() {
      return translateUi("ui.9460f16ac9b5171e");
    },
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const capabilityList = Object.entries(row.original.capabilities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key);
      if (capabilityList.length === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {capabilityList.map((capability) => (
            <Badge key={capability} variant="outline">
              {capability}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "io_modes",
    meta: {
      get title() {
        return translateUi("ui.162085125f3d6640");
      },
      skeleton: "twoLine",
      className: "hidden xl:table-cell",
    },
    get header() {
      return translateUi("ui.162085125f3d6640");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const inputModes = row.original.defaultInputModes || [];
      const outputModes = row.original.defaultOutputModes || [];
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <span>
            <span className="font-medium">{translateUi("ui.76d6aad1a2a03c8f")}</span> {inputModes.join(", ") || "-"}
          </span>
          <span>
            <span className="font-medium">{translateUi("ui.5f2b6694319d1bc0")}</span> {outputModes.join(", ") || "-"}
          </span>
        </div>
      );
    },
  },
  {
    id: "is_public",
    accessorKey: "is_public",
    meta: {
      get title() {
        return translateUi("ui.591935b15b1c88e2");
      },
      skeleton: "badge",
      className: "hidden md:table-cell",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.591935b15b1c88e2")} />,
    size: 100,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const publicA = rowA.original.is_public === true ? 1 : 0;
      const publicB = rowB.original.is_public === true ? 1 : 0;
      return publicA - publicB;
    },
    cell: ({ row }) => {
      const isPublic = row.original.is_public === true;
      return (
        <StatusBadge
          tone={isPublic ? "success" : "neutral"}
          label={isPublic ? translateUi("ui.85a39ab345d672ff") : translateUi("ui.1ea442a134b2a184")}
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
        <AgentHubRowActions agent={row.original} onAgentClick={onAgentClick} />
      </div>
    ),
  },
];
