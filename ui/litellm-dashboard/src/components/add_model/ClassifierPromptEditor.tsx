"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useCallback, useState } from "react";
import { TriangleAlert } from "lucide-react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { getAutoRouterClassifierDefaultPromptCall } from "@/components/networking";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ClassificationRubric } from "./ComplexityRouterConfig";
import { hasCustomPrompt, initialDraftText, resolveCustomPrompt } from "./classifierPromptEditorState";

interface ClassifierPromptEditorProps {
  systemPrompt: string | undefined;
  onChange: (systemPrompt: string | undefined) => void;
  contextWindowSize: number;
  tierLabels?: Record<string, string>;
  classificationRubric: ClassificationRubric;
}

const ClassifierPromptEditor: React.FC<ClassifierPromptEditorProps> = ({
  systemPrompt,
  onChange,
  contextWindowSize,
  tierLabels,
  classificationRubric,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isOverridden = hasCustomPrompt(systemPrompt);

  // Fetched on every open rather than cached, so a context window or tier rename changed since the
  // last open cannot prefill the editor with a rubric the router would no longer send.
  const openEditor = useCallback(async () => {
    if (!accessToken) return;
    setIsOpen(true);
    setIsLoading(true);
    try {
      const fetched = await getAutoRouterClassifierDefaultPromptCall(
        accessToken,
        contextWindowSize,
        tierLabels,
        classificationRubric,
      );
      setDefaultPrompt(fetched);
      setDraft(initialDraftText(systemPrompt, fetched));
    } catch {
      toast.fromError("Could not load the default classifier prompt");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, contextWindowSize, systemPrompt, tierLabels, classificationRubric]);

  const handleSave = () => {
    onChange(resolveCustomPrompt({ text: draft, defaultPrompt }));
    setIsOpen(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={openEditor} disabled={!accessToken}>
          {isOverridden ? uiT("ui.b8f5cfa3e119dbbc") : uiT("ui.ca53f0bd3961afb4")}
        </Button>
        {isOverridden && (
          <Button type="button" size="sm" variant="link" onClick={() => onChange(undefined)}>
            {uiT("ui.bc5b45ae7b60692a")}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {isOverridden ? uiT("ui.ad8e5adcee665d6d") : uiT("ui.6ec4cc73f35e95f0")}
      </p>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{uiT("ui.6e1294edf5448dfd")}</DialogTitle>
          </DialogHeader>

          <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert className="size-4" aria-hidden />
              {uiT("ui.1f7fe78558fe5173")}
            </p>
            <p className="mt-2">{uiT("ui.845eff6b72325b3d")}</p>
            <p className="mt-2">{uiT("ui.fecc5161e48f5398")}</p>
            <p className="mt-2">{uiT("ui.337859ab4241b6e6")}</p>
            <p className="mt-2">{uiT("ui.0c21c7fb6af0ea73")}</p>
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            disabled={isLoading}
            aria-label={uiT("ui.936a107455fd9737")}
            className="mt-3 font-mono text-xs"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {uiT("ui.0f803f75fc47acf0")} {classificationRubric} {uiT("ui.184fa9deed2f1acb")} {contextWindowSize}.
            </p>
            <Button
              type="button"
              size="sm"
              variant="link"
              onClick={() => setDraft(defaultPrompt)}
              disabled={isLoading || draft === defaultPrompt}
            >
              {uiT("ui.e1be01f639188d8a")}
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isLoading || !draft.trim()}>
              {uiT("ui.7462a09b0f4c31bb")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassifierPromptEditor;
