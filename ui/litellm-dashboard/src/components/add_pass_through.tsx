"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";
import { CircleHelp, Info, Plug } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useWatch } from "react-hook-form";
import { z } from "zod";

import { createPassThroughEndpoint } from "./networking";
import NumericalInput from "./shared/numerical_input";
import KeyValueInput, { type KeyValuePair } from "./key_value_input";
import QueryParamInput from "./query_param_input";
import { passThroughItem } from "./PassThroughSettings/PassThroughSettings";
import RoutePreview from "./route_preview";
import { toast } from "@/lib/toast";
import PassThroughSecuritySection from "./common_components/PassThroughSecuritySection";
import PassThroughGuardrailsSection from "./common_components/PassThroughGuardrailsSection";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const HTTP_METHOD_OPTIONS = HTTP_METHODS.map((method) => ({ label: method, value: method }));

type GuardrailSettings = Record<string, { request_fields?: string[]; response_fields?: string[] } | null>;

const keyValuePairsSchema = z.array(z.tuple([z.string(), z.string()]));

const passThroughFormSchema = z.object({
  path: z.string().min(1, "Path is required").regex(/^\//, "Path is required"),
  target: z
    .string()
    .min(1, "Target URL is required")
    .pipe(z.url({ error: () => translateUi("ui.ca0ae580f926d5f5") })),
  methods: z.array(z.string()).optional(),
  include_subpath: z.boolean(),
  headers: keyValuePairsSchema.refine((pairs) => pairs.some(([name]) => name !== ""), {
    get error() {
      return translateUi("ui.68a0a47a91ad15d2");
    },
  }),
  default_query_params: keyValuePairsSchema.optional(),
  auth: z.boolean().optional(),
  timeout: z.string().optional(),
  cost_per_request: z.string().optional(),
});

type PassThroughFormValues = z.output<typeof passThroughFormSchema>;

const emptyFormValues = {
  path: "",
  target: "",
  methods: undefined,
  include_subpath: true,
  headers: [],
  default_query_params: undefined,
  auth: undefined,
  timeout: undefined,
  cost_per_request: undefined,
} as unknown as PassThroughFormValues;

const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
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

const optionalText = (raw: string): string | undefined => (raw === "" ? undefined : raw);

const toRecord = (pairs: readonly KeyValuePair[]): Record<string, string> =>
  Object.fromEntries(pairs.filter(([name]) => name !== ""));

const optionalRecord = (pairs: readonly KeyValuePair[] | undefined): Record<string, string> | undefined => {
  const record = toRecord(pairs ?? []);
  return Object.keys(record).length > 0 ? record : undefined;
};

interface AddFallbacksProps {
  accessToken: string;
  passThroughItems: passThroughItem[];
  setPassThroughItems: React.Dispatch<React.SetStateAction<passThroughItem[]>>;
  premiumUser?: boolean;
}

const AddPassThroughEndpoint: React.FC<AddFallbacksProps> = ({
  accessToken,
  setPassThroughItems,
  passThroughItems,
  premiumUser = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guardrails, setGuardrails] = useState<GuardrailSettings>({});
  const form = useZodForm(passThroughFormSchema, { defaultValues: emptyFormValues });

  const pathValue = useWatch({ control: form.control, name: "path" });
  const targetValue = useWatch({ control: form.control, name: "target" });
  const includeSubpath = useWatch({ control: form.control, name: "include_subpath" });
  const selectedMethods = useWatch({ control: form.control, name: "methods" }) ?? [];

  const handleCancel = () => {
    form.reset(emptyFormValues);
    setGuardrails({});
    setIsModalVisible(false);
  };

  const addPassThrough = async (values: PassThroughFormValues) => {
    setIsLoading(true);
    try {
      const formValues = {
        path: values.path,
        target: values.target,
        methods: values.methods,
        include_subpath: values.include_subpath,
        headers: toRecord(values.headers),
        default_query_params: optionalRecord(values.default_query_params),
        ...(premiumUser ? { auth: values.auth } : {}),
        timeout: values.timeout,
        cost_per_request: values.cost_per_request,
        ...(Object.keys(guardrails).length > 0 ? { guardrails } : {}),
      };

      const response = await createPassThroughEndpoint(accessToken, formValues);
      const createdEndpoint = response.endpoints[0];

      setPassThroughItems([...passThroughItems, createdEndpoint]);

      toast.success(translateUi("ui.c331b5f28e556609"));
      form.reset(emptyFormValues);
      setGuardrails({});
      setIsModalVisible(false);
    } catch (error) {
      toast.fromError("Error creating pass-through endpoint: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div>
        <Button className="mx-auto mb-4 mt-4" onClick={() => setIsModalVisible(true)}>
          {uiT("ui.34fef46337a5cc5c")}
        </Button>
        <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="top-8 max-h-[calc(100dvh-4rem)] translate-y-0 overflow-y-auto sm:max-w-[1000px]">
            <DialogHeader>
              <div className="flex items-center space-x-3 border-b border-border pb-4">
                <Plug className="size-5 text-info" />
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {uiT("ui.a55f6f60eb61d43b")}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="mt-6">
              <Alert variant="info" className="mb-6">
                <Info />
                <AlertTitle>{uiT("ui.2c6752f2263aefcd")}</AlertTitle>
                <AlertDescription>{uiT("ui.6307b5bef1990952")}</AlertDescription>
              </Alert>

              <form onSubmit={form.handleSubmit(addPassThrough)} className="space-y-6">
                <Card className="block p-5">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.48aeab978c66c1e5")}</h3>
                  <p className="mb-5 text-sm text-muted-foreground">{uiT("ui.9412f78b25534287")}</p>

                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="path"
                      label={uiT("ui.960004b385ebe27a")}
                      description={uiT("ui.52593e6d37ec5733")}
                    >
                      {({ value, onChange, ...field }) => (
                        <Input
                          {...field}
                          placeholder={uiT("ui.b217b94b313d464b")}
                          value={value ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value;
                            onChange(raw && !raw.startsWith("/") ? "/" + raw : raw);
                          }}
                        />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="target"
                      label={uiT("ui.5b341c960fb7166e")}
                      description={uiT("ui.549dc3460a7cf914")}
                    >
                      {({ value, ...field }) => (
                        <Input {...field} placeholder="https://engine.prod.bria-api.com" value={value ?? ""} />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="methods"
                      label={labelWithHint(
                        "HTTP Methods (Optional)",
                        "Select specific HTTP methods. Leave empty to support all methods (GET, POST, PUT, DELETE, PATCH). Useful when the same path needs different targets for different methods.",
                      )}
                      description={
                        selectedMethods.length === 0
                          ? uiT("ui.c47de8f7320089c5")
                          : uiT("ui.2b571a1c9b8698db", { v0: String(selectedMethods.join(", ")) })
                      }
                    >
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <Select multiple items={HTTP_METHOD_OPTIONS} value={value ?? []} onValueChange={onChange}>
                          <SelectTrigger {...field} className="w-full">
                            <SelectValue placeholder={uiT("ui.b6cf4149d927c9a3")}>
                              {(selected: string[]) =>
                                selected.length === 0 ? "Select methods (leave empty for all)" : selected.join(", ")
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {HTTP_METHODS.map((method) => (
                              <SelectItem key={method} value={method} title={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{uiT("ui.7e3544fd4862bfa4")}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{uiT("ui.c64bfc65abcdfa37")}</div>
                      </div>
                      <FormField control={form.control} name="include_subpath">
                        {({ value, onChange, ref: _ref, ...field }) => (
                          <Switch {...field} checked={value} onCheckedChange={onChange} />
                        )}
                      </FormField>
                    </div>
                  </div>
                </Card>

                <RoutePreview pathValue={pathValue} targetValue={targetValue} includeSubpath={includeSubpath} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.194e9fe656a1bcab")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{uiT("ui.905be6c0d2468605")}</p>

                  <FormField
                    control={form.control}
                    name="headers"
                    label={labelWithHint(
                      "Authentication Headers",
                      "Authentication and other headers to forward with requests",
                    )}
                    description={
                      <>
                        <span className="mb-1 block font-medium">{uiT("ui.946f766a0cdb9930")}</span>
                        <span className="block">{uiT("ui.f435723ebec856e3")}</span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <KeyValueInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.5bc8be5d6c9f7b25")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{uiT("ui.d1eb4d45d8f49d90")}</p>

                  <FormField
                    control={form.control}
                    name="default_query_params"
                    label={labelWithHint(
                      "Default Query Parameters (Optional)",
                      "Query parameters that will be added to all requests. Clients can override these by providing their own values.",
                    )}
                    description={
                      <>
                        <span className="mb-1 block font-medium">{uiT("ui.a24ebc2a9578a67a")}</span>
                        <span className="block">{uiT("ui.caf1b9f210577a92")}</span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <QueryParamInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <FormField control={form.control} name="auth">
                  {({ value, onChange }) => (
                    <PassThroughSecuritySection
                      premiumUser={premiumUser}
                      authEnabled={value ?? false}
                      onAuthChange={onChange}
                    />
                  )}
                </FormField>

                <PassThroughGuardrailsSection accessToken={accessToken} value={guardrails} onChange={setGuardrails} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.442aded87a55aa8c")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{uiT("ui.57aa148a83b94a7c")}</p>

                  <FormField
                    control={form.control}
                    name="timeout"
                    label={labelWithHint(
                      "Request Timeout (seconds)",
                      "Max time to wait for the upstream API to respond. Leave empty to use general_settings.pass_through_request_timeout (default 600s).",
                    )}
                    description={uiT("ui.3c7bb25dfe739a9c")}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={1}
                        step={1}
                        placeholder="600"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{uiT("ui.3ac8bbca9a74cfbd")}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{uiT("ui.fcf582b0d2caf166")}</p>

                  <FormField
                    control={form.control}
                    name="cost_per_request"
                    label={labelWithHint(
                      "Cost Per Request (USD)",
                      "Optional: Track costs for requests to this endpoint",
                    )}
                    description={uiT("ui.7134ebed2bbc1cc5")}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={0}
                        step={0.001}
                        placeholder="2.0000"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <div className="flex items-center justify-end space-x-3 border-t border-border pt-6">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {uiT("ui.19766ed6ccb2")}
                  </Button>
                  <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading && <UiLoadingSpinner className="size-4" />}
                    {isLoading ? uiT("ui.def70944c9bb") : uiT("ui.a55f6f60eb61d43b")}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AddPassThroughEndpoint;
