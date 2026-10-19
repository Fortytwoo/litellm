"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Users } from "lucide-react";
import React, { useMemo } from "react";

import { teamSpendByUserCall } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Button } from "@/components/ui/button";

import { Panel } from "../overview/Primitives";

import {
  buildTeamUserSpendCsv,
  downloadCsv,
  sortBySpendDesc,
  teamLabel,
  teamUserSpendCsvFileName,
  teamUserSpendRowId,
  userLabel,
  type TeamUserSpendRow,
} from "./teamUserSpend";

interface TeamUserSpendCardProps {
  accessToken: string | null;
  startTime: Date | null;
  endTime: Date | null;
  teamIds: string[];
}

const QUIET_HEADER = { headerClassName: "font-normal" };

const columns: ColumnDef<TeamUserSpendRow>[] = [
  {
    get header() {
      return translateUi("ui.5985039f106d");
    },
    accessorFn: teamLabel,
    id: "team",
    meta: QUIET_HEADER,
    cell: ({ row }) => teamLabel(row.original),
  },
  {
    get header() {
      return translateUi("ui.b512d97e7cbf");
    },
    accessorFn: userLabel,
    id: "user",
    meta: QUIET_HEADER,
    cell: ({ row }) => <span className="font-medium text-foreground">{userLabel(row.original)}</span>,
  },
  {
    get header() {
      return translateUi("ui.85f3d558db12");
    },
    accessorKey: "spend",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    get header() {
      return translateUi("ui.ada27592c957");
    },
    accessorKey: "api_requests",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => row.original.api_requests.toLocaleString(),
  },
  {
    get header() {
      return translateUi("ui.f3686bb328c6");
    },
    accessorKey: "successful_requests",
    meta: { numeric: true, className: "text-success", ...QUIET_HEADER },
    cell: ({ row }) => row.original.successful_requests.toLocaleString(),
  },
  {
    get header() {
      return translateUi("ui.031a8f0f659d");
    },
    accessorKey: "failed_requests",
    meta: { numeric: true, className: "text-destructive", ...QUIET_HEADER },
    cell: ({ row }) => row.original.failed_requests.toLocaleString(),
  },
  {
    get header() {
      return translateUi("ui.a039dfb9628b");
    },
    accessorKey: "total_tokens",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => row.original.total_tokens.toLocaleString(),
  },
];

const TeamUserSpendCard: React.FC<TeamUserSpendCardProps> = ({ accessToken, startTime, endTime, teamIds }) => {
  const { t: uiT } = useDashboardLanguage();

  const hasTeams = teamIds.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["teamSpendByUser", startTime?.toISOString(), endTime?.toISOString(), teamIds],
    queryFn: () =>
      accessToken && startTime && endTime ? teamSpendByUserCall(accessToken, startTime, endTime, teamIds) : null,
    enabled: Boolean(accessToken && startTime && endTime) && hasTeams,
  });
  const rows = useMemo(() => sortBySpendDesc(data?.results ?? []), [data]);

  return (
    <Panel
      icon={Users}
      title={uiT("ui.eb779b42c115daac")}
      action={
        <Button
          variant="outline"
          size="xs"
          disabled={!data || rows.length === 0}
          onClick={() => data && downloadCsv(buildTeamUserSpendCsv(data), teamUserSpendCsvFileName(data))}
        >
          <Download />
          {uiT("ui.a4023b89022f")}
        </Button>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">{uiT("ui.1127a9b67abc7af4")}</p>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={teamUserSpendRowId}
        isLoading={isLoading}
        maxBodyHeight={320}
        noDataMessage={teamIds.length === 0 ? uiT("ui.1cfb96b3d6f223df") : uiT("ui.06bd31e8b34c6cfc")}
        size="compact"
      />
    </Panel>
  );
};

export default TeamUserSpendCard;
