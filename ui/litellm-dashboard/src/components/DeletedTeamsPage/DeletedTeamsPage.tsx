"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { PaginationState } from "@tanstack/react-table";
import { Info } from "lucide-react";
import { PageContent } from "@/components/shared/Page";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/shared/DataTable";
import { useDeletedTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { DeletedTeamsTable } from "./DeletedTeamsTable/DeletedTeamsTable";

export default function DeletedTeamsPage() {
  const { t: uiT } = useDashboardLanguage();

  const { premiumUser } = useAuthorized();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE_OPTIONS[0],
  });
  const { data: teamsData, isLoading } = useDeletedTeams(pagination.pageIndex + 1, pagination.pageSize);

  return (
    <PageContent>
      {!premiumUser && (
        <Alert className="shrink-0">
          <Info />
          <AlertTitle>{uiT("ui.04ed5d8219ac")}</AlertTitle>
          <AlertDescription>{uiT("ui.f81271cb61db")}</AlertDescription>
        </Alert>
      )}
      <DeletedTeamsTable
        teams={teamsData?.teams ?? []}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={teamsData?.total ?? 0}
      />
    </PageContent>
  );
}
