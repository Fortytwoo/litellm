"use client";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cva.config";
import { makeAgentsPublicCall } from "../../networking";
import { toast } from "@/lib/toast";
import { AgentHubData } from "@/components/AIHub/AgentHubTableColumns";

const STEP_TITLES = ["Select Agents", "Confirm"];

interface MakeAgentPublicFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  agentHubData: AgentHubData[];
  onSuccess: () => void;
}

const MakeAgentPublicForm: React.FC<MakeAgentPublicFormProps> = ({
  visible,
  onClose,
  accessToken,
  agentHubData,
  onSuccess,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedAgents(new Set());
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (selectedAgents.size === 0) {
        toast.fromError("Please select at least one agent to make public");
        return;
      }
      setCurrentStep(1);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  const handleAgentSelection = (agentId: string, checked: boolean) => {
    const newSelection = new Set(selectedAgents);
    if (checked) {
      newSelection.add(agentId);
    } else {
      newSelection.delete(agentId);
    }
    setSelectedAgents(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allAgentIds = agentHubData.map((agent) => agent.agent_id || agent.name);
      setSelectedAgents(new Set(allAgentIds));
    } else {
      setSelectedAgents(new Set());
    }
  };

  // Initialize and preselect already public agents when modal opens
  useEffect(() => {
    if (visible && agentHubData.length > 0) {
      // Preselect agents that are already public
      const alreadyPublicAgents = agentHubData
        .filter((agent) => agent.is_public === true)
        .map((agent) => agent.agent_id || agent.name);

      setSelectedAgents(new Set(alreadyPublicAgents));
    }
  }, [visible, agentHubData]);

  const handleSubmit = async () => {
    if (selectedAgents.size === 0) {
      toast.fromError("Please select at least one agent to make public");
      return;
    }

    setLoading(true);
    try {
      const agentIdsToMakePublic = Array.from(selectedAgents);

      // Make batch API call for all agents
      await makeAgentsPublicCall(accessToken, agentIdsToMakePublic);

      toast.success(translateUi("ui.41a2ef3183f4cf28", undefined, { v0: String(agentIdsToMakePublic.length) }));
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error making agents public:", error);
      toast.fromError("Failed to make agents public. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1Content = () => {
    const allAgentsSelected =
      agentHubData.length > 0 && agentHubData.every((agent) => selectedAgents.has(agent.agent_id || agent.name));
    const isIndeterminate = selectedAgents.size > 0 && !allAgentsSelected;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{uiT("ui.c1773c2d4782c8b0")}</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allAgentsSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                disabled={agentHubData.length === 0}
              />
              {uiT("ui.d1ec69e64b9609d0")} {agentHubData.length > 0 && `(${agentHubData.length})`}
            </label>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{uiT("ui.1fa19c85b43db425")}</p>

        <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
          <div className="space-y-3">
            {agentHubData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{uiT("ui.c4763d2fa13e7a97")}</p>
              </div>
            ) : (
              agentHubData.map((agent) => {
                const agentId = agent.agent_id || agent.name;
                return (
                  <div key={agentId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                    <Checkbox
                      checked={selectedAgents.has(agentId)}
                      onCheckedChange={(checked) => handleAgentSelection(agentId, checked === true)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium break-words">{agent.name}</p>
                        <Badge variant="secondary">v{agent.version}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{agent.description}</p>
                      {agent.skills && agent.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill.id} variant="outline">
                              {skill.name}
                            </Badge>
                          ))}
                          {agent.skills.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{agent.skills.length - 3} {uiT("ui.187897ce0afc")}
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

        {selectedAgents.size > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-3">
            <p className="text-sm text-info">
              <strong>{selectedAgents.size}</strong> {uiT("ui.d4f0bc5a29de06b5")}
              {selectedAgents.size !== 1 ? "s" : ""} {uiT("ui.d7cbbb688b2e506c")}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep2Content = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{uiT("ui.f8d38b1bba42c555")}</h3>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm text-warning">
            <strong>{uiT("ui.63ea82367063caf1")}</strong> {uiT("ui.c414487ac4ce9b3b")} <code>/ui/model_hub_table</code>{" "}
            {uiT("ui.52ed3699baa916db")}
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-medium">{uiT("ui.b6ee60f0c8e65284")}</p>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
            <div className="space-y-2">
              {Array.from(selectedAgents).map((agentId) => {
                const agent = agentHubData.find((a) => (a.agent_id || a.name) === agentId);
                return (
                  <div key={agentId} className="flex items-center justify-between p-2 bg-muted rounded-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium break-words">{agent?.name || agentId}</p>
                        {agent && <Badge variant="secondary">v{agent.version}</Badge>}
                      </div>
                      {agent?.description && (
                        <p className="text-xs text-muted-foreground mt-1 break-words">{agent.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-info/10 border border-info/20 rounded-lg p-3">
          <p className="text-sm text-info">
            {uiT("ui.18e872be2359")} <strong>{selectedAgents.size}</strong> {uiT("ui.d4f0bc5a29de06b5")}
            {selectedAgents.size !== 1 ? "s" : ""} {uiT("ui.54dee8362e2d8325")}
          </p>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
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
            <Button onClick={handleNext} disabled={selectedAgents.size === 0}>
              {uiT("ui.1ff57a29d7c9")}
            </Button>
          )}

          {currentStep === 1 && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {uiT("ui.24139936d627112e")}
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
          <DialogTitle>{uiT("ui.93d8d70c493e5c1f")}</DialogTitle>
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

export default MakeAgentPublicForm;
