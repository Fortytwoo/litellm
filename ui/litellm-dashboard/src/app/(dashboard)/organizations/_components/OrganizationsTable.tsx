"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Building2, SearchX } from "lucide-react";
import React, { useMemo } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { Organization } from "@/components/networking";

import { getOrganizationsTableColumns } from "./OrganizationsTableColumns";
import { useOrganizationsTableState } from "./useOrganizationsTableState";

interface OrganizationsTableProps {
  organizations: Organization[];
  isLoading: boolean;
  userRole: string;
  searchActive: boolean;
  onOrganizationClick: (organizationId: string) => void;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
}

function EmptyState({ searchActive }: { searchActive: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  const Icon = searchActive ? SearchX : Building2;
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {searchActive ? uiT("ui.3ac208abedb2ffa9") : uiT("ui.5b7a7cbdd630d761")}
      </div>
      <div className="text-sm text-muted-foreground">
        {searchActive ? uiT("ui.f27850ccda82acf1") : uiT("ui.c41b32c8a4e3213d")}
      </div>
    </div>
  );
}

const OrganizationsTable: React.FC<OrganizationsTableProps> = ({
  organizations,
  isLoading,
  userRole,
  searchActive,
  onOrganizationClick,
  onEditClick,
  onDeleteClick,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const { sorting, onSortingChange, pagination, onPaginationChange } = useOrganizationsTableState();

  const columns = useMemo(() => {
    const deps = { userRole, onOrganizationClick, onEditClick, onDeleteClick };
    return getOrganizationsTableColumns(deps);
  }, [userRole, onOrganizationClick, onEditClick, onDeleteClick]);

  return (
    <DataTable
      data={organizations}
      paginationMode="client"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      columns={columns}
      getRowId={(organization, index) => organization.organization_id || String(index)}
      sortingMode="client"
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isLoading}
      loadingMessage={uiT("ui.c924ecff75c1fdbe")}
      noDataMessage={<EmptyState searchActive={searchActive} />}
      size="compact"
    />
  );
};

export default OrganizationsTable;
