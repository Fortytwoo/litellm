"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useCallback } from "react";
import { useStoredCostConfig } from "./use_stored_cost_config";
import { toast } from "@/lib/toast";
import { DiscountConfig } from "./types";
import { getProviderBackendValue } from "./provider_display_helpers";
import { Providers } from "@/components/provider_info_helpers";

export interface UseDiscountConfigProps {
  accessToken: string | null;
}

export interface UseDiscountConfigReturn {
  discountConfig: DiscountConfig;
  isLoaded: boolean;
  loadError: string | null;
  fetchDiscountConfig: () => Promise<boolean>;
  saveDiscountConfig: (config: DiscountConfig) => Promise<boolean>;
  handleAddProvider: (selectedProvider: string | undefined, newDiscount: string) => Promise<boolean>;
  handleRemoveProvider: (provider: string) => Promise<void>;
  handleDiscountChange: (provider: string, value: string) => Promise<void>;
}

function validConfig(value: unknown): value is DiscountConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((item) => typeof item === "number" && Number.isFinite(item));
}

export function useDiscountConfig({ accessToken }: UseDiscountConfigProps): UseDiscountConfigReturn {
  useDashboardLanguage();

  const {
    config,
    isLoaded,
    loadError,
    load: fetchDiscountConfig,
    save: saveDiscountConfig,
  } = useStoredCostConfig<DiscountConfig>(accessToken, {
    path: "/config/cost_discount_config",
    validate: validConfig,
    label: "discount",
    successMessage: translateUi("ui.d67eb4bce0f40efd"),
  });
  const discountConfig = config ?? {};

  const handleAddProvider = useCallback(
    async (selectedProvider: string | undefined, newDiscount: string): Promise<boolean> => {
      if (!selectedProvider || !newDiscount) {
        toast.fromError("Please select a provider and enter discount percentage");
        return false;
      }

      const percentageValue = parseFloat(newDiscount);
      if (isNaN(percentageValue) || percentageValue < 0 || percentageValue > 100) {
        toast.fromError("Discount must be between 0% and 100%");
        return false;
      }

      const providerValue = getProviderBackendValue(selectedProvider);

      if (!providerValue) {
        toast.fromError("Invalid provider selected");
        return false;
      }

      if (providerValue in discountConfig) {
        toast.fromError(
          `Discount for ${Providers[selectedProvider as keyof typeof Providers]} already exists. Edit it in the table above.`,
        );
        return false;
      }

      const discountValue = percentageValue / 100;
      const updatedConfig = {
        ...discountConfig,
        [providerValue]: discountValue,
      };

      return saveDiscountConfig(updatedConfig);
    },
    [discountConfig, saveDiscountConfig],
  );

  const handleRemoveProvider = useCallback(
    async (provider: string) => {
      const updatedConfig = { ...discountConfig };
      delete updatedConfig[provider];
      await saveDiscountConfig(updatedConfig);
    },
    [discountConfig, saveDiscountConfig],
  );

  const handleDiscountChange = useCallback(
    async (provider: string, value: string) => {
      const discountValue = parseFloat(value);
      if (!isNaN(discountValue) && discountValue >= 0 && discountValue <= 1) {
        const updatedConfig = {
          ...discountConfig,
          [provider]: discountValue,
        };
        await saveDiscountConfig(updatedConfig);
      }
    },
    [discountConfig, saveDiscountConfig],
  );

  return {
    discountConfig,
    isLoaded,
    loadError,
    fetchDiscountConfig,
    saveDiscountConfig,
    handleAddProvider,
    handleRemoveProvider,
    handleDiscountChange,
  };
}
