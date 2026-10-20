"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/components/networking";
import { toast } from "@/lib/toast";

export interface UseBlockUnpricedConfigProps {
  accessToken: string | null;
}

export interface UseBlockUnpricedConfigReturn {
  blockUnpriced: boolean;
  isUpdating: boolean;
  isLoaded: boolean;
  loadError: boolean;
  fetchBlockUnpriced: () => Promise<void>;
  setBlockUnpriced: (enabled: boolean) => Promise<void>;
}

interface BlockUnpricedResponse {
  enabled: boolean;
}

const ENDPOINT = "/config/block_requests_for_models_without_pricing";

export function useBlockUnpricedConfig({ accessToken }: UseBlockUnpricedConfigProps): UseBlockUnpricedConfigReturn {
  useDashboardLanguage();

  const [stored, setStored] = useState<{ token: string; enabled: boolean; ready: boolean; error: boolean } | null>(
    null,
  );
  const generation = useRef(0);
  useEffect(() => {
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, [accessToken]);
  const scoped = stored?.token === accessToken ? stored : null;
  const blockUnpriced = scoped?.enabled ?? false;
  const isLoaded = scoped?.ready === true;
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchBlockUnpriced = useCallback(async () => {
    if (!accessToken) return;
    const request = ++generation.current;
    setStored((previous) => ({
      token: accessToken,
      enabled: previous?.token === accessToken ? previous.enabled : false,
      ready: false,
      error: false,
    }));
    try {
      const data = await apiClient.get<BlockUnpricedResponse>(ENDPOINT, { accessToken });
      if (typeof data?.enabled !== "boolean") throw new Error("Invalid block-unpriced configuration");
      if (request === generation.current)
        setStored({ token: accessToken, enabled: data.enabled, ready: true, error: false });
    } catch (error) {
      if (request === generation.current) {
        setStored((previous) => ({
          token: accessToken,
          enabled: previous?.token === accessToken ? previous.enabled : false,
          ready: false,
          error: true,
        }));
        toast.fromError(error);
      }
    }
  }, [accessToken]);

  const setBlockUnpriced = useCallback(
    async (enabled: boolean) => {
      if (!accessToken || !isLoaded || isUpdating) return;
      const request = ++generation.current;
      setIsUpdating(true);
      try {
        const data = await apiClient.patch<BlockUnpricedResponse>(ENDPOINT, { accessToken, body: { enabled } });
        if (typeof data?.enabled !== "boolean") throw new Error("Invalid block-unpriced configuration");
        if (request !== generation.current) return;
        setStored({ token: accessToken, enabled: data.enabled, ready: true, error: false });
        toast.success(enabled ? translateUi("ui.a7770cb3c328000d") : translateUi("ui.c119178c3fc34fee"));
      } catch (error) {
        if (request === generation.current) toast.fromError(error);
      } finally {
        setIsUpdating(false);
      }
    },
    [accessToken, isLoaded, isUpdating],
  );

  return {
    blockUnpriced,
    isUpdating,
    isLoaded,
    loadError: scoped?.error === true,
    fetchBlockUnpriced,
    setBlockUnpriced,
  };
}
