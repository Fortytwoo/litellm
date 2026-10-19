"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useCanManageProjects } from "@/app/(dashboard)/hooks/projects/projectAccess";
import { Page, PageContent } from "@/components/shared/Page";
import { useProjects } from "@/app/(dashboard)/hooks/projects/useProjects";
import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { isUserTeamAdminForAnyTeam } from "@/utils/roles";
import { Folder, Plus, SearchIcon, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { PageHeader, PageHeaderControls, PageHeaderDescription, PageHeaderTitle } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { CreateProjectModal } from "./ProjectModals/CreateProjectModal";
import { ProjectDetail } from "./ProjectDetailsPage";
import { ProjectsTable } from "./ProjectsTable";
import { useClearProjectKeysTableState, useProjectsTableState } from "./useProjectsUrlState";

export function ProjectsPage() {
  const { t: uiT } = useDashboardLanguage();

  const { data: projects, isLoading } = useProjects();
  const { data: teams, isLoading: isTeamsLoading } = useTeams();
  const { userId } = useAuthorized();
  const canCreateProject = useCanManageProjects(isUserTeamAdminForAnyTeam(teams ?? null, userId ?? ""));

  const [selectedProjectId, setSelectedProjectId] = useQueryState(
    "project",
    parseAsString.withOptions({ history: "push" }),
  );
  const clearProjectKeysTableState = useClearProjectKeysTableState();
  const { search: searchText, setSearch: setSearchText } = useProjectsTableState();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const teamAliasMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of teams ?? []) {
      map.set(team.team_id, team.team_alias ?? team.team_id);
    }
    return map;
  }, [teams]);

  const filteredProjects = useMemo(() => {
    const list = projects ?? [];
    if (!searchText) return list;
    const lower = searchText.toLowerCase();
    return list.filter((p) => {
      const alias = teamAliasMap.get(p.team_id ?? "") ?? "";
      return (
        (p.project_alias ?? "").toLowerCase().includes(lower) ||
        p.project_id.toLowerCase().includes(lower) ||
        (p.description ?? "").toLowerCase().includes(lower) ||
        alias.toLowerCase().includes(lower)
      );
    });
  }, [projects, searchText, teamAliasMap]);

  const closeProject = () => {
    void setSelectedProjectId(null, { history: "replace" });
    clearProjectKeysTableState();
  };

  if (selectedProjectId) {
    return <ProjectDetail projectId={selectedProjectId} onBack={closeProject} />;
  }

  return (
    <Page>
      <PageHeader>
        <PageHeaderTitle>
          <Folder />
          {uiT("ui.04e2a9728af7")}
        </PageHeaderTitle>
        <PageHeaderDescription>{uiT("ui.48f5bd1b41600800")}</PageHeaderDescription>
        {canCreateProject && (
          <PageHeaderControls>
            <Button onClick={() => setIsCreateModalVisible(true)}>
              <Plus className="size-4" />
              {uiT("ui.4d3c29d3258c7bbf")}
            </Button>
          </PageHeaderControls>
        )}
      </PageHeader>

      <PageContent className="gap-3">
        <div className="flex items-center">
          <InputGroup className="max-w-[400px]">
            <InputGroupAddon>
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={uiT("ui.afe99f55d2da684c")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={uiT("ui.3b7ea51793e9d906")}
                  onClick={() => setSearchText("")}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        <ProjectsTable
          projects={filteredProjects}
          isLoading={isLoading}
          isFiltered={searchText.trim().length > 0}
          onProjectClick={(id) => void setSelectedProjectId(id)}
          teamAliasMap={teamAliasMap}
          isTeamsLoading={isTeamsLoading}
        />
      </PageContent>

      <CreateProjectModal isOpen={isCreateModalVisible} onClose={() => setIsCreateModalVisible(false)} />
    </Page>
  );
}
