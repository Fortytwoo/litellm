"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Plus, RefreshCw, Search, X } from "lucide-react";
import { useRoutingGroups, useSaveRoutingGroups } from "@/app/(dashboard)/hooks/routingGroups/useRoutingGroups";
import { useRouterFields } from "@/app/(dashboard)/hooks/router/useRouterFields";
import { useModelHub } from "@/app/(dashboard)/hooks/models/useModels";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useProxySettings from "@/app/(dashboard)/hooks/proxySettings/useProxySettings";
import RoutingGroupsTable from "./RoutingGroupsTable";
import RoutingGroupModal from "./RoutingGroupModal";
import { toast } from "@/lib/toast";
import type { RoutingGroup } from "./types";
import { groupNameByModel } from "./modelOwnership";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RoutingGroups: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const { data, isLoading, refetch, isFetching } = useRoutingGroups();
  const { data: routerFields } = useRouterFields();
  const { data: modelHub } = useModelHub();
  const { accessToken } = useAuthorized();
  const proxySettings = useProxySettings(accessToken);
  const saveMutation = useSaveRoutingGroups();

  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingGroup, setEditingGroup] = useState<RoutingGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<RoutingGroup | null>(null);

  const groups = useMemo(() => data?.routingGroups ?? [], [data?.routingGroups]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.group_name.toLowerCase().includes(q) ||
        g.routing_strategy.toLowerCase().includes(q) ||
        g.models.some((m) => m.toLowerCase().includes(q)),
    );
  }, [groups, searchQuery]);

  const availableStrategies = useMemo(() => {
    if (data?.availableStrategies?.length) return data.availableStrategies;
    if (routerFields?.routing_group_strategies?.length) return routerFields.routing_group_strategies;
    const fromFields = routerFields?.fields?.find((f) => f.field_name === "routing_strategy")?.options;
    return fromFields ?? [];
  }, [data, routerFields]);

  const strategyDescriptions = routerFields?.routing_strategy_descriptions ?? {};

  const ownerByModel = useMemo(
    () => groupNameByModel(groups, drawerMode === "edit" ? editingGroup?.group_name : undefined),
    [groups, drawerMode, editingGroup],
  );

  const modelOptions = useMemo<string[]>(() => {
    const records = (modelHub?.data ?? []) as Array<{ model_group?: string }>;
    const names = records.map((r) => r.model_group).filter((n): n is string => Boolean(n));
    return Array.from(new Set(names));
  }, [modelHub]);

  const openCreate = () => {
    setDrawerMode("create");
    setEditingGroup(null);
    setDrawerOpen(true);
  };

  const openEdit = (group: RoutingGroup) => {
    setDrawerMode("edit");
    setEditingGroup(group);
    setDrawerOpen(true);
  };

  const handleSubmit = async (incoming: RoutingGroup) => {
    const next: RoutingGroup[] =
      drawerMode === "create"
        ? [...groups, incoming]
        : groups.map((g) => (g.group_name === editingGroup?.group_name ? incoming : g));

    try {
      await saveMutation.mutateAsync(next);
      toast.success(
        drawerMode === "create"
          ? translateUi("ui.f05fdb46edd8f302", undefined, { v0: String(incoming.group_name) })
          : translateUi("ui.c05efc14cf1845cd", undefined, { v0: String(incoming.group_name) }),
      );
      setDrawerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translateUi("ui.77d426ce7aaf0c8f"));
    }
  };

  const confirmDelete = async () => {
    if (!deletingGroup) return;
    const next = groups.filter((g) => g.group_name !== deletingGroup.group_name);
    try {
      await saveMutation.mutateAsync(next);
      toast.success(translateUi("ui.5ec24ab5fb6b538c", undefined, { v0: String(deletingGroup.group_name) }));
      setDeletingGroup(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : translateUi("ui.5b8018d2025e45a9"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <Card size="sm">
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-3">
            <InputGroup className="max-w-sm">
              <InputGroupAddon>
                <Search className="size-4 text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={uiT("ui.2157e1a2aa60f2c8")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={uiT("ui.3b7ea51793e9d906")}
                    onClick={() => setSearchQuery("")}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching && !isLoading}
                aria-busy={isFetching && !isLoading}
              >
                <RefreshCw />
                {uiT("ui.0e9161011702")}
              </Button>
              <Button onClick={openCreate}>
                <Plus />
                {uiT("ui.1213394682bfa8c6")}
              </Button>
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                {uiT("ui.d604310a789a")} {filteredGroups.length}{" "}
                {filteredGroups.length === 1 ? uiT("ui.f6a214f7a5fcda0c") : uiT("ui.c099142bc3186ded")}
              </span>
            </div>
          </div>

          <RoutingGroupsTable
            groups={filteredGroups}
            isLoading={isLoading}
            onEdit={openEdit}
            onDelete={(g) => setDeletingGroup(g)}
            proxyBaseUrl={proxySettings.LITELLM_UI_API_DOC_BASE_URL?.trim() || proxySettings.PROXY_BASE_URL || ""}
          />
        </CardContent>
      </Card>

      <RoutingGroupModal
        open={drawerOpen}
        mode={drawerMode}
        initialValue={editingGroup}
        availableStrategies={availableStrategies}
        strategyDescriptions={strategyDescriptions}
        modelOptions={modelOptions}
        existingGroupNames={groups.map((g) => g.group_name)}
        groupNameByModel={ownerByModel}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        saving={saveMutation.isPending}
      />

      <Dialog open={Boolean(deletingGroup)} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{uiT("ui.9ac393f2d38d78dd")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground">
            {deletingGroup?.routing_strategy === "priority" ? (
              <>
                {uiT("ui.78bd4cc7158f3be3")} <span className="font-medium">{deletingGroup.group_name}</span>{" "}
                {uiT("ui.ff9d05528d561228")}
              </>
            ) : (
              <>
                {uiT("ui.28ead3843429f610")} <span className="font-medium">{deletingGroup?.group_name}</span>{" "}
                {uiT("ui.dedfe93a06539db6")}
              </>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGroup(null)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button
              onClick={confirmDelete}
              variant="destructive"
              disabled={saveMutation.isPending}
              aria-busy={saveMutation.isPending}
            >
              {uiT("ui.e2d0a54968ea")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutingGroups;
