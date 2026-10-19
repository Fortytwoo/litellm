"use client";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import { ToolRow } from "@/components/networking";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, UserPopoverCell } from "@/components/shared/table_cells";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { PolicySelect } from "./PolicySelect";

interface ToolPoliciesTableColumnsDeps {
  onSelectTool: (toolName: string) => void;
  savingInput: ReadonlySet<string>;
  savingOutput: ReadonlySet<string>;
  onInputPolicyChange: (toolName: string, policy: string) => void;
  onOutputPolicyChange: (toolName: string, policy: string) => void;
}

function TruncatedText({ value, className }: { value: string | undefined; className?: string }) {
  const text = value ?? "-";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className={className}>{text}</span>} />
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const getToolPoliciesTableColumns = ({
  onSelectTool,
  savingInput,
  savingOutput,
  onInputPolicyChange,
  onOutputPolicyChange,
}: ToolPoliciesTableColumnsDeps): ColumnDef<ToolRow>[] => [
  {
    id: "created_at",
    accessorFn: (row) => row.created_at ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.96a5ba634bfc2ed4")} />,
    size: 170,
    enableGlobalFilter: false,
    cell: ({ row }) => <DateCell value={row.original.created_at} />,
  },
  {
    id: "tool_name",
    accessorFn: (row) => row.tool_name,
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.49380bcd29241f72")} />,
    minSize: 200,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.tool_name}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-60"
        onClick={() => onSelectTool(row.original.tool_name)}
      />
    ),
  },
  {
    id: "input_policy",
    accessorFn: (row) => row.input_policy,
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.9d54c31179909a71")} />,
    size: 140,
    filterFn: "equalsString",
    meta: {
      get title() {
        return translateUi("ui.9d54c31179909a71");
      },
      skeleton: "badge",
    },
    cell: ({ row }) => (
      <PolicySelect
        value={row.original.input_policy}
        toolName={row.original.tool_name}
        saving={savingInput.has(row.original.tool_name)}
        onChange={onInputPolicyChange}
        policyType="input"
      />
    ),
  },
  {
    id: "output_policy",
    accessorFn: (row) => row.output_policy,
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.ec12c1867becb495")} />,
    size: 140,
    filterFn: "equalsString",
    meta: {
      get title() {
        return translateUi("ui.ec12c1867becb495");
      },
      skeleton: "badge",
    },
    cell: ({ row }) => (
      <PolicySelect
        value={row.original.output_policy}
        toolName={row.original.tool_name}
        saving={savingOutput.has(row.original.tool_name)}
        onChange={onOutputPolicyChange}
        policyType="output"
      />
    ),
  },
  {
    id: "call_count",
    accessorFn: (row) => row.call_count ?? 0,
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.2aa5522eac07fc95")} />,
    size: 100,
    enableGlobalFilter: false,
    meta: { numeric: true },
    cell: ({ row }) => <span className="font-mono">{(row.original.call_count ?? 0).toLocaleString()}</span>,
  },
  {
    id: "team_id",
    accessorFn: (row) => row.team_id ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.6ed5a592c422")} />,
    size: 160,
    filterFn: "equalsString",
    meta: {
      get title() {
        return translateUi("ui.6ed5a592c422");
      },
    },
    cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
  },
  {
    id: "key_hash",
    accessorFn: (row) => row.key_hash ?? "",
    get header() {
      return translateUi("ui.415fd17d81f2");
    },
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.key_hash} />,
  },
  {
    id: "key_alias",
    accessorFn: (row) => row.key_alias ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.750c6798ab7ffc9a")} />,
    size: 150,
    filterFn: "equalsString",
    meta: {
      get title() {
        return translateUi("ui.750c6798ab7ffc9a");
      },
    },
    cell: ({ row }) => <TruncatedText value={row.original.key_alias} className="block max-w-32 truncate" />,
  },
  {
    id: "user",
    accessorFn: (row) => row.user?.user_alias ?? row.user?.user_email ?? row.user?.user_id ?? "",
    header: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<span>{translateUi("ui.b512d97e7cbf")}</span>} />
          <TooltipContent>{translateUi("ui.3393d9d48f37c4d5")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
    size: 160,
    enableSorting: false,
    meta: {
      get title() {
        return translateUi("ui.b512d97e7cbf");
      },
    },
    cell: ({ row }) => (
      <UserPopoverCell
        userAlias={row.original.user?.user_alias ?? null}
        userEmail={row.original.user?.user_email ?? null}
        userId={row.original.user?.user_id ?? null}
        width={160}
      />
    ),
  },
  {
    id: "user_agent",
    accessorFn: (row) => row.user_agent ?? "",
    get header() {
      return translateUi("ui.62e013458fd79bac");
    },
    size: 180,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <TruncatedText
        value={row.original.user_agent}
        className="block max-w-40 truncate font-mono text-muted-foreground"
      />
    ),
  },
];
