"use client";
import { translateText } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { getProviderLogoAndName } from "@/components/provider_info_helpers";
import { PUBLIC_MODEL_HUB_SORTABLE_FIELDS } from "@/components/publicModelHub/publicModelHubFilters";

export interface ModelGroupInfo {
  model_group: string;
  providers: string[];
  max_input_tokens?: number;
  max_output_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  mode?: string;
  tpm?: number;
  rpm?: number;
  supports_parallel_function_calling: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supported_openai_params?: string[];
  health_status?: string;
  health_response_time?: number;
  health_checked_at?: string;
  [key: string]: any;
}

export interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
  iconUrl?: string;
  provider?: {
    organization: string;
    url: string;
  };
  documentationUrl?: string;
  [key: string]: any;
}

export interface MCPServerData {
  server_id: string;
  name: string;
  alias?: string | null;
  server_name: string;
  transport: string;
  spec_path?: string | null;
  auth_type: string;
  mcp_info: {
    server_name: string;
    description?: string;
    mcp_server_cost_info?: any;
  };
  [key: string]: any;
}

const formatCapabilityName = (key: string) =>
  key
    .replace(/^supports_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatCost = (cost: number) => `$${(cost * 1_000_000).toFixed(4)}`;

const formatTokens = (tokens: number | undefined) => {
  if (!tokens) return "N/A";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
};

const formatLimits = (rpm?: number, tpm?: number) => {
  const limits = [...(rpm ? [`RPM: ${rpm.toLocaleString()}`] : []), ...(tpm ? [`TPM: ${tpm.toLocaleString()}`] : [])];
  return limits.length > 0 ? limits.join(", ") : "N/A";
};

const getModeIcon = (mode: string) => {
  switch (mode?.toLowerCase()) {
    case "chat":
      return "💬";
    case "rerank":
      return "🔄";
    case "embedding":
      return "📄";
    default:
      return "🤖";
  }
};

const HEALTH_TONES: Record<string, StatusTone> = {
  healthy: "success",
  unhealthy: "error",
};

function ProviderChips({ providers }: { providers: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {providers.map((provider) => {
        const { logo } = getProviderLogoAndName(provider);
        return (
          <span key={provider} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
            {logo && (
              <img
                src={logo}
                alt={provider}
                className="size-3 shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="capitalize">{provider}</span>
          </span>
        );
      })}
    </div>
  );
}

function OverflowChips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <Badge variant="secondary">{items[0]}</Badge>
      {items.length > 1 && (
        <CellTooltip
          content={
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item} className="text-xs">
                  • {item}
                </div>
              ))}
            </div>
          }
          trigger={<span className="cursor-default text-xs text-muted-foreground">+{items.length - 1}</span>}
        />
      )}
    </div>
  );
}

interface PublicModelHubColumnsDeps {
  onModelClick: (model: ModelGroupInfo) => void;
}

export const getPublicModelHubColumns = ({ onModelClick }: PublicModelHubColumnsDeps): ColumnDef<ModelGroupInfo>[] => {
  const columns: ColumnDef<ModelGroupInfo>[] = [
    {
      id: "model_group",
      accessorKey: "model_group",
      meta: {
        get title() {
          return translateUi("ui.a501a70a42b98bc7");
        },
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.a501a70a42b98bc7")} />,
      size: 200,
      sortingFn: "alphanumeric",
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.model_group}
          titleClassName="font-mono text-xs font-normal"
          className="max-w-72"
          onClick={() => onModelClick(row.original)}
        />
      ),
    },
    {
      id: "providers",
      accessorKey: "providers",
      meta: {
        get title() {
          return translateUi("ui.996c32b35f2182a9");
        },
        skeleton: "chips",
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.996c32b35f2182a9")} />,
      size: 150,
      sortingFn: (rowA, rowB) =>
        (rowA.original.providers ?? []).join(", ").localeCompare((rowB.original.providers ?? []).join(", ")),
      cell: ({ row }) => <ProviderChips providers={row.original.providers ?? []} />,
    },
    {
      id: "mode",
      accessorKey: "mode",
      meta: {
        get title() {
          return translateUi("ui.5e23ec6a300dc60a");
        },
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.5e23ec6a300dc60a")} />,
      size: 110,
      sortingFn: "alphanumeric",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 text-sm">
          <span>{getModeIcon(row.original.mode || "")}</span>
          <span>{row.original.mode || translateUi("ui.460b3a7da007b7af")}</span>
        </span>
      ),
    },
    {
      id: "max_input_tokens",
      accessorKey: "max_input_tokens",
      meta: {
        get title() {
          return translateUi("ui.a6a0257f985f0ac4");
        },
        numeric: true,
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.a6a0257f985f0ac4")} />,
      size: 100,
      cell: ({ row }) => <span className="text-sm">{formatTokens(row.original.max_input_tokens)}</span>,
    },
    {
      id: "max_output_tokens",
      accessorKey: "max_output_tokens",
      meta: {
        get title() {
          return translateUi("ui.35e8d5deb0b0f91a");
        },
        numeric: true,
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.35e8d5deb0b0f91a")} />,
      size: 100,
      cell: ({ row }) => <span className="text-sm">{formatTokens(row.original.max_output_tokens)}</span>,
    },
    {
      id: "input_cost_per_token",
      accessorKey: "input_cost_per_token",
      meta: {
        get title() {
          return translateUi("ui.d9245b63d0f00e43");
        },
        numeric: true,
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.d9245b63d0f00e43")} />,
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.input_cost_per_token
            ? formatCost(row.original.input_cost_per_token)
            : translateUi("ui.f411a1fb62758b4c")}
        </span>
      ),
    },
    {
      id: "output_cost_per_token",
      accessorKey: "output_cost_per_token",
      meta: {
        get title() {
          return translateUi("ui.7fba7dad023df4d1");
        },
        numeric: true,
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.7fba7dad023df4d1")} />,
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.output_cost_per_token
            ? formatCost(row.original.output_cost_per_token)
            : translateUi("ui.f411a1fb62758b4c")}
        </span>
      ),
    },
    {
      id: "features",
      meta: {
        get title() {
          return translateUi("ui.5697d03daef4de9c");
        },
        skeleton: "chips",
      },
      get header() {
        return translateUi("ui.5697d03daef4de9c");
      },
      size: 140,
      cell: ({ row }) => {
        const features = Object.entries(row.original)
          .filter(([key, value]) => key.startsWith("supports_") && value === true)
          .map(([key]) => formatCapabilityName(key));
        return <OverflowChips items={features} />;
      },
    },
    {
      id: "health_status",
      accessorKey: "health_status",
      meta: {
        get title() {
          return translateUi("ui.97b7a73d47fd543e");
        },
        skeleton: "badge",
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.97b7a73d47fd543e")} />,
      size: 130,
      cell: ({ row }) => {
        const model = row.original;
        const responseTimeLabel = model.health_response_time
          ? `Response Time: ${Number(model.health_response_time).toFixed(2)}ms`
          : "N/A";
        const lastCheckedLabel = model.health_checked_at
          ? `Last Checked: ${new Date(model.health_checked_at).toLocaleString()}`
          : "N/A";
        return (
          <CellTooltip
            content={
              <>
                <div>{translateText(responseTimeLabel)}</div>
                <div>{translateText(lastCheckedLabel)}</div>
              </>
            }
            trigger={
              <span className="capitalize">
                <StatusBadge
                  tone={HEALTH_TONES[model.health_status ?? ""] || "neutral"}
                  label={model.health_status ?? translateUi("ui.b764cdc0eab7")}
                />
              </span>
            }
          />
        );
      },
    },
    {
      id: "rpm",
      accessorKey: "rpm",
      meta: {
        get title() {
          return translateUi("ui.dffb64dc70011ecf");
        },
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.dffb64dc70011ecf")} />,
      size: 150,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatLimits(row.original.rpm, row.original.tpm)}</span>
      ),
    },
  ];
  return columns.map((column) => ({
    ...column,
    enableSorting: PUBLIC_MODEL_HUB_SORTABLE_FIELDS.includes(String(column.id)),
  }));
};

interface PublicAgentHubColumnsDeps {
  onAgentClick: (agent: AgentCard) => void;
}

export const getPublicAgentHubColumns = ({ onAgentClick }: PublicAgentHubColumnsDeps): ColumnDef<AgentCard>[] => [
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
      <IdentityCell
        title={row.original.name}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-72"
        onClick={() => onAgentClick(row.original)}
      />
    ),
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
    size: 260,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm" title={row.original.description || undefined}>
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
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.dd167905de0defca")} />,
    size: 90,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => <span className="text-sm">{row.original.version}</span>,
  },
  {
    id: "provider",
    meta: {
      get title() {
        return translateUi("ui.472590ae974d");
      },
    },
    get header() {
      return translateUi("ui.472590ae974d");
    },
    size: 130,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.provider ? (
        <span className="text-sm font-medium">{row.original.provider.organization}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
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
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <OverflowChips items={(row.original.skills || []).map((skill) => skill.name)} />,
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
            <Badge key={capability} variant="outline" className="capitalize">
              {capability}
            </Badge>
          ))}
        </div>
      );
    },
  },
];

interface PublicMCPHubColumnsDeps {
  onServerClick: (server: MCPServerData) => void;
}

export const getPublicMCPHubColumns = ({ onServerClick }: PublicMCPHubColumnsDeps): ColumnDef<MCPServerData>[] => [
  {
    id: "server_name",
    accessorKey: "server_name",
    meta: {
      get title() {
        return translateUi("ui.bc4816425ebe8079");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.bc4816425ebe8079")} />,
    size: 180,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.server_name}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-72"
        onClick={() => onServerClick(row.original)}
      />
    ),
  },
  {
    id: "description",
    meta: {
      get title() {
        return translateUi("ui.526e0087cc3f");
      },
    },
    get header() {
      return translateUi("ui.526e0087cc3f");
    },
    size: 260,
    enableSorting: false,
    cell: ({ row }) => {
      const description = String(row.original.mcp_info?.description ?? "-");
      return (
        <span className="block max-w-72 truncate text-sm" title={description}>
          {description}
        </span>
      );
    },
  },
  {
    id: "transport",
    accessorKey: "transport",
    meta: {
      get title() {
        return translateUi("ui.aaead4abf5d0fd5e");
      },
      skeleton: "badge",
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.aaead4abf5d0fd5e")} />,
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono font-normal uppercase">
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
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.f3690a28345f92e0")} />,
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.auth_type === "none" ? "neutral" : "success"} label={row.original.auth_type} />
    ),
  },
];
