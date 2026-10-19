"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useAccessGroupDetails } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroupDetails";
import { ArrowLeftIcon, BotIcon, EditIcon, KeyIcon, LayersIcon, ServerIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { BadgeLink } from "@/components/shared/BadgeLink";
import CopyButton from "@/components/shared/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import type { components } from "@/lib/http/schema";
import { keyDetailHref, teamDetailHref } from "@/utils/entityLinks";
import { AccessGroupEditModal } from "./AccessGroupsModal/AccessGroupEditModal";

type AccessGroupResource = components["schemas"]["AccessGroupResource"];

interface AccessGroupDetailProps {
  accessGroupId: string;
  onBack: () => void;
}

const MAX_PREVIEW = 5;

const shortId = (id: string) => (id.length > 20 ? `${id.slice(0, 10)}...${id.slice(-6)}` : id);

function ResourceList({ items, emptyMessage }: { items: readonly AccessGroupResource[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map(({ id, name }) => (
        <Card key={id} size="sm">
          <CardContent>
            {name ? (
              <SimpleTooltip content={id}>
                <span className="text-sm font-medium break-all text-foreground">{name}</span>
              </SimpleTooltip>
            ) : (
              <code className="font-mono text-xs break-all text-foreground">{id}</code>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ResourceBadge({
  resource: { id, name },
  href,
  fallback,
}: {
  resource: AccessGroupResource;
  href?: string;
  fallback: (id: string) => string;
}) {
  const badge = (
    <BadgeLink href={href} className={name ? undefined : "font-mono"}>
      {name ?? fallback(id)}
    </BadgeLink>
  );
  return name ? <SimpleTooltip content={id}>{badge}</SimpleTooltip> : badge;
}

export function AccessGroupDetail({ accessGroupId, onBack }: AccessGroupDetailProps) {
  const { t: uiT } = useDashboardLanguage();

  const { data: accessGroup, isLoading } = useAccessGroupDetails(accessGroupId);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showAllKeys, setShowAllKeys] = useState(false);
  const [showAllTeams, setShowAllTeams] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 px-12">
        <div className="flex min-h-[300px] items-center justify-center">
          <UiLoadingSpinner className="size-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!accessGroup) {
    return (
      <div className="p-6 px-12">
        <Button variant="ghost" size="icon" aria-label={uiT("ui.76900f1bfd16")} onClick={onBack} className="mb-4">
          <ArrowLeftIcon className="size-4" />
        </Button>
        <p className="py-8 text-center text-sm text-muted-foreground">{uiT("ui.311388100f0d068c")}</p>
      </div>
    );
  }

  const models = accessGroup.access_model_names.map((id) => ({ id, name: null }));
  const mcpServers = accessGroup.access_mcp_servers;
  const agents = accessGroup.access_agents;
  const keys = accessGroup.assigned_keys;
  const teams = accessGroup.assigned_teams;

  const displayedKeys = showAllKeys ? keys : keys.slice(0, MAX_PREVIEW);
  const displayedTeams = showAllTeams ? teams : teams.slice(0, MAX_PREVIEW);

  return (
    <div className="p-6 px-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label={uiT("ui.76900f1bfd16")} onClick={onBack}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{accessGroup.access_group_name}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>
                {uiT("ui.3ea36adcd1e02c94")} {accessGroup.access_group_id}
              </span>
              <CopyButton value={accessGroup.access_group_id} label={uiT("ui.d14f058925c80b80")} />
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditModalVisible(true)}>
          <EditIcon className="size-4" />
          {uiT("ui.aef907bb65e8bce4")}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{uiT("ui.37a6a835a224261f")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{uiT("ui.526e0087cc3f")}</dt>
            <dd className="text-foreground">{accessGroup.description || "—"}</dd>
            <dt className="text-muted-foreground">{uiT("ui.d70b9e24bca2")}</dt>
            <dd className="flex items-center gap-1 text-foreground">
              {new Date(accessGroup.created_at).toLocaleString()}
              {accessGroup.created_by && (
                <>
                  <span>{uiT("ui.a7e2d26e8d15814d")}</span>
                  <DefaultProxyAdminTag userId={accessGroup.created_by} />
                </>
              )}
            </dd>
            <dt className="text-muted-foreground">{uiT("ui.048c7f2ef9aa")}</dt>
            <dd className="flex items-center gap-1 text-foreground">
              {new Date(accessGroup.updated_at).toLocaleString()}
              {accessGroup.updated_by && (
                <>
                  <span>{uiT("ui.a7e2d26e8d15814d")}</span>
                  <DefaultProxyAdminTag userId={accessGroup.updated_by} />
                </>
              )}
            </dd>
          </dl>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="size-4" />
              {uiT("ui.f528daa5e46b192f")}
              <Badge variant="secondary">{keys.length}</Badge>
            </CardTitle>
            {keys.length > MAX_PREVIEW && (
              <CardAction>
                <Button variant="link" size="sm" onClick={() => setShowAllKeys(!showAllKeys)}>
                  {showAllKeys ? uiT("ui.0264d7b0ccb8") : uiT("ui.7a62a6f398911803", { v0: String(keys.length) })}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {keys.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayedKeys.map((key) => (
                  <ResourceBadge key={key.id} resource={key} href={keyDetailHref(key.id)} fallback={shortId} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{uiT("ui.821d8659df369290")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              {uiT("ui.65156c5e8dd12000")}
              <Badge variant="secondary">{teams.length}</Badge>
            </CardTitle>
            {teams.length > MAX_PREVIEW && (
              <CardAction>
                <Button variant="link" size="sm" onClick={() => setShowAllTeams(!showAllTeams)}>
                  {showAllTeams ? uiT("ui.0264d7b0ccb8") : uiT("ui.7a62a6f398911803", { v0: String(teams.length) })}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {teams.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayedTeams.map((team) => (
                  <ResourceBadge key={team.id} resource={team} href={teamDetailHref(team.id)} fallback={(id) => id} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{uiT("ui.c4dd895350af6544")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="models">
            <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
              <TabsTrigger value="models" className="flex-none gap-2 rounded-none px-4 py-2">
                <LayersIcon className="size-4" />
                {uiT("ui.d17d2d78d76e")}
                <Badge variant="secondary">{models.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="mcp" className="flex-none gap-2 rounded-none px-4 py-2">
                <ServerIcon className="size-4" />
                {uiT("ui.aab669a72882")}
                <Badge variant="secondary">{mcpServers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex-none gap-2 rounded-none px-4 py-2">
                <BotIcon className="size-4" />
                {uiT("ui.279b44d2ab4b")}
                <Badge variant="secondary">{agents.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="models" className="pt-4">
              <ResourceList items={models} emptyMessage={uiT("ui.41576033d90db488")} />
            </TabsContent>
            <TabsContent value="mcp" className="pt-4">
              <ResourceList items={mcpServers} emptyMessage={uiT("ui.35f2a853d7f05bd6")} />
            </TabsContent>
            <TabsContent value="agents" className="pt-4">
              <ResourceList items={agents} emptyMessage={uiT("ui.71997d5a4c7c034e")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AccessGroupEditModal
        visible={isEditModalVisible}
        accessGroup={accessGroup}
        onCancel={() => setIsEditModalVisible(false)}
      />
    </div>
  );
}
