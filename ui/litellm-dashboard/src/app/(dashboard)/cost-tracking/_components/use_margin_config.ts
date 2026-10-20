"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useCallback } from "react";
import { useStoredCostConfig } from "./use_stored_cost_config";
import { toast } from "@/lib/toast";
import { MarginConfig } from "./types";
import { getProviderBackendValue } from "./provider_display_helpers";
import { Providers } from "@/components/provider_info_helpers";

export interface UseMarginConfigProps {
  accessToken: string | null;
}

export interface UseMarginConfigReturn {
  marginConfig: MarginConfig;
  isLoaded: boolean;
  loadError: string | null;
  fetchMarginConfig: () => Promise<boolean>;
  saveMarginConfig: (config: MarginConfig) => Promise<boolean>;
  handleAddMargin: (params: AddMarginParams) => Promise<boolean>;
  handleRemoveMargin: (provider: string) => Promise<void>;
  handleMarginChange: (
    provider: string,
    value: number | { percentage?: number; fixed_amount?: number },
  ) => Promise<void>;
}

export interface AddMarginParams {
  selectedProvider: string | undefined;
  marginType: "percentage" | "fixed";
  percentageValue: string;
  fixedAmountValue: string;
}

function validConfig(value: unknown): value is MarginConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((item) =>
    typeof item === "number"
      ? Number.isFinite(item)
      : item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        Object.entries(item).every(
          ([key, amount]) =>
            ["percentage", "fixed_amount"].includes(key) && typeof amount === "number" && Number.isFinite(amount),
        ),
  );
}

export function useMarginConfig({ accessToken }: UseMarginConfigProps): UseMarginConfigReturn {
  useDashboardLanguage();

  const {
    config,
    isLoaded,
    loadError,
    load: fetchMarginConfig,
    save: saveMarginConfig,
  } = useStoredCostConfig<MarginConfig>(accessToken, {
    path: "/config/cost_margin_config",
    validate: validConfig,
    label: "margin",
    successMessage: translateUi("ui.65e88328f972f58b"),
  });
  const marginConfig = config ?? {};

  const handleAddMargin = useCallback(
    async (params: AddMarginParams): Promise<boolean> => {
      const { selectedProvider, marginType, percentageValue, fixedAmountValue } = params;

      if (!selectedProvider) {
        toast.fromError("Please select a provider");
        return false;
      }

      let providerValue: string;
      if (selectedProvider === "global") {
        providerValue = "global";
      } else {
        const backendValue = getProviderBackendValue(selectedProvider);
        if (!backendValue) {
          toast.fromError("Invalid provider selected");
          return false;
        }
        providerValue = backendValue;
      }

      if (providerValue in marginConfig) {
        const displayName =
          providerValue === "global" ? "Global" : Providers[selectedProvider as keyof typeof Providers];
        toast.fromError(`Margin for ${displayName} already exists. Edit it in the table above.`);
        return false;
      }

      let marginValue: number | { fixed_amount?: number };
      if (marginType === "percentage") {
        const percentValue = parseFloat(percentageValue);
        if (isNaN(percentValue) || percentValue < 0 || percentValue > 1000) {
          toast.fromError("Percentage must be between 0% and 1000%");
          return false;
        }
        marginValue = percentValue / 100;
      } else {
        const fixedValue = parseFloat(fixedAmountValue);
        if (isNaN(fixedValue) || fixedValue < 0) {
          toast.fromError("Fixed amount must be non-negative");
          return false;
        }
        marginValue = { fixed_amount: fixedValue };
      }

      const updatedConfig = {
        ...marginConfig,
        [providerValue]: marginValue,
      };

      return saveMarginConfig(updatedConfig);
    },
    [marginConfig, saveMarginConfig],
  );

  const handleRemoveMargin = useCallback(
    async (provider: string) => {
      const updatedConfig = { ...marginConfig };
      delete updatedConfig[provider];
      await saveMarginConfig(updatedConfig);
    },
    [marginConfig, saveMarginConfig],
  );

  const handleMarginChange = useCallback(
    async (provider: string, value: number | { percentage?: number; fixed_amount?: number }) => {
      const updatedConfig = {
        ...marginConfig,
        [provider]: value,
      };
      await saveMarginConfig(updatedConfig);
    },
    [marginConfig, saveMarginConfig],
  );

  return {
    marginConfig,
    isLoaded,
    loadError,
    fetchMarginConfig,
    saveMarginConfig,
    handleAddMargin,
    handleRemoveMargin,
    handleMarginChange,
  };
}
