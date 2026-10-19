"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Info } from "lucide-react";
import { formatGuardrailMode } from "@/app/(dashboard)/guardrails/_components/guardrail_info_helpers";

interface GuardrailInfo {
  guardrail_name: string;
  description: string;
  alreadyExists: boolean;
  definition: any;
}

interface GuardrailSelectionModalProps {
  visible: boolean;
  template: any;
  existingGuardrails: Set<string>;
  onConfirm: (selectedGuardrails: any[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  progressInfo?: { current: number; total: number } | null;
}

const GuardrailSelectionModal: React.FC<GuardrailSelectionModalProps> = ({
  visible,
  template,
  existingGuardrails,
  onConfirm,
  onCancel,
  isLoading = false,
  progressInfo,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [selectedGuardrails, setSelectedGuardrails] = useState<Set<string>>(new Set());

  // Prepare guardrail info with existence status
  const guardrailsInfo: GuardrailInfo[] = (template?.guardrailDefinitions || []).map((def: any) => ({
    guardrail_name: def.guardrail_name,
    description: def.guardrail_info?.description || uiT("ui.aab5e3e77b99b45f"),
    alreadyExists: existingGuardrails.has(def.guardrail_name),
    definition: def,
  }));

  // Initialize selection: select only new guardrails by default
  useEffect(() => {
    if (visible && template) {
      const newGuardrails = guardrailsInfo.filter((g) => !g.alreadyExists).map((g) => g.guardrail_name);
      setSelectedGuardrails(new Set(newGuardrails));
    }
  }, [visible, template]);

  const handleToggle = (guardrailName: string) => {
    setSelectedGuardrails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(guardrailName)) {
        newSet.delete(guardrailName);
      } else {
        newSet.add(guardrailName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allNew = guardrailsInfo.filter((g) => !g.alreadyExists).map((g) => g.guardrail_name);
    setSelectedGuardrails(new Set(allNew));
  };

  const handleDeselectAll = () => {
    setSelectedGuardrails(new Set());
  };

  const handleConfirm = () => {
    const selectedDefinitions = guardrailsInfo
      .filter((g) => selectedGuardrails.has(g.guardrail_name))
      .map((g) => g.definition);
    onConfirm(selectedDefinitions);
  };

  const newGuardrailsCount = guardrailsInfo.filter((g) => !g.alreadyExists).length;
  const existingCount = guardrailsInfo.filter((g) => g.alreadyExists).length;
  const selectedCount = selectedGuardrails.size;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-175">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {template?.title}
            {progressInfo && (
              <Badge variant="secondary">
                {uiT("ui.0575f29df888a27e")} {progressInfo.current} {uiT("ui.28391d3bc64ec15c")} {progressInfo.total}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>{uiT("ui.66c2583e12ae8f56")}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Summary Stats */}
          <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-muted p-3">
            <Info className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">
                  {guardrailsInfo.length} {uiT("ui.a3348d168ff5995b")}
                </span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="font-medium text-success">
                  {newGuardrailsCount} {uiT("ui.11507a0e2f5e69d5")}
                </span>
                {existingCount > 0 && (
                  <>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {existingCount} {uiT("ui.ecb6224a3ff2c981")}
                    </span>
                  </>
                )}
              </div>
            </div>
            {newGuardrailsCount > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {uiT("ui.0a1f434077923cf8")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  {uiT("ui.5cd261bcc680ffda")}
                </Button>
              </div>
            )}
          </div>

          {/* Guardrails List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {guardrailsInfo.map((guardrail) => (
              <div
                key={guardrail.guardrail_name}
                className={`rounded-lg border p-4 transition-colors ${
                  guardrail.alreadyExists ? "border-border bg-muted/50" : "border-border bg-card hover:border-ring"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 pt-0.5">
                    {guardrail.alreadyExists ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Checkbox
                        checked={selectedGuardrails.has(guardrail.guardrail_name)}
                        onCheckedChange={() => handleToggle(guardrail.guardrail_name)}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{guardrail.guardrail_name}</span>
                      {guardrail.alreadyExists && <Badge variant="secondary">{uiT("ui.2dbc546658ab711d")}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{guardrail.description}</p>

                    {/* Show guardrail type and mode */}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {guardrail.definition?.litellm_params?.guardrail || uiT("ui.b23a6a8439c0")}
                      </Badge>
                      <Badge variant="secondary">
                        {formatGuardrailMode(guardrail.definition?.litellm_params?.mode) || uiT("ui.b23a6a8439c0")}
                      </Badge>
                      {guardrail.definition?.litellm_params?.patterns && (
                        <Badge variant="secondary">
                          {guardrail.definition.litellm_params.patterns.length} {uiT("ui.c3d92c469f632638")}
                        </Badge>
                      )}
                      {guardrail.definition?.litellm_params?.categories && (
                        <Badge variant="secondary">
                          {guardrail.definition.litellm_params.categories.length} {uiT("ui.b0bc4ae87afec9c2")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {guardrailsInfo.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p>{uiT("ui.e8a9c0793c3d7e65")}</p>
              <p className="text-sm mt-2">{uiT("ui.e8153a0a942edfa5")}</p>
            </div>
          )}

          {/* Discovered Competitors */}
          {template?.discoveredCompetitors?.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg border border-border bg-muted p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium">
                    {uiT("ui.efa0b7f84e0a0743")}
                    {template.discoveredCompetitors.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.discoveredCompetitors.map((name: string) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.75cab5547d465dce")}</p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Selected Summary */}
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <p>
                <span className="font-medium text-foreground">{selectedCount}</span> {uiT("ui.2f0a9e4fec74e596")}
                {selectedCount > 1 ? "s" : ""} {uiT("ui.85a448899271661f")}
              </p>
            ) : existingCount > 0 ? (
              <p className="text-success">{uiT("ui.7ccfc6bf1d2beb40")}</p>
            ) : (
              <p className="text-warning">{uiT("ui.3940799b01a0a51c")}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || (selectedCount === 0 && existingCount === 0)}>
            {selectedCount > 0
              ? uiT("ui.b9741930524f729b", {
                  v0: String(selectedCount),
                  v1: String(selectedCount > 1 ? uiT("inflections.s") : ""),
                })
              : uiT("ui.6a0418f673c8bc5b")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuardrailSelectionModal;
