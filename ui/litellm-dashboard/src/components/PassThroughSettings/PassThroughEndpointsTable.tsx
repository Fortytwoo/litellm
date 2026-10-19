"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Waypoints } from "lucide-react";
import { useMemo } from "react";

import { DataTable } from "@/components/shared/DataTable";

import { getPassThroughEndpointsTableColumns } from "./PassThroughEndpointsTableColumns";
import type { passThroughItem } from "./PassThroughSettings";

interface PassThroughEndpointsTableProps {
  endpoints: passThroughItem[];
  isLoading: boolean;
  onEndpointClick: (endpointId: string) => void;
  onDeleteClick: (endpointId: string) => void;
}

function EmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Waypoints className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.3271333e826e3099")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.b63afdf2be11bdc4")}</div>
    </div>
  );
}

export function PassThroughEndpointsTable({
  endpoints,
  isLoading,
  onEndpointClick,
  onDeleteClick,
}: PassThroughEndpointsTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const columns = useMemo(
    () => getPassThroughEndpointsTableColumns({ onEndpointClick, onDeleteClick }),
    [onEndpointClick, onDeleteClick],
  );

  return (
    <DataTable
      data={endpoints}
      paginationMode="client"
      columns={columns}
      getRowId={(endpoint, index) => endpoint.id || endpoint.path || String(index)}
      isLoading={isLoading}
      loadingMessage={uiT("ui.6d389643f62ba49b")}
      noDataMessage={<EmptyState />}
      size="compact"
    />
  );
}
