"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useState, useCallback } from "react";
import { apiClient } from "@/components/networking";
import { toast } from "@/lib/toast";

export interface UseBlockUnpricedConfigProps {
  accessToken: string | null;
}

export interface UseBlockUnpricedConfigReturn {
  blockUnpriced: boolean;
  isUpdating: boolean;
  fetchBlockUnpriced: () => Promise<void>;
  setBlockUnpriced: (enabled: boolean) => Promise<void>;
}

interface BlockUnpricedResponse {
  enabled: boolean;
}

const ENDPOINT = "/config/block_requests_for_models_without_pricing";

export function useBlockUnpricedConfig({ accessToken }: UseBlockUnpricedConfigProps): UseBlockUnpricedConfigReturn {
  useDashboardLanguage();

  const [blockUnpriced, setBlockUnpricedState] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchBlockUnpriced = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiClient.get<BlockUnpricedResponse>(ENDPOINT, { accessToken });
      setBlockUnpricedState(Boolean(data?.enabled));
    } catch (error) {
      console.error("Error fetching block-unpriced-models setting:", error);
      toast.fromError(error);
    }
  }, [accessToken]);

  const setBlockUnpriced = useCallback(
    async (enabled: boolean) => {
      if (!accessToken) return;
      setIsUpdating(true);
      try {
        const data = await apiClient.patch<BlockUnpricedResponse>(ENDPOINT, { accessToken, body: { enabled } });
        setBlockUnpricedState(Boolean(data?.enabled));
        toast.success(enabled ? translateUi("ui.a7770cb3c328000d") : translateUi("ui.c119178c3fc34fee"));
      } catch (error) {
        console.error("Error updating block-unpriced-models setting:", error);
        toast.fromError(error);
      } finally {
        setIsUpdating(false);
      }
    },
    [accessToken],
  );

  return {
    blockUnpriced,
    isUpdating,
    fetchBlockUnpriced,
    setBlockUnpriced,
  };
}
