"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { isAdminRole } from "@/utils/roles";
import { useQuery } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/molecules/logo/Logo";
import { toast } from "@/lib/toast";
import { createSearchTool, fetchAvailableSearchProviders } from "@/components/networking";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import SearchConnectionTest from "./SearchConnectionTest";
import { buildSearchToolPayload } from "./searchToolPayload";
import { AvailableSearchProvider, SearchTool } from "./types";
import bingLogo from "../../../../../public/assets/logos/bing.png";
import dataforseoLogo from "../../../../../public/assets/logos/dataforseo.png";
import exaAiLogo from "../../../../../public/assets/logos/exa_ai.png";
import googlePseLogo from "../../../../../public/assets/logos/google_pse.png";
import nimbleLogo from "../../../../../public/assets/logos/nimble.png";
import parallelAiLogo from "../../../../../public/assets/logos/parallel_ai.png";
import perplexityLogo from "../../../../../public/assets/logos/perplexity.png";
import tavilyLogo from "../../../../../public/assets/logos/tavily.png";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const searchProviderLogoMap: Record<string, string> = {
  perplexity: perplexityLogo.src,
  tavily: tavilyLogo.src,
  parallel_ai: parallelAiLogo.src,
  exa_ai: exaAiLogo.src,
  google_pse: googlePseLogo.src,
  dataforseo: dataforseoLogo.src,
  nimble: nimbleLogo.src,
  bing_grounding: bingLogo.src,
};

interface SearchProviderLabelProps {
  providerName: string;
  displayName: string;
}

export const SearchProviderLabel: React.FC<SearchProviderLabelProps> = ({ providerName, displayName }) => (
  <div
    style={{
      get display() {
        return translateUi("ui.222f930b87524636");
      },
      get alignItems() {
        return translateUi("ui.f179a509d32bd92c");
      },
      get gap() {
        return translateUi("ui.eb4ebe481cc0c70e");
      },
    }}
  >
    <Logo src={searchProviderLogoMap[providerName]} label={displayName} className="w-5 h-5 object-contain" />
    <span>{displayName}</span>
  </div>
);

const createSearchToolShape = {
  search_tool_name: z
    .string()
    .min(1, "Please enter a search tool name")
    .regex(/^[a-zA-Z0-9_-]+$/, "Name can only contain letters, numbers, hyphens, and underscores"),
  search_provider: z
    .string()
    .nullable()
    .pipe(z.string({ error: () => translateUi("ui.1b7e60f4fc9377e1") }).min(1, "Please select a search provider")),
  api_key: z.string().optional(),
  description: z.string().optional(),
};

const createSearchToolSchema = z.object(createSearchToolShape);

type CreateSearchToolFormValues = z.infer<typeof createSearchToolSchema>;

const EMPTY_VALUES: z.input<typeof createSearchToolSchema> = { search_tool_name: "", search_provider: null };

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    <LocalizedText>{label}</LocalizedText>
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>
        <LocalizedText>{hint}</LocalizedText>
      </TooltipContent>
    </Tooltip>
  </>
);

interface CreateSearchToolProps {
  userRole: string;
  accessToken: string | null;
  onCreateSuccess: (newSearchTool: SearchTool) => void;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const CreateSearchTool: React.FC<CreateSearchToolProps> = ({
  userRole,
  accessToken,
  onCreateSuccess,
  isModalVisible,
  setModalVisible,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(createSearchToolSchema, { defaultValues: EMPTY_VALUES });
  const [isLoading, setIsLoading] = useState(false);
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestId, setConnectionTestId] = useState<string>("");
  const [watchedProvider, watchedApiKey] = useWatch({
    control: form.control,
    name: ["search_provider", "api_key"],
  });

  const { data: providersResponse, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["searchProviders"],
    queryFn: () => {
      if (!accessToken) throw new Error("Access Token required");
      return fetchAvailableSearchProviders(accessToken);
    },
    enabled: !!accessToken && isModalVisible,
  }) as { data: { providers: AvailableSearchProvider[] }; isLoading: boolean };

  const availableProviders = providersResponse?.providers;
  const providerNames = useMemo(
    () => (availableProviders ?? []).map((provider) => provider.provider_name),
    [availableProviders],
  );
  const providerLabel = useCallback(
    (providerName: string) =>
      (availableProviders ?? []).find((provider) => provider.provider_name === providerName)?.ui_friendly_name ??
      providerName,
    [availableProviders],
  );

  const handleCreate = async (formValues: CreateSearchToolFormValues) => {
    setIsLoading(true);
    try {
      const payload = buildSearchToolPayload(formValues);

      if (accessToken != null) {
        const response = await createSearchTool(accessToken, payload);

        toast.success(translateUi("ui.b15a3d93f3fe08bb"));
        form.reset(EMPTY_VALUES);
        setModalVisible(false);
        onCreateSuccess(response);
      }
    } catch (error) {
      toast.error(translateUi("ui.5a53af800f8e8105", undefined, { v0: String(error) }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset(EMPTY_VALUES);
    setModalVisible(false);
  };

  const handleTestConnection = async () => {
    const isValid = await form.trigger(["search_provider", "api_key"]);
    if (!isValid) {
      toast.error(translateUi("ui.5761080e52cb8847"));
      return;
    }

    setIsTestingConnection(true);
    setConnectionTestId(`test-${Date.now()}`);
    setIsTestModalVisible(true);
  };

  if (!isAdminRole(userRole)) {
    return null;
  }

  return (
    <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="top-8 max-h-[calc(100dvh-4rem)] translate-y-0 overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <div className="flex items-center space-x-3 pb-4 border-b border-border">
            <span className="text-2xl">🔍</span>
            <DialogTitle className="text-xl font-semibold text-foreground">{uiT("ui.d9efe4415176bdd5")}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="mt-6">
          <TooltipProvider>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="search_tool_name"
                  label={labelWithHint(
                    "Search Tool Name",
                    "A unique name to identify this search tool configuration (e.g., 'perplexity-search', 'tavily-news-search').",
                  )}
                >
                  {({ ref, ...field }) => (
                    <Input {...field} ref={ref} placeholder={uiT("ui.a027f8ad9fa1abe1")} className="rounded-lg" />
                  )}
                </FormField>

                <FormField
                  control={form.control}
                  name="search_provider"
                  label={labelWithHint(
                    "Search Provider",
                    "Select the search provider you want to use. Each provider has different capabilities and pricing.",
                  )}
                >
                  {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                    <Combobox
                      items={providerNames}
                      itemToStringLabel={providerLabel}
                      value={value}
                      onValueChange={onChange}
                    >
                      <ComboboxInput
                        id={id}
                        aria-invalid={ariaInvalid}
                        aria-describedby={ariaDescribedBy}
                        placeholder={uiT("ui.08e8cf60e8e94486")}
                        className="h-10 w-full rounded-lg"
                        disabled={isLoadingProviders}
                        showClear={value != null && value !== ""}
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>{uiT("ui.b1e847855129e647")}</ComboboxEmpty>
                        <ComboboxList>
                          {(providerName: string) => (
                            <ComboboxItem key={providerName} value={providerName}>
                              <SearchProviderLabel
                                providerName={providerName}
                                displayName={providerLabel(providerName)}
                              />
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                </FormField>

                <FormField
                  control={form.control}
                  name="api_key"
                  label={labelWithHint(
                    "API Key",
                    "The API key for authenticating with the search provider. This will be securely stored.",
                  )}
                >
                  {({ ref, value, ...field }) => (
                    <PasswordInput
                      {...field}
                      ref={ref}
                      value={value ?? ""}
                      placeholder={uiT("ui.8e1c7ba669b601e5")}
                      groupClassName="h-10 rounded-lg"
                    />
                  )}
                </FormField>

                <FormField control={form.control} name="description" label={uiT("ui.c3524d9f7abeed88")}>
                  {({ ref, value, ...field }) => (
                    <Textarea
                      {...field}
                      ref={ref}
                      value={value ?? ""}
                      rows={3}
                      placeholder={uiT("ui.ab81a0f1a45e2f35")}
                      className="rounded-lg"
                    />
                  )}
                </FormField>
              </FieldGroup>

              <div className="flex justify-between items-center pt-6 border-t border-border">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <a
                        className="text-sm text-info hover:underline"
                        href="https://github.com/BerriAI/litellm/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {uiT("ui.5c799f5aa8a75879")}
                      </a>
                    }
                  />
                  <TooltipContent>{uiT("ui.432f534e73f8eb9f")}</TooltipContent>
                </Tooltip>
                <div className="flex gap-2">
                  <Button type="submit" variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
                    {isTestingConnection && <UiLoadingSpinner className="size-4" />}
                    {uiT("ui.c02977b07ec93816")}
                  </Button>
                  <Button type="submit" variant="outline" disabled={isLoading}>
                    {isLoading && <UiLoadingSpinner className="size-4" />}
                    {uiT("ui.b2b2929eec5973d8")}
                  </Button>
                </div>
              </div>
            </form>
          </TooltipProvider>
        </div>

        <Dialog
          open={isTestModalVisible}
          onOpenChange={(open) => {
            if (!open) {
              setIsTestModalVisible(false);
              setIsTestingConnection(false);
            }
          }}
        >
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{uiT("ui.0ec99e1bdc5ce188")}</DialogTitle>
            </DialogHeader>
            {isTestModalVisible && accessToken && (
              <SearchConnectionTest
                key={connectionTestId}
                litellmParams={{
                  search_provider: watchedProvider ?? undefined,
                  api_key: watchedApiKey,
                  api_base: undefined,
                }}
                accessToken={accessToken}
                onTestComplete={() => setIsTestingConnection(false)}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTestModalVisible(false);
                  setIsTestingConnection(false);
                }}
              >
                {uiT("ui.7d9eb7acb13e")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSearchTool;
