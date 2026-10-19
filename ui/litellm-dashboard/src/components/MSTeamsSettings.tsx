"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { getCallbacksCall, serviceHealthCheck, setCallbacksCall } from "./networking";

interface AlertingDestination {
  name: string;
  variables?: Record<string, string | null>;
}

interface MSTeamsSettingsProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  alerts: AlertingDestination[];
}

const FIELD_HELP: Record<string, React.ReactNode> = {
  get MS_TEAMS_WEBHOOK_URL() {
    return (
      <>
        {translateUi("ui.a0eb166eea16e346")}
        <span className="text-destructive"> {translateUi("ui.5f896c7415b77201")} </span>
      </>
    );
  },
};

const SENSITIVE_FIELD_PATTERN = /(PASSWORD|SECRET|KEY|TOKEN|URL)/i;

const MSTeamsSettings: React.FC<MSTeamsSettingsProps> = ({ accessToken, userID, userRole, alerts }) => {
  const { t: uiT } = useDashboardLanguage();

  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleFieldVisibility = (key: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveMSTeamsSettings = async () => {
    if (!accessToken || !userID || !userRole) {
      return;
    }

    // Only send fields the admin actually edited. Values rendered from the
    // server are masked or sourced from the process environment, so
    // re-submitting an untouched field would persist a mask or copy
    // env-managed config into the database.
    const updatedVariables: Record<string, string> = Object.fromEntries(
      alerts
        .filter((alert) => alert.name === "ms_teams")
        .flatMap((alert) =>
          Object.entries(alert.variables ?? {}).flatMap(([key, value]) => {
            const inputElement = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
            if (!inputElement || !inputElement.value) {
              return [];
            }
            if (inputElement.value === (value == null ? "" : String(value))) {
              return [];
            }
            return [[key, inputElement.value] as const];
          }),
        ),
    );

    try {
      // Re-read the persisted destinations at save time so that a Teams save
      // never restores destinations another form disabled after page load.
      const currentConfig = await getCallbacksCall(accessToken, userID, userRole);
      const currentDestinations: string[] = currentConfig.active_alerting_destinations ?? [];
      const payload = {
        general_settings: {
          alerting: Array.from(new Set([...currentDestinations, "ms_teams"])),
        },
        environment_variables: updatedVariables,
      };
      await setCallbacksCall(accessToken, payload);
      toast.success(translateUi("ui.07a83133f434ea70"));
    } catch (error) {
      toast.fromError(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{uiT("ui.80a977f2e818b3e7")}</CardTitle>
        <p className="text-sm">
          {uiT("ui.fe79afee5c5f64a5")}{" "}
          <a
            href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            {uiT("ui.893424c659002f53")}
          </a>
        </p>
      </CardHeader>

      <CardContent>
        {alerts
          .filter((alert) => alert.name === "ms_teams")
          .map((alert, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(alert.variables ?? {}).map(([key, value]) => {
                const isSensitive = SENSITIVE_FIELD_PATTERN.test(key);
                const isVisible = visibleFields[key] || false;
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm">{key}</p>
                    <InputGroup className="max-w-100">
                      <InputGroupInput
                        name={key}
                        defaultValue={value as string}
                        type={isSensitive && !isVisible ? "password" : "text"}
                      />
                      {isSensitive && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            onClick={() => toggleFieldVisibility(key)}
                            aria-label={isVisible ? uiT("ui.7f945bb5247d01a9") : uiT("ui.4f65689fea0d449f")}
                          >
                            {isVisible ? <EyeOff /> : <Eye />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                    <div className="text-xs text-muted-foreground italic">{FIELD_HELP[key]}</div>
                  </div>
                );
              })}
            </div>
          ))}

        <div className="mt-6 flex gap-2">
          <Button onClick={() => handleSaveMSTeamsSettings()}>{uiT("ui.35322b5bb5a2")}</Button>
          <Button
            variant="secondary"
            onClick={async () => {
              if (!accessToken) return;
              try {
                await serviceHealthCheck(accessToken, "ms_teams");
                toast.success(translateUi("ui.ee1b2cbc9ac298d2"));
              } catch (error) {
                toast.fromError(error);
              }
            }}
          >
            {uiT("ui.efc56e307cdfe5d0")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MSTeamsSettings;
