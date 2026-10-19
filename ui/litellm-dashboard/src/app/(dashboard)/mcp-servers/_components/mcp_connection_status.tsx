"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CircleCheck, CircleAlert, RefreshCw, Wrench, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

interface MCPConnectionStatusProps {
  formValues: Record<string, any>;
  tools: any[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolsErrorStatus?: number | null;
  toolsErrorStackTrace: string | null;
  canFetchTools: boolean;
  fetchTools: () => Promise<void>;
}

const MCPConnectionStatus: React.FC<MCPConnectionStatusProps> = ({
  formValues,
  tools,
  isLoadingTools,
  toolsError,
  toolsErrorStatus = null,
  toolsErrorStackTrace,
  canFetchTools,
  fetchTools,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const isPreviewForbidden = toolsErrorStatus === 403;
  // Don't show anything if required fields aren't filled
  if (!canFetchTools && !formValues.url && !formValues.spec_path) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleCheck className="size-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">{uiT("ui.3693e28834276c33")}</h3>
        </div>

        {!canFetchTools && (formValues.url || formValues.spec_path) && (
          <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground">
            <Wrench className="mx-auto mb-2 size-6" />
            <p className="text-sm">{uiT("ui.e1963bea6f40fd5d")}</p>
            <p className="text-sm">{uiT("ui.1934dfbca487c9b4")}</p>
          </div>
        )}

        {canFetchTools && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isLoadingTools
                    ? uiT("ui.5b31ec31023958d2")
                    : tools.length > 0
                      ? uiT("ui.856dd8c8677b1f8f")
                      : toolsError
                        ? isPreviewForbidden
                          ? uiT("ui.8ace1086f371451f")
                          : uiT("ui.596c52f1eb65c1c3")
                        : uiT("ui.554084963f1f7512")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uiT("ui.087fbe073393cada")} {formValues.url || formValues.spec_path}
                </p>
              </div>

              {isLoadingTools && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UiLoadingSpinner className="size-4" />
                  <p className="text-sm">{uiT("ui.5f04ae9ed6a865bb")}</p>
                </div>
              )}

              {!isLoadingTools && !toolsError && tools.length > 0 && (
                <div className="flex items-center gap-1">
                  <CircleCheck className="size-4" />
                  <p className="text-sm font-medium">{uiT("ui.22965568d22a14ee")}</p>
                </div>
              )}

              {toolsError && !isPreviewForbidden && (
                <div className="flex items-center gap-1 text-destructive">
                  <CircleAlert className="size-4" />
                  <p className="text-sm font-medium">{uiT("ui.031a8f0f659d")}</p>
                </div>
              )}
            </div>

            {isLoadingTools && (
              <div className="flex items-center justify-center gap-3 py-6">
                <UiLoadingSpinner className="size-6 text-muted-foreground" />
                <p className="text-sm">{uiT("ui.88a2018d53203c11")}</p>
              </div>
            )}

            {toolsError && isPreviewForbidden && (
              <Alert>
                <Info />
                <AlertTitle>{uiT("ui.ccf04cf787a0079d")}</AlertTitle>
                <AlertDescription>{toolsError}</AlertDescription>
              </Alert>
            )}

            {toolsError && !isPreviewForbidden && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{uiT("ui.42aa4e7bc5d2c21a")}</AlertTitle>
                <AlertDescription>
                  <div>{toolsError}</div>
                  {toolsErrorStackTrace && (
                    <Collapsible className="mt-3">
                      <CollapsibleTrigger
                        render={
                          <Button variant="link" size="sm" className="h-auto p-0">
                            {uiT("ui.916cdab866a742cc")}
                          </Button>
                        }
                      />
                      <CollapsibleContent>
                        <pre className="mt-2 max-h-100 overflow-auto rounded-sm bg-muted p-2 font-mono text-xs break-words whitespace-pre-wrap">
                          {toolsErrorStackTrace}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </AlertDescription>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={fetchTools}>
                    <RefreshCw />
                    {uiT("ui.942087cc2d41e013")}
                  </Button>
                </div>
              </Alert>
            )}

            {!isLoadingTools && tools.length === 0 && !toolsError && (
              <div className="rounded-lg border border-dashed py-6 text-center">
                <CircleCheck className="mx-auto mb-2 size-6" />
                <p className="text-sm font-medium">{uiT("ui.04a6bbf1d545133c")}</p>
                <p className="text-sm text-muted-foreground">{uiT("ui.3de1b536f60a6089")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MCPConnectionStatus;
