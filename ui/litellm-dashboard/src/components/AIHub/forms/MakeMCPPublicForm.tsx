"use client";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cva.config";
import { makeMCPPublicCall } from "../../networking";
import { toast } from "@/lib/toast";
import { MCPServerData } from "@/components/AIHub/MCPHubTableColumns";

const STEP_TITLES = ["Select Servers", "Confirm"];

const statusVariant = (status?: string) => {
  if (status === "active" || status === "healthy") {
    return "default" as const;
  }
  if (status === "inactive" || status === "unhealthy") {
    return "destructive" as const;
  }
  return "outline" as const;
};

interface MakeMCPPublicFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  mcpHubData: MCPServerData[];
  onSuccess: () => void;
}

interface PublicationSelection {
  readonly catalog: MCPServerData[];
  readonly serverIds: Set<string>;
}

const MakeMCPPublicForm: React.FC<MakeMCPPublicFormProps> = ({
  visible,
  onClose,
  accessToken,
  mcpHubData,
  onSuccess,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<PublicationSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedServers = selection?.serverIds ?? new Set<string>();
  const hasPublicationMetadata = mcpHubData.every((server) => typeof server.mcp_info?.is_public_explicit === "boolean");
  const canManagePublication = hasPublicationMetadata && selection?.catalog === mcpHubData;
  const publicationYaml = [
    "litellm_settings:",
    "  public_mcp_hub_strict_whitelist: true",
    selectedServers.size === 0
      ? "  public_mcp_servers: []"
      : `  public_mcp_servers:\n${Array.from(selectedServers, (id) => `    - ${JSON.stringify(id)}`).join("\n")}`,
  ].join("\n");

  const handleClose = () => {
    setCurrentStep(0);
    setSelection(null);
    onClose();
  };

  const handleNext = () => {
    if (!canManagePublication) return;
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  const handleServerSelection = (serverId: string, checked: boolean) => {
    const newSelection = new Set(selectedServers);
    if (checked) {
      newSelection.add(serverId);
    } else {
      newSelection.delete(serverId);
    }
    setSelection({ catalog: mcpHubData, serverIds: newSelection });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allServerIds = mcpHubData.map((server) => server.server_id);
      setSelection({ catalog: mcpHubData, serverIds: new Set(allServerIds) });
    } else {
      setSelection({ catalog: mcpHubData, serverIds: new Set() });
    }
  };

  useEffect(() => {
    if (!visible || !hasPublicationMetadata) {
      setSelection(null);
      return;
    }
    const publicServerIds = mcpHubData
      .filter((server) => server.mcp_info.is_public_explicit === true)
      .map((server) => server.server_id);
    setSelection({ catalog: mcpHubData, serverIds: new Set(publicServerIds) });
    setCurrentStep(0);
  }, [visible, mcpHubData, hasPublicationMetadata]);

  const handleSubmit = async () => {
    if (!canManagePublication) return;
    setLoading(true);
    try {
      const serverIdsToMakePublic = Array.from(selectedServers);

      // Make batch API call for all servers
      await makeMCPPublicCall(accessToken, serverIdsToMakePublic);

      toast.success(translateUi("ui.969dfc769f7d8f52"));
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error making MCP servers public:", error);
      toast.fromError(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1Content = () => {
    const allServersSelected =
      mcpHubData.length > 0 && mcpHubData.every((server) => selectedServers.has(server.server_id));
    const isIndeterminate = selectedServers.size > 0 && !allServersSelected;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{uiT("ui.1fa7305cd6a3a3f2")}</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allServersSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                disabled={mcpHubData.length === 0}
              />
              {uiT("ui.d1ec69e64b9609d0")} {mcpHubData.length > 0 && `(${mcpHubData.length})`}
            </label>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{uiT("ui.de0c7974b4ffb812")}</p>

        <p className="text-xs text-muted-foreground">{uiT("ui.c3c286567a6cdc68")}</p>

        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
          <div className="space-y-3">
            {mcpHubData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{uiT("ui.3fa89beb3b484aed")}</p>
              </div>
            ) : (
              mcpHubData.map((server) => {
                const isPublic = server.mcp_info?.is_public === true;
                return (
                  <div
                    key={server.server_id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent"
                  >
                    <Checkbox
                      aria-label={uiT("ui.0ec53b8b903ae2ce", { v0: String(server.server_name) })}
                      checked={selectedServers.has(server.server_id)}
                      onCheckedChange={(checked) => handleServerSelection(server.server_id, checked === true)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium break-words">{server.server_name}</p>
                        {isPublic && (
                          <Badge>
                            {server.mcp_info?.is_public_explicit === false
                              ? uiT("ui.c4b9c093ec54f29b")
                              : uiT("ui.78797afdac993780")}
                          </Badge>
                        )}
                        <Badge variant="secondary">{server.transport}</Badge>
                        <Badge variant={statusVariant(server.status)}>{server.status || uiT("ui.b23a6a8439c0")}</Badge>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{server.server_id}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {server.description || server.url}
                      </p>
                      {server.allowed_tools && server.allowed_tools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {server.allowed_tools.slice(0, 3).map((tool, idx) => (
                            <Badge key={idx} variant="outline">
                              {tool}
                            </Badge>
                          ))}
                          {server.allowed_tools.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{server.allowed_tools.length - 3} {uiT("ui.187897ce0afc")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">{uiT("ui.cfa478c46b079618")}</summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">{uiT("ui.9b56b1fac9cab014")}</p>
            <CodeBlock code={publicationYaml} language="yaml" />
          </div>
        </details>

        {selectedServers.size > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-3">
            <p className="text-sm text-info">
              <strong>{selectedServers.size}</strong> {uiT("ui.d938c8168e3acbba")}
              {selectedServers.size !== 1 ? "s" : ""} {uiT("ui.d7cbbb688b2e506c")}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep2Content = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{uiT("ui.094c236de78959dd")}</h3>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm text-warning">
            {uiT("ui.50ffb3a36eb56dfb")} <code>/ui/model_hub_table</code> {uiT("ui.627bead4d4e5049c")}
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-medium">{uiT("ui.07465b5f02d1b6e5")}</p>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
            <div className="space-y-2">
              {selectedServers.size === 0 && <p className="text-sm">{uiT("ui.7e3f223033e79c3f")}</p>}
              {Array.from(selectedServers).map((serverId) => {
                const server = mcpHubData.find((s) => s.server_id === serverId);
                return (
                  <div key={serverId} className="flex items-center justify-between p-2 bg-muted rounded-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium break-words">{server?.server_name || serverId}</p>
                        {server && (
                          <>
                            <Badge variant="secondary">{server.transport}</Badge>
                            <Badge variant={statusVariant(server.status)}>
                              {server.status || uiT("ui.b23a6a8439c0")}
                            </Badge>
                          </>
                        )}
                      </div>
                      {server?.description && (
                        <p className="text-xs text-muted-foreground mt-1 break-words">{server.description}</p>
                      )}
                      {server?.url && <p className="text-xs text-muted-foreground mt-1 break-words">{server.url}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-info/10 border border-info/20 rounded-lg p-3">
          <p className="text-sm text-info">
            {uiT("ui.3a14baceaac0b2d0")} <strong>{selectedServers.size}</strong> {uiT("ui.d938c8168e3acbba")}
            {selectedServers.size !== 1 ? "s" : ""}
            {uiT("ui.2dc090248e165b9b")}
          </p>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    if (!hasPublicationMetadata) {
      return (
        <div role="alert" className="rounded-lg border border-warning/20 bg-warning/10 p-4 text-sm">
          {uiT("ui.4d9eca751efd549e")}
        </div>
      );
    }
    if (!canManagePublication) return <p role="status">{uiT("ui.1b6ce5664c2c1ff6")}</p>;
    switch (currentStep) {
      case 0:
        return renderStep1Content();
      case 1:
        return renderStep2Content();
      default:
        return null;
    }
  };

  const renderStepButtons = () => {
    return (
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={currentStep === 0 ? handleClose : handlePrevious}>
          {currentStep === 0 ? uiT("ui.19766ed6ccb2") : uiT("ui.a57b08a480b8")}
        </Button>

        <div className="flex space-x-2">
          {currentStep === 0 && (
            <Button onClick={handleNext} disabled={!canManagePublication}>
              {uiT("ui.1ff57a29d7c9")}
            </Button>
          )}

          {currentStep === 1 && (
            <Button onClick={handleSubmit} disabled={loading || !canManagePublication}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {uiT("ui.621db3608dacc97b")}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()} disablePointerDismissal>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.b3b737880741e637")}</DialogTitle>
        </DialogHeader>

        <div>
          <ol className="mb-6 flex items-center gap-6">
            {STEP_TITLES.map((title, index) => (
              <li
                key={title}
                className="flex items-center gap-2"
                aria-current={currentStep === index ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-xs",
                    currentStep === index
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn("text-sm", currentStep === index ? "font-medium" : "text-muted-foreground")}>
                  {translateText(title)}
                </span>
              </li>
            ))}
          </ol>

          {renderStepContent()}
          {renderStepButtons()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MakeMCPPublicForm;
