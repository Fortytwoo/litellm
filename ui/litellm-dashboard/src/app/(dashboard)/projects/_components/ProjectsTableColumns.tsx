"use client";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { LayersIcon } from "lucide-react";

import { ProjectResponse } from "@/app/(dashboard)/hooks/projects/useProjects";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectTeamCell({
  project,
  teamAliasMap,
  isTeamsLoading,
}: {
  project: ProjectResponse;
  teamAliasMap: Map<string, string>;
  isTeamsLoading: boolean;
}) {
  if (!project.team_id) return <span className="text-sm">—</span>;
  const alias = teamAliasMap.get(project.team_id);
  if (alias) {
    return (
      <span className="block max-w-60 truncate text-sm" title={alias}>
        {alias}
      </span>
    );
  }
  if (isTeamsLoading) return <Skeleton className="h-3.5 w-24" />;
  return (
    <span className="block max-w-60 truncate font-mono text-xs" title={project.team_id}>
      {project.team_id}
    </span>
  );
}

function ProjectModelsCell({ project }: { project: ProjectResponse }) {
  const models = project.models ?? [];
  return (
    <CellTooltip
      content={models.length > 0 ? models.join(", ") : "No models"}
      trigger={
        <Badge variant="outline" className="cursor-default gap-1.5 font-normal">
          <LayersIcon className="size-3.5" />
          {models.length}
        </Badge>
      }
    />
  );
}

interface ProjectsTableColumnsDeps {
  onProjectClick: (projectId: string) => void;
  teamAliasMap: Map<string, string>;
  isTeamsLoading: boolean;
}

export const getProjectsTableColumns = ({
  onProjectClick,
  teamAliasMap,
  isTeamsLoading,
}: ProjectsTableColumnsDeps): ColumnDef<ProjectResponse>[] => [
  {
    id: "project_id",
    accessorKey: "project_id",
    meta: { title: "ID" },
    header: "ID",
    size: 190,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.project_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onProjectClick(row.original.project_id)}
      />
    ),
  },
  {
    id: "project_alias",
    accessorFn: (row) => row.project_alias ?? "",
    meta: {
      get title() {
        return translateUi("ui.dcd1d5223f73");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.dcd1d5223f73")} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="block max-w-60 truncate text-sm font-medium" title={row.original.project_alias ?? undefined}>
        {row.original.project_alias ?? "—"}
      </span>
    ),
  },
  {
    id: "team",
    accessorFn: (row) => teamAliasMap.get(row.team_id ?? "") ?? "",
    meta: {
      get title() {
        return translateUi("ui.5985039f106d");
      },
    },
    header: ({ column }) => <DataTableSortHeader column={column} title={translateUi("ui.5985039f106d")} />,
    size: 180,
    enableSorting: true,
    cell: ({ row }) => (
      <ProjectTeamCell project={row.original} teamAliasMap={teamAliasMap} isTeamsLoading={isTeamsLoading} />
    ),
  },
  {
    id: "models",
    meta: {
      get title() {
        return translateUi("ui.d17d2d78d76e");
      },
      skeleton: "badge",
    },
    get header() {
      return translateUi("ui.d17d2d78d76e");
    },
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <ProjectModelsCell project={row.original} />,
  },
  {
    id: "status",
    accessorKey: "blocked",
    meta: {
      get title() {
        return translateUi("ui.920e413c7d41");
      },
      skeleton: "badge",
    },
    get header() {
      return translateUi("ui.920e413c7d41");
    },
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.blocked ? "error" : "success"}
        label={row.original.blocked ? translateUi("ui.18f2a0947f9d") : translateUi("ui.92340695899b")}
      />
    ),
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
    size: 140,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
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
    size: 140,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} precision="date" />,
  },
];
