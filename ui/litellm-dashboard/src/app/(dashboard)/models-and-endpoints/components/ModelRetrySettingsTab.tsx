"use client";
import { translateText } from "@/i18n";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { LoaderCircle } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GlobalRetryPolicyObject {
  [retryPolicyKey: string]: number;
}

interface RetryPolicyObject {
  [key: string]: { [retryPolicyKey: string]: number } | undefined;
}

interface ModelRetrySettingsTabProps {
  selectedModelGroup: string | null;
  setSelectedModelGroup: (selectedModelGroup: string | null) => void;
  availableModelGroups: string[];
  globalRetryPolicy: GlobalRetryPolicyObject | null;
  setGlobalRetryPolicy: React.Dispatch<React.SetStateAction<GlobalRetryPolicyObject | null>>;
  defaultRetry: number;
  modelGroupRetryPolicy: RetryPolicyObject | null;
  setModelGroupRetryPolicy: React.Dispatch<React.SetStateAction<RetryPolicyObject | null>>;
  handleSaveRetrySettings: () => void;
  isSaving?: boolean;
}

const retryPolicyMap: Record<string, string> = {
  "BadRequestError (400)": "BadRequestErrorRetries",
  "AuthenticationError  (401)": "AuthenticationErrorRetries",
  "TimeoutError (408)": "TimeoutErrorRetries",
  "RateLimitError (429)": "RateLimitErrorRetries",
  "ContentPolicyViolationError (400)": "ContentPolicyViolationErrorRetries",
  "InternalServerError (500)": "InternalServerErrorRetries",
  "ServiceUnavailableError (503)": "ServiceUnavailableErrorRetries",
  "NotFoundError (404)": "NotFoundErrorRetries",
  "All other errors": "DefaultRetries",
};

const isValidRetryCount = (value: number) => Number.isFinite(value) && Number.isInteger(value) && value >= 0;

const ModelRetrySettingsTab = ({
  selectedModelGroup,
  setSelectedModelGroup,
  availableModelGroups,
  globalRetryPolicy,
  setGlobalRetryPolicy,
  defaultRetry,
  modelGroupRetryPolicy,
  setModelGroupRetryPolicy,
  handleSaveRetrySettings,
  isSaving = false,
}: ModelRetrySettingsTabProps) => {
  const { t: uiT } = useDashboardLanguage();

  const isGlobalScope = selectedModelGroup === "global";
  const scopeItems = [
    { value: "global", label: uiT("ui.9395a49f94284d80") },
    ...availableModelGroups.map((group) => ({ value: group, label: group })),
  ];

  const setGlobalValue = (retryPolicyKey: string, value: number | null) => {
    if (value == null) return;
    setGlobalRetryPolicy((prev) => ({ ...(prev ?? {}), [retryPolicyKey]: value }));
  };

  const setModelOverride = (retryPolicyKey: string, value: number | null) => {
    setModelGroupRetryPolicy((prev) => {
      const groupPolicy = { ...(prev?.[selectedModelGroup!] ?? {}) };
      if (value == null) {
        delete groupPolicy[retryPolicyKey];
      } else {
        groupPolicy[retryPolicyKey] = value;
      }
      return { ...(prev ?? {}), [selectedModelGroup!]: groupPolicy };
    });
  };

  const handleRetryCountChange = (retryPolicyKey: string, rawValue: string) => {
    const value = rawValue === "" ? null : Number(rawValue);
    if (value !== null && !isValidRetryCount(value)) return;
    if (isGlobalScope) setGlobalValue(retryPolicyKey, value);
    else setModelOverride(retryPolicyKey, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Label htmlFor="retry-policy-scope">{uiT("ui.e2cbb638e9eaec59")}</Label>
        <div className="w-48">
          <Select
            items={scopeItems}
            value={isGlobalScope ? "global" : selectedModelGroup || availableModelGroups[0]}
            onValueChange={(value) => setSelectedModelGroup(value)}
          >
            <SelectTrigger id="retry-policy-scope" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isGlobalScope ? (
        <div>
          <h2 className="text-lg font-semibold">{uiT("ui.992b86ba05122641")}</h2>
          <p className="text-sm text-muted-foreground">{uiT("ui.3a45356f30bdb2f7")}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold">
            {uiT("ui.35a2e3e8d830e34c")} {selectedModelGroup}
          </h2>
          <p className="text-sm text-muted-foreground">{uiT("ui.f83e4d9aec763995")}</p>
        </div>
      )}
      <table className="w-full">
        <tbody>
          {Object.entries(retryPolicyMap).map(([exceptionType, retryPolicyKey]) => {
            const inheritedValue = globalRetryPolicy?.[retryPolicyKey] ?? defaultRetry;
            const override = isGlobalScope ? undefined : modelGroupRetryPolicy?.[selectedModelGroup!]?.[retryPolicyKey];
            const hasOverride = override != null;

            return (
              <tr key={retryPolicyKey} className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
                <td className="text-sm">
                  <span>{translateText(exceptionType)}</span>
                  {!isGlobalScope && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {uiT("ui.a3068051871091b1")} {inheritedValue})
                    </span>
                  )}
                </td>
                <td className="flex items-center gap-2">
                  <Input
                    className="w-28"
                    type="number"
                    aria-label={uiT("ui.06119f4546f0b237", { v0: String(exceptionType) })}
                    min={0}
                    step={1}
                    value={isGlobalScope ? inheritedValue : hasOverride ? override : ""}
                    placeholder={isGlobalScope ? undefined : String(inheritedValue)}
                    onChange={(event) => handleRetryCountChange(retryPolicyKey, event.currentTarget.value)}
                  />
                  {!isGlobalScope && hasOverride && (
                    <Button variant="ghost" size="xs" onClick={() => setModelOverride(retryPolicyKey, null)}>
                      {uiT("ui.daee7606b339")}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Button onClick={handleSaveRetrySettings} disabled={isSaving}>
        {isSaving && <LoaderCircle className="animate-spin" />}
        {uiT("ui.1509f561f241")}
      </Button>
    </div>
  );
};

export default ModelRetrySettingsTab;
