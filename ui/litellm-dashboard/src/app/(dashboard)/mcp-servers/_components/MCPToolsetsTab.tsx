"use client";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useCallback } from "react";
import { z } from "zod";
import { SortingState } from "@tanstack/react-table";
import { Inbox, Plus, X } from "lucide-react";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcpServers/useMCPToolsets";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import {
  createMCPToolset,
  updateMCPToolset,
  deleteMCPToolset,
  listMCPTools,
  getProxyBaseUrl,
} from "@/components/networking";
import { MCPToolset, MCPToolsetTool } from "@/components/mcp_tools/types";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";
import { displayToolName, getMCPToolsetTableColumns } from "./MCPToolsetTableColumns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MCPToolsetsTabProps {
  accessToken: string | null;
  userRole: string | null;
}

const toolsetSchema = z.object({
  toolset_name: z.string().min(1, "Please enter a toolset name"),
  description: z.string(),
});

type ToolsetFormValues = z.infer<typeof toolsetSchema>;

interface MCPToolListProps {
  serverId: string;
  serverName: string;
  accessToken: string | null;
  selectedTools: MCPToolsetTool[];
  onToggle: (tool: MCPToolsetTool) => void;
}

interface ToolEntry {
  name: string;
  description?: string;
}

function MCPToolList({ serverId, serverName, accessToken, selectedTools, onToggle }: MCPToolListProps) {
  const { t: uiT } = useDashboardLanguage();

  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const selectedSet = new Set(selectedTools.filter((t) => t.server_id === serverId).map((t) => t.tool_name));

  const fetchTools = useCallback(async () => {
    if (!accessToken || tools.length > 0) return;
    setLoading(true);
    try {
      const result = await listMCPTools(accessToken, serverId);
      const toolList = Array.isArray(result) ? result : result?.tools ?? [];
      setTools(toolList.map((t: any) => ({ name: t.name ?? t.tool_name ?? t, description: t.description ?? "" })));
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, serverId, tools.length]);

  const handleToggle = () => {
    if (!expanded) fetchTools();
    setExpanded(!expanded);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-accent transition-colors"
        onClick={handleToggle}
      >
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-info shrink-0" />
          {serverName}
          {selectedSet.size > 0 && (
            <span className="ml-1 text-xs text-purple-600 font-semibold dark:text-purple-400">
              {selectedSet.size} {uiT("ui.d7cbbb688b2e506c")}
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="p-2">
          {loading ? (
            <div className="flex justify-center py-3">
              <UiLoadingSpinner className="size-4" />
            </div>
          ) : tools.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2">{uiT("ui.b9f2d8d719bef448")}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {tools.map((tool) => {
                const selected = selectedSet.has(tool.name);
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => onToggle({ server_id: serverId, tool_name: tool.name })}
                    className={`flex items-start justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selected
                        ? "bg-purple-50 border border-purple-300 dark:bg-purple-950 dark:border-purple-700"
                        : "bg-card border border-border hover:bg-muted"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium leading-tight ${selected ? "text-purple-800 dark:text-purple-200" : "text-foreground"}`}
                      >
                        {tool.name}
                      </p>
                      {tool.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                    </div>
                    {selected && (
                      <span className="text-purple-500 text-xs font-semibold ml-2 shrink-0 mt-0.5 dark:text-purple-400">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CreateToolsetModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string | undefined, tools: MCPToolsetTool[]) => Promise<void>;
  accessToken: string | null;
  initialToolset?: MCPToolset;
}

function CreateToolsetModal({ open, onClose, onSave, accessToken, initialToolset }: CreateToolsetModalProps) {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(toolsetSchema, {
    defaultValues: {
      toolset_name: initialToolset?.toolset_name || "",
      description: initialToolset?.description || "",
    },
  });
  const [selectedTools, setSelectedTools] = useState<MCPToolsetTool[]>(initialToolset?.tools || []);
  const [saving, setSaving] = useState(false);
  const [serverSearch, setServerSearch] = useState("");
  const { data: mcpServers = [] } = useMCPServers();
  const serverPrefixById = React.useMemo(
    () => new Map(mcpServers.map((s) => [s.server_id, s.alias || s.server_name || s.server_id])),
    [mcpServers],
  );

  React.useEffect(() => {
    if (open) {
      form.reset({
        toolset_name: initialToolset?.toolset_name || "",
        description: initialToolset?.description || "",
      });
      setSelectedTools(initialToolset?.tools || []);
      setServerSearch("");
    }
  }, [open, initialToolset, form]);

  const handleToggleTool = (tool: MCPToolsetTool) => {
    setSelectedTools((prev) => {
      const exists = prev.some((t) => t.server_id === tool.server_id && t.tool_name === tool.tool_name);
      return exists
        ? prev.filter((t) => !(t.server_id === tool.server_id && t.tool_name === tool.tool_name))
        : [...prev, tool];
    });
  };

  const handleSubmit = async (values: ToolsetFormValues) => {
    setSaving(true);
    try {
      await onSave(values.toolset_name, values.description, selectedTools);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const filteredServers = mcpServers.filter((s) => {
    const q = serverSearch.toLowerCase();
    return !q || (s.alias || "").toLowerCase().includes(q) || (s.server_name || "").toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>{initialToolset ? uiT("ui.93b5f9f4eaaa80b8") : uiT("ui.6c9a0a2385373056")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => event.preventDefault()} className="mt-2">
          <FieldGroup className="mb-4 flex-row gap-4">
            <FormField control={form.control} name="toolset_name" label={uiT("ui.3a8ab9696f6ad1d7")} className="flex-1">
              {(field) => <Input {...field} placeholder={uiT("ui.f2ff790bfbadc364")} />}
            </FormField>
            <FormField control={form.control} name="description" label={uiT("ui.526e0087cc3f")} className="flex-1">
              {(field) => <Input {...field} placeholder={uiT("ui.c7b7b7f01360f6a5")} />}
            </FormField>
          </FieldGroup>
        </form>

        <div className="flex gap-4 mt-2" style={{ minHeight: 360 }}>
          {/* Left panel: Available Tools */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">{uiT("ui.c4e173c3682f1f93")}</p>
            </div>
            <InputGroup className="mb-2">
              <InputGroupInput
                placeholder={uiT("ui.e94500ed397a1096")}
                value={serverSearch}
                onChange={(e) => setServerSearch(e.target.value)}
              />
              {serverSearch && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={uiT("ui.3b7ea51793e9d906")}
                    onClick={() => setServerSearch("")}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 300 }}>
              {filteredServers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {mcpServers.length === 0 ? uiT("ui.013e6b9db9d264cf") : uiT("ui.c7e9efb12fd6c75d")}
                </p>
              ) : (
                filteredServers.map((server) => (
                  <MCPToolList
                    key={server.server_id}
                    serverId={server.server_id}
                    serverName={server.alias || server.server_name || server.server_id}
                    accessToken={accessToken}
                    selectedTools={selectedTools}
                    onToggle={handleToggleTool}
                  />
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-border shrink-0" />

          {/* Right panel: Your Toolset */}
          <div className="w-72 shrink-0">
            <p className="text-sm font-semibold text-foreground mb-2 block">
              {uiT("ui.0b097965883541e9")}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({selectedTools.length} {uiT("ui.eae9fd0b78d30196")}
              </span>
            </p>
            <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 340 }}>
              {selectedTools.length === 0 ? (
                <p className="text-muted-foreground text-sm">{uiT("ui.aa01351781e4ada3")}</p>
              ) : (
                selectedTools.map((tool, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleTool(tool)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-destructive/10 hover:border-destructive/20 group transition-colors dark:border-purple-800 dark:bg-purple-950"
                  >
                    <div className="min-w-0 text-left">
                      <span className="text-xs font-medium text-purple-800 group-hover:text-destructive truncate block dark:text-purple-200">
                        {displayToolName(serverPrefixById.get(tool.server_id), tool.tool_name)}
                      </span>
                      <span className="text-[10px] text-purple-400 truncate block dark:text-purple-500">
                        {tool.server_id.slice(0, 8)}…
                      </span>
                    </div>
                    <span className="ml-2 text-purple-300 group-hover:text-destructive text-xs shrink-0 dark:text-purple-600">
                      ✕
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button onClick={() => void form.handleSubmit(handleSubmit)()} disabled={saving} aria-busy={saving}>
            {saving && <UiLoadingSpinner className="size-4" />}
            {initialToolset ? uiT("ui.35322b5bb5a2") : uiT("ui.72fa7c16b6f8877b")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolsetsEmptyState() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{uiT("ui.1f8a3594ad4e3e91")}</div>
      <div className="text-sm text-muted-foreground">{uiT("ui.e8abe65f8fa04e31")}</div>
    </div>
  );
}

function ToolsetUsageGuide() {
  const { t: uiT } = useDashboardLanguage();

  const [copied, setCopied] = useState(false);
  const proxyBaseUrl = getProxyBaseUrl();

  const snippet = `{
  "mcpServers": {
    "my-toolset": {
      "url": "${proxyBaseUrl}/toolset/<toolset-name>/mcp",
      "headers": { "x-litellm-api-key": "Bearer <your-api-key>" }
    }
  }
}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-muted px-5 py-4">
      <p className="text-sm font-medium text-foreground mb-1">{uiT("ui.1812617253918394")}</p>
      <p className="text-sm text-muted-foreground mb-3">
        {uiT("ui.e786666b2c660e6d")} <span className="font-medium text-foreground">{uiT("ui.f2ea0904782ab6db")}</span>
        {uiT("ui.7ec637daf22fe8a2")}
      </p>
      <div className="text-xs text-muted-foreground mb-1">{uiT("ui.62a5e117787ed69b")}</div>
      <div className="relative">
        <pre className="bg-card border border-border rounded-sm px-4 py-3 text-xs font-mono text-foreground overflow-x-auto leading-relaxed pr-14">
          {translateText(snippet)}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded-sm border bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border transition-colors"
        >
          {copied ? "✓" : uiT("ui.6f5a6034e770acbf")}
        </button>
      </div>
    </div>
  );
}

export function MCPToolsetsTab({ accessToken, userRole }: MCPToolsetsTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const { data: toolsets = [], isLoading } = useMCPToolsets();
  const { data: mcpServers = [] } = useMCPServers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editToolset, setEditToolset] = useState<MCPToolset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = userRole === "Admin" || userRole === "proxy_admin";

  const handleCreate = async (name: string, description: string | undefined, tools: MCPToolsetTool[]) => {
    if (!accessToken) return;
    await createMCPToolset(accessToken, { toolset_name: name, description, tools });
    toast.success(translateUi("ui.75241401c10ff3e4"));
    queryClient.invalidateQueries({ queryKey: ["mcpToolsets"] });
  };

  const handleUpdate = async (name: string, description: string | undefined, tools: MCPToolsetTool[]) => {
    if (!accessToken || !editToolset) return;
    await updateMCPToolset(accessToken, { toolset_id: editToolset.toolset_id, toolset_name: name, description, tools });
    toast.success(translateUi("ui.395502dc72b04228"));
    queryClient.invalidateQueries({ queryKey: ["mcpToolsets"] });
    setEditToolset(null);
  };

  const handleDelete = async () => {
    if (!accessToken || !deleteId) return;
    setDeleting(true);
    try {
      await deleteMCPToolset(accessToken, deleteId);
      toast.success(translateUi("ui.0d586dd6d0f66e83"));
      queryClient.invalidateQueries({ queryKey: ["mcpToolsets"] });
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const serverPrefixById = React.useMemo(
    () => new Map(mcpServers.map((s) => [s.server_id, s.alias || s.server_name || s.server_id])),
    [mcpServers],
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = React.useMemo(() => {
    const deps = {
      isAdmin,
      serverPrefixById,
      onEditClick: setEditToolset,
      onDeleteClick: setDeleteId,
    };
    return getMCPToolsetTableColumns(deps);
  }, [isAdmin, serverPrefixById]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-foreground">{uiT("ui.e4dfc68329bd2326")}</h3>
          <p className="text-muted-foreground text-sm">{uiT("ui.57b1c6fb9ea10641")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            {uiT("ui.6c9a0a2385373056")}
          </Button>
        )}
      </div>

      <ToolsetUsageGuide />

      <DataTable
        data={toolsets}
        paginationMode="client"
        columns={columns}
        getRowId={(toolset, index) => toolset.toolset_id || String(index)}
        sortingMode="client"
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
        loadingMessage={uiT("ui.edf9bffd663f30b9")}
        noDataMessage={<ToolsetsEmptyState />}
        size="compact"
      />

      <CreateToolsetModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        accessToken={accessToken}
      />

      {editToolset && (
        <CreateToolsetModal
          open={!!editToolset}
          onClose={() => setEditToolset(null)}
          onSave={handleUpdate}
          accessToken={accessToken}
          initialToolset={editToolset}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{uiT("ui.48368efd8e01bbd8")}</DialogTitle>
          </DialogHeader>
          <p>{uiT("ui.2a0f651d4d4aef8a")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button onClick={handleDelete} variant="destructive" disabled={deleting} aria-busy={deleting}>
              {uiT("ui.e2d0a54968ea")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
