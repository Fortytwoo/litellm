"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { managedFetch } from "@/lib/http/managedSession";
import { getGlobalLitellmHeaderName, getProxyBaseUrl } from "@/components/networking";
import { toast } from "@/lib/toast";
import { t } from "@/i18n";

export function useStoredCostConfig<T>(
  accessToken: string | null,
  {
    path,
    validate,
    label,
    successMessage,
  }: {
    path: string;
    validate: (value: unknown) => value is T;
    label: string;
    successMessage: string;
  },
) {
  const [stored, setStored] = useState<{ token: string; values?: T; ready: boolean; error: string | null } | null>(
    null,
  );
  const currentToken = useRef(accessToken);
  const generation = useRef(0);
  const saving = useRef(false);

  useEffect(() => {
    currentToken.current = accessToken;
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, [accessToken]);

  const load = useCallback(async (): Promise<boolean> => {
    if (!accessToken || currentToken.current !== accessToken) return false;
    const request = ++generation.current;
    setStored((previous) => ({
      token: accessToken,
      values: previous?.token === accessToken ? previous.values : undefined,
      ready: false,
      error: null,
    }));
    try {
      const response = await managedFetch(`${getProxyBaseUrl() ?? ""}${path}`, {
        headers: { [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("values" in data)) throw new Error("Invalid configuration response");
      const values: unknown = data.values ?? {};
      if (!validate(values)) throw new Error("Invalid configuration response");
      if (request !== generation.current || currentToken.current !== accessToken) return false;
      setStored({ token: accessToken, values, ready: true, error: null });
      return true;
    } catch {
      if (request === generation.current && currentToken.current === accessToken) {
        const error = t("nativeLoad.configFetch", undefined, { kind: label });
        setStored((previous) => ({
          token: accessToken,
          values: previous?.token === accessToken ? previous.values : undefined,
          ready: false,
          error,
        }));
        toast.fromError(error);
      }
      return false;
    }
  }, [accessToken, path, validate, label]);

  const scoped = stored?.token === accessToken ? stored : null;
  const save = useCallback(
    async (values: T): Promise<boolean> => {
      if (!accessToken || currentToken.current !== accessToken || !scoped?.ready || saving.current) {
        toast.fromError(t("nativeLoad.reloadBeforeSave"));
        return false;
      }
      saving.current = true;
      try {
        const response = await managedFetch(`${getProxyBaseUrl() ?? ""}${path}`, {
          method: "PATCH",
          headers: { [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (currentToken.current !== accessToken) return false;
        const loaded = await load();
        if (loaded) toast.success(successMessage);
        return loaded;
      } catch {
        toast.fromError(t("nativeLoad.configSave", undefined, { kind: label }));
        return false;
      } finally {
        saving.current = false;
      }
    },
    [accessToken, path, scoped?.ready, load, label, successMessage],
  );

  return { config: scoped?.values, isLoaded: scoped?.ready === true, loadError: scoped?.error ?? null, load, save };
}
