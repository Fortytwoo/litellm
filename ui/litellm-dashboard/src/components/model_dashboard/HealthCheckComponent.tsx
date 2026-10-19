"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { OnChangeFn, PaginationState, RowSelectionState } from "@tanstack/react-table";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorPatterns } from "@/utils/errorPatterns";

import { Team } from "../key_team_helpers/key_list";
import { individualModelHealthCheckCall, latestHealthChecksCall } from "../networking";
import { HealthChecksTable } from "./HealthChecksTable";
import type { HealthCheckData, HealthStatus } from "./HealthChecksTableColumns";

interface LatestHealthCheck {
  status?: string;
  checked_at?: string | null;
  error_message?: string | null;
}

const STATUS_TO_ERROR: Record<string, string> = {
  "400": "BadRequestError",
  "401": "AuthenticationError",
  "403": "ForbiddenError",
  "404": "NotFoundError",
  "408": "TimeoutError",
  "429": "RateLimitError",
  "500": "InternalServerError",
  "502": "BadGatewayError",
  "503": "ServiceUnavailableError",
  "504": "GatewayTimeoutError",
};

const ERROR_TO_STATUS: Record<string, string> = {
  AuthenticationError: "401",
  RateLimitError: "429",
  BadRequestError: "400",
  InternalServerError: "500",
  TimeoutError: "408",
  NotFoundError: "404",
  ForbiddenError: "403",
  ServiceUnavailableError: "503",
  BadGatewayError: "502",
  GatewayTimeoutError: "504",
  ContentPolicyViolationError: "400",
};

const KEYWORD_ERRORS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  {
    pattern: /missing.*api.*key|invalid.*key|unauthorized/i,
    get label() {
      return translateUi("ui.2cccf29719fa4690");
    },
  },
  {
    pattern: /rate.*limit|too.*many.*requests/i,
    get label() {
      return translateUi("ui.a1bbef41cbf84f1e");
    },
  },
  {
    pattern: /timeout|timed.*out/i,
    get label() {
      return translateUi("ui.9c45cb8096a9748c");
    },
  },
  {
    pattern: /not.*found/i,
    get label() {
      return translateUi("ui.84ff39f1efd8eede");
    },
  },
  {
    pattern: /forbidden|access.*denied/i,
    get label() {
      return translateUi("ui.30d1e2a82087bb66");
    },
  },
  {
    pattern: /internal.*server.*error/i,
    get label() {
      return translateUi("ui.06be0356965fdc3a");
    },
  },
];

const truncate = (value: string): string => (value.length > 100 ? `${value.substring(0, 97)}...` : value);

// Helper function to extract meaningful error information
const extractMeaningfulError = (error: unknown): string => {
  if (!error) return "Health check failed";

  const errorStr = typeof error === "string" ? error : JSON.stringify(error);

  // First, look for explicit "ErrorType: StatusCode" patterns
  const directPatternMatch = errorStr.match(/(\w+Error):\s*(\d{3})/i);
  if (directPatternMatch) {
    return `${directPatternMatch[1]}: ${directPatternMatch[2]}`;
  }

  // Look for error types and status codes separately, then combine them
  const errorTypeMatch = errorStr.match(
    /(AuthenticationError|RateLimitError|BadRequestError|InternalServerError|TimeoutError|NotFoundError|ForbiddenError|ServiceUnavailableError|BadGatewayError|ContentPolicyViolationError|\w+Error)/i,
  );
  const statusCodeMatch = errorStr.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/);

  if (errorTypeMatch && statusCodeMatch) {
    return `${errorTypeMatch[1]}: ${statusCodeMatch[1]}`;
  }

  // If we have a status code but no clear error type, map it
  if (statusCodeMatch) {
    const statusCode = statusCodeMatch[1];
    return `${STATUS_TO_ERROR[statusCode]}: ${statusCode}`;
  }

  // If we have an error type but no status code, map error type to expected status code
  if (errorTypeMatch) {
    const errorType = errorTypeMatch[1];
    const mappedStatus = ERROR_TO_STATUS[errorType];
    if (mappedStatus) {
      return `${errorType}: ${mappedStatus}`;
    }
    return errorType;
  }

  // Check for specific error patterns from errorPatterns
  for (const { pattern, replacement } of errorPatterns) {
    if (pattern.test(errorStr)) {
      return replacement;
    }
  }

  // Look for common error keywords and provide meaningful names with status codes
  for (const { pattern, label } of KEYWORD_ERRORS) {
    if (pattern.test(errorStr)) {
      return label;
    }
  }

  // Fallback: clean up the error string and return first meaningful part
  const cleaned = errorStr
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Try to get first meaningful sentence or phrase
  const firstSentence = cleaned.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length > 0) {
    return truncate(firstSentence);
  }

  return truncate(cleaned);
};

const toCheckedAtLabel = (checkedAt: string | null | undefined, fallback: string): string => {
  if (!checkedAt) {
    return fallback;
  }
  return new Date(checkedAt).toLocaleString();
};

const toLastSuccessLabel = (checkData: LatestHealthCheck, fallback: string): string => {
  if (checkData.status !== "healthy") {
    return fallback;
  }
  return toCheckedAtLabel(checkData.checked_at, fallback);
};

interface HealthCheckComponentProps {
  accessToken: string | null;
  modelData: any;
  all_models_on_proxy: string[];
  getDisplayModelName: (model: any) => string;
  setSelectedModelId?: (modelId: string) => void;
  teams?: Team[] | null;
  isLoading?: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  rowCount: number;
}

const HealthCheckComponent: React.FC<HealthCheckComponentProps> = ({
  accessToken,
  modelData,
  all_models_on_proxy,
  getDisplayModelName,
  setSelectedModelId,
  teams,
  isLoading = false,
  pagination,
  onPaginationChange,
  rowCount,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [modelHealthStatuses, setModelHealthStatuses] = useState<{ [key: string]: HealthStatus }>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [selectedErrorDetails, setSelectedErrorDetails] = useState<{
    modelName: string;
    cleanedError: string;
    fullError: string;
  } | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedSuccessDetails, setSelectedSuccessDetails] = useState<{
    modelName: string;
    response: unknown;
  } | null>(null);

  // Initialize health statuses on component mount (keyed by model id)
  useEffect(() => {
    if (!accessToken || !modelData?.data) return;

    const initializeHealthStatuses = async () => {
      const healthStatusMap: { [key: string]: HealthStatus } = {};

      // Initialize all models with default state using model ids
      modelData.data.forEach((model: any) => {
        const modelId = model.model_info?.id;
        if (modelId) {
          healthStatusMap[modelId] = {
            status: "none",
            lastCheck: "None",
            lastSuccess: "None",
            loading: false,
            error: undefined,
            fullError: undefined,
            successResponse: undefined,
          };
        }
      });

      try {
        const latestHealthChecks = await latestHealthChecksCall(accessToken);

        // Override with actual database data if it exists (latest_health_checks is keyed by model_id)
        if (
          latestHealthChecks &&
          latestHealthChecks.latest_health_checks &&
          typeof latestHealthChecks.latest_health_checks === "object"
        ) {
          Object.entries(latestHealthChecks.latest_health_checks).forEach(([modelId, rawCheck]) => {
            if (!rawCheck) return;
            const checkData = rawCheck as LatestHealthCheck;

            // Key is model_id from the backend (guaranteed by DB schema)
            const modelExists = modelData.data.some((m: any) => m.model_info?.id === modelId);
            if (!modelExists) return;

            const fullError = checkData.error_message || undefined;

            healthStatusMap[modelId] = {
              status: checkData.status || "unknown",
              lastCheck: toCheckedAtLabel(checkData.checked_at, "None"),
              lastSuccess: toLastSuccessLabel(checkData, "None"),
              loading: false,
              error: fullError ? extractMeaningfulError(fullError) : undefined,
              fullError: fullError,
              successResponse: checkData.status === "healthy" ? checkData : undefined,
            };
          });
        }
      } catch (healthError) {
        console.warn("Failed to load health check history (using default states):", healthError);
      }

      setModelHealthStatuses(healthStatusMap);
    };

    initializeHealthStatuses();
  }, [accessToken, modelData]);

  const runIndividualHealthCheck = useCallback(
    async (modelId: string) => {
      if (!accessToken) return;

      setModelHealthStatuses((prev) => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          loading: true,
          status: "checking",
        },
      }));

      try {
        const response = await individualModelHealthCheckCall(accessToken, modelId);
        const currentTime = new Date().toLocaleString();

        if (response.unhealthy_count > 0 && response.unhealthy_endpoints && response.unhealthy_endpoints.length > 0) {
          const rawError = response.unhealthy_endpoints[0]?.error || "Health check failed";
          const errorMessage = extractMeaningfulError(rawError);
          setModelHealthStatuses((prev) => ({
            ...prev,
            [modelId]: {
              status: "unhealthy",
              lastCheck: currentTime,
              lastSuccess: prev[modelId]?.lastSuccess || "None",
              loading: false,
              error: errorMessage,
              fullError: rawError,
            },
          }));
        } else {
          setModelHealthStatuses((prev) => ({
            ...prev,
            [modelId]: {
              status: "healthy",
              lastCheck: currentTime,
              lastSuccess: currentTime,
              loading: false,
              successResponse: response,
            },
          }));
        }

        try {
          const latestHealthChecks = await latestHealthChecksCall(accessToken);
          const checkData = latestHealthChecks.latest_health_checks?.[modelId] as LatestHealthCheck | undefined;

          if (checkData) {
            const fullError = checkData.error_message || undefined;
            setModelHealthStatuses((prev) => ({
              ...prev,
              [modelId]: {
                status: checkData.status || prev[modelId]?.status || "unknown",
                lastCheck: toCheckedAtLabel(checkData.checked_at, prev[modelId]?.lastCheck || "None"),
                lastSuccess: toLastSuccessLabel(checkData, prev[modelId]?.lastSuccess || "None"),
                loading: false,
                error: fullError ? extractMeaningfulError(fullError) : prev[modelId]?.error,
                fullError: fullError || prev[modelId]?.fullError,
                successResponse: checkData.status === "healthy" ? checkData : prev[modelId]?.successResponse,
              },
            }));
          }
        } catch (dbError) {}
      } catch (error) {
        const currentTime = new Date().toLocaleString();
        const rawError = error instanceof Error ? error.message : String(error);
        const errorMessage = extractMeaningfulError(rawError);
        setModelHealthStatuses((prev) => ({
          ...prev,
          [modelId]: {
            status: "unhealthy",
            lastCheck: currentTime,
            lastSuccess: prev[modelId]?.lastSuccess || "None",
            loading: false,
            error: errorMessage,
            fullError: rawError,
          },
        }));
      }
    },
    [accessToken],
  );

  const selectedModelIds = useMemo(
    () => Object.keys(rowSelection).filter((modelId) => rowSelection[modelId]),
    [rowSelection],
  );

  const runAllHealthChecks = async () => {
    const modelsToCheck = selectedModelIds.length > 0 ? selectedModelIds : all_models_on_proxy;

    const loadingStatuses = modelsToCheck.reduce(
      (acc, modelId) => {
        acc[modelId] = {
          ...modelHealthStatuses[modelId],
          loading: true,
          status: "checking",
        };
        return acc;
      },
      {} as typeof modelHealthStatuses,
    );

    setModelHealthStatuses((prev) => ({ ...prev, ...loadingStatuses }));

    const healthCheckPromises = modelsToCheck.map(async (modelId) => {
      if (!accessToken) return;

      try {
        const response = await individualModelHealthCheckCall(accessToken, modelId);

        const currentTime = new Date().toLocaleString();
        if (response.unhealthy_count > 0 && response.unhealthy_endpoints && response.unhealthy_endpoints.length > 0) {
          const rawError = response.unhealthy_endpoints[0]?.error || "Health check failed";
          const errorMessage = extractMeaningfulError(rawError);
          setModelHealthStatuses((prev) => ({
            ...prev,
            [modelId]: {
              status: "unhealthy",
              lastCheck: currentTime,
              lastSuccess: prev[modelId]?.lastSuccess || "None",
              loading: false,
              error: errorMessage,
              fullError: rawError,
            },
          }));
        } else {
          setModelHealthStatuses((prev) => ({
            ...prev,
            [modelId]: {
              status: "healthy",
              lastCheck: currentTime,
              lastSuccess: currentTime,
              loading: false,
              successResponse: response,
            },
          }));
        }
      } catch (error) {
        console.error(`Health check failed for model id ${modelId}:`, error);
        const currentTime = new Date().toLocaleString();
        const rawError = error instanceof Error ? error.message : String(error);
        const errorMessage = extractMeaningfulError(rawError);
        setModelHealthStatuses((prev) => ({
          ...prev,
          [modelId]: {
            status: "unhealthy",
            lastCheck: currentTime,
            lastSuccess: prev[modelId]?.lastSuccess || "None",
            loading: false,
            error: errorMessage,
            fullError: rawError,
          },
        }));
      }
    });

    await Promise.allSettled(healthCheckPromises);

    try {
      if (!accessToken) return;
      const latestHealthChecks = await latestHealthChecksCall(accessToken);

      if (latestHealthChecks.latest_health_checks) {
        Object.entries(latestHealthChecks.latest_health_checks).forEach(([modelId, rawCheck]) => {
          if (!modelsToCheck.includes(modelId) || !rawCheck) return;
          const checkData = rawCheck as LatestHealthCheck;
          const fullError = checkData.error_message || undefined;

          setModelHealthStatuses((prev) => {
            const currentStatus = prev[modelId];
            return {
              ...prev,
              [modelId]: {
                status: checkData.status || currentStatus?.status || "unknown",
                lastCheck: toCheckedAtLabel(checkData.checked_at, currentStatus?.lastCheck || "None"),
                lastSuccess: toLastSuccessLabel(checkData, currentStatus?.lastSuccess || "None"),
                loading: false,
                error: fullError ? extractMeaningfulError(fullError) : currentStatus?.error,
                fullError: fullError || currentStatus?.fullError,
                successResponse: checkData.status === "healthy" ? checkData : currentStatus?.successResponse,
              },
            };
          });
        });
      }
    } catch (dbError) {
      console.warn("Failed to fetch updated health statuses from database (non-critical):", dbError);
    }
  };

  // Changing the page swaps the underlying rows, so a carried-over selection would
  // point at models that are no longer on screen.
  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updaterOrValue) => {
      setRowSelection({});
      setModelHealthStatuses({});
      onPaginationChange(updaterOrValue);
    },
    [onPaginationChange],
  );

  const showErrorModal = useCallback((modelName: string, cleanedError: string, fullError: string) => {
    setSelectedErrorDetails({ modelName, cleanedError, fullError });
    setErrorModalVisible(true);
  }, []);

  const closeErrorModal = () => {
    setErrorModalVisible(false);
    setSelectedErrorDetails(null);
  };

  const showSuccessModal = useCallback((modelName: string, response: unknown) => {
    setSelectedSuccessDetails({ modelName, response });
    setSuccessModalVisible(true);
  }, []);

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    setSelectedSuccessDetails(null);
  };

  const healthTableData = useMemo<HealthCheckData[]>(
    () =>
      (modelData?.data ?? []).map((model: any) => {
        const modelId = model.model_info?.id;
        const healthStatus = modelId ? modelHealthStatuses[modelId] : null;
        const status = healthStatus || {
          status: "none",
          lastCheck: "None",
          loading: false,
        };
        return {
          model_name: model.model_name,
          model_info: model.model_info,
          provider: model.provider,
          litellm_model_name: model.litellm_model_name,
          health_status: status.status,
          last_check: status.lastCheck,
          last_success: status.lastSuccess || "None",
          health_loading: status.loading,
          health_error: status.error,
          health_full_error: status.fullError,
        };
      }),
    [modelData, modelHealthStatuses],
  );

  const isPartialSelection = selectedModelIds.length > 0 && selectedModelIds.length < all_models_on_proxy.length;
  const anyCheckRunning = Object.values(modelHealthStatuses).some((status) => status.loading);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{uiT("ui.dd64b21682304de2")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.3482f01305f2c65c")}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedModelIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
                data-testid="clear-health-selection"
              >
                {uiT("ui.c52ff5ea803d5775")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={runAllHealthChecks}
              disabled={anyCheckRunning}
              data-testid="run-health-checks"
            >
              {isPartialSelection ? uiT("ui.fc6a1d900977389b") : uiT("ui.ec2347a3bd2820af")}
            </Button>
          </div>
        </div>
      </div>

      <HealthChecksTable
        data={healthTableData}
        rowCount={rowCount}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        modelHealthStatuses={modelHealthStatuses}
        getDisplayModelName={getDisplayModelName}
        onRunHealthCheck={runIndividualHealthCheck}
        onShowError={showErrorModal}
        onShowSuccess={showSuccessModal}
        onSelectModel={setSelectedModelId}
        teams={teams}
      />

      <Dialog
        open={errorModalVisible}
        onOpenChange={(open) => {
          if (!open) closeErrorModal();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedErrorDetails
                ? uiT("ui.f10378b6da9e1c90", { v0: String(selectedErrorDetails.modelName) })
                : uiT("ui.674c0b62eba94a34")}
            </DialogTitle>
            <DialogDescription>{uiT("ui.16442455713d5b0f")}</DialogDescription>
          </DialogHeader>
          {selectedErrorDetails && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">{uiT("ui.617062906764f3b8")}</span>
                <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  <span className="text-destructive">{selectedErrorDetails.cleanedError}</span>
                </div>
              </div>

              <div>
                <span className="font-medium">{uiT("ui.81d64b410bfa8671")}</span>
                <div className="mt-2 max-h-96 overflow-y-auto rounded-md border bg-muted/50 p-3">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{selectedErrorDetails.fullError}</pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeErrorModal}>
              {uiT("ui.7d9eb7acb13e")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={successModalVisible}
        onOpenChange={(open) => {
          if (!open) closeSuccessModal();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSuccessDetails
                ? uiT("ui.7a9e3fc0e55daf0a", { v0: String(selectedSuccessDetails.modelName) })
                : uiT("ui.3c5150b631c6fe40")}
            </DialogTitle>
            <DialogDescription>{uiT("ui.94b3cc4ac57fa01d")}</DialogDescription>
          </DialogHeader>
          {selectedSuccessDetails && (
            <div className="space-y-4">
              <div>
                <span className="font-medium">{uiT("ui.755c8b2a9fb11446")}</span>
                <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <span className="text-foreground">{uiT("ui.96fd7037bcf09ce2")}</span>
                </div>
              </div>

              <div>
                <span className="font-medium">{uiT("ui.25fa89a808e0fd19")}</span>
                <div className="mt-2 max-h-96 overflow-y-auto rounded-md border bg-muted/50 p-3">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">
                    {JSON.stringify(selectedSuccessDetails.response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeSuccessModal}>
              {uiT("ui.7d9eb7acb13e")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthCheckComponent;
