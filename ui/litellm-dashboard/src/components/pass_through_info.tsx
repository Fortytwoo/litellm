"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { updatePassThroughEndpoint, deletePassThroughEndpointsCall } from "./networking";
import { Eye, EyeOff } from "lucide-react";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import RoutePreview from "./route_preview";
import { toast } from "@/lib/toast";
import PassThroughSecuritySection from "./common_components/PassThroughSecuritySection";
import PassThroughGuardrailsSection from "./common_components/PassThroughGuardrailsSection";
import { FormField } from "@/components/shared/form/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const HTTP_METHOD_OPTIONS = HTTP_METHODS.map((method) => ({ label: method, value: method }));

const endpointSettingsSchema = z.object({
  target: z.string().min(1, "Please input a target URL"),
  headers: z.string(),
  methods: z.array(z.string()),
  include_subpath: z.boolean(),
  cost_per_request: z.number().optional(),
  timeout: z.number().optional(),
  auth: z.boolean(),
});

type EndpointSettingsValues = z.output<typeof endpointSettingsSchema>;

const roundToPrecision = (raw: string, precision: number): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return undefined;
  const factor = 10 ** precision;
  return Math.round(parsed * factor) / factor;
};

interface PrecisionNumberInputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "value" | "onChange"> {
  value: number | undefined;
  precision: number;
  onValueChange: (value: number | undefined) => void;
  prefix?: string;
}

const PrecisionNumberInput = ({
  value,
  precision,
  onValueChange,
  onBlur,
  prefix,
  ...rest
}: PrecisionNumberInputProps) => {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));

  const inputProps = {
    ...rest,
    type: "number" as const,
    value: draft,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
      onValueChange(roundToPrecision(event.target.value, precision));
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      const rounded = roundToPrecision(draft, precision);
      setDraft(rounded === undefined ? "" : String(rounded));
      onBlur?.(event);
    },
  };

  if (prefix === undefined) return <Input {...inputProps} />;

  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>{prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput {...inputProps} />
    </InputGroup>
  );
};

export interface PassThroughInfoProps {
  endpointData: PassThroughEndpoint;
  onClose: () => void;
  accessToken: string | null;
  isAdmin: boolean;
  premiumUser?: boolean;
  onEndpointUpdated?: () => void;
}

interface PassThroughEndpoint {
  id?: string;
  path: string;
  target: string;
  headers: Record<string, any>;
  include_subpath?: boolean;
  cost_per_request?: number;
  timeout?: number;
  auth?: boolean;
  methods?: string[];
  guardrails?: Record<string, { request_fields?: string[]; response_fields?: string[] } | null>;
}

// Password field component for headers
const PasswordField: React.FC<{ value: Record<string, any> }> = ({ value }) => {
  const { t: uiT } = useDashboardLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const headerString = JSON.stringify(value, null, 2);

  return (
    <div className="flex items-center space-x-2">
      <pre className="font-mono text-xs bg-muted p-2 rounded-sm max-w-md overflow-auto">
        {showPassword ? headerString : "••••••••"}
      </pre>
      <button
        onClick={() => setShowPassword(!showPassword)}
        className="p-1 hover:bg-accent rounded-sm"
        type="button"
        aria-label={showPassword ? uiT("ui.4e3c7f9acbfc6eb4") : uiT("ui.94ced27fb9e1fa9a")}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Eye className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

const PassThroughInfoView: React.FC<PassThroughInfoProps> = ({
  endpointData: initialEndpointData,
  onClose,
  accessToken,
  isAdmin,
  premiumUser = false,
  onEndpointUpdated,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [endpointData, setEndpointData] = useState<PassThroughEndpoint | null>(initialEndpointData);
  const [loading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [guardrails, setGuardrails] = useState<
    Record<string, { request_fields?: string[]; response_fields?: string[] } | null>
  >(initialEndpointData?.guardrails || {});

  const form = useZodForm(endpointSettingsSchema, {
    defaultValues: {
      target: initialEndpointData.target,
      headers: initialEndpointData.headers ? JSON.stringify(initialEndpointData.headers, null, 2) : "",
      methods: initialEndpointData.methods || [],
      include_subpath: initialEndpointData.include_subpath || false,
      cost_per_request: initialEndpointData.cost_per_request,
      timeout: initialEndpointData.timeout,
      auth: initialEndpointData.auth || false,
    },
  });

  const selectedMethods = useWatch({ control: form.control, name: "methods" });

  const parseHeaders = (raw: string): Record<string, unknown> | null => {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const handleEndpointUpdate = async (values: EndpointSettingsValues) => {
    try {
      if (!accessToken || !endpointData?.id) return;

      const headers = parseHeaders(values.headers);
      if (headers === null) {
        toast.fromError("Invalid JSON format for headers");
        return;
      }

      const updateData = {
        path: endpointData.path,
        target: values.target,
        headers: headers,
        include_subpath: values.include_subpath,
        cost_per_request: values.cost_per_request,
        timeout: values.timeout,
        auth: premiumUser ? values.auth : undefined,
        methods: values.methods.length > 0 ? values.methods : undefined,
        guardrails: guardrails && Object.keys(guardrails).length > 0 ? guardrails : undefined,
      };

      await updatePassThroughEndpoint(accessToken, endpointData.id, updateData);

      setEndpointData({
        ...endpointData,
        ...updateData,
      });

      setIsEditing(false);
      if (onEndpointUpdated) {
        onEndpointUpdated();
      }
    } catch (error) {
      console.error("Error updating endpoint:", error);
      toast.fromError("Failed to update pass through endpoint");
    }
  };

  const handleDeleteEndpoint = async () => {
    try {
      if (!accessToken || !endpointData?.id) return;

      await deletePassThroughEndpointsCall(accessToken, endpointData.id);
      toast.success(translateUi("ui.501ffb884d7e6acb"));
      onClose();
      if (onEndpointUpdated) {
        onEndpointUpdated();
      }
    } catch (error) {
      console.error("Error deleting endpoint:", error);
      toast.fromError("Failed to delete pass through endpoint");
    }
  };

  if (loading) {
    return <div className="p-4">{uiT("ui.47d2a515ef2f")}</div>;
  }

  if (!endpointData) {
    return <div className="p-4">{uiT("ui.9ef52db52b067834")}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button onClick={onClose} className="mb-4">
            {uiT("ui.aceb696a04c19971")}
          </Button>
          <h2 className="text-xl font-semibold">
            {uiT("ui.6d56b8896716251f")} {endpointData.path}
          </h2>
          <p className="text-sm text-muted-foreground font-mono">{endpointData.id}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {uiT("ui.d4b1ea5708dd")}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
              {uiT("ui.74a883a037bc")}
            </TabsTrigger>
          )}
        </TabsList>

        <div>
          {/* Overview Panel */}
          <TabsContent value="overview" keepMounted>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.62fa5a5b0d3c3188")}</p>
                <div className="mt-2">
                  <h3 className="text-lg font-medium font-mono">{endpointData.path}</h3>
                </div>
              </Card>

              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.978354db0c00fc78")}</p>
                <div className="mt-2">
                  <h3 className="text-lg font-medium">{endpointData.target}</h3>
                </div>
              </Card>

              <Card className="block p-6">
                <p className="text-sm">{uiT("ui.b332c3492d5eb10a")}</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <Badge variant={endpointData.include_subpath ? "secondary" : "outline"}>
                      {endpointData.include_subpath ? uiT("ui.6f9f1c0a5b6fa3fe") : uiT("ui.855334f3289aa345")}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={endpointData.auth ? "secondary" : "outline"}>
                      {endpointData.auth ? uiT("ui.a0b711bad0559b20") : uiT("ui.ca179d59812eae94")}
                    </Badge>
                  </div>
                  {endpointData.methods && endpointData.methods.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">{uiT("ui.57d316d24e9889cc")}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {endpointData.methods.map((method) => (
                          <Badge key={method} variant="secondary">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!endpointData.methods || endpointData.methods.length === 0) && (
                    <div>
                      <p className="text-xs text-muted-foreground">{uiT("ui.f241146d29c1db98")}</p>
                    </div>
                  )}
                  {endpointData.cost_per_request !== undefined && (
                    <div>
                      <p className="text-sm">
                        {uiT("ui.1f47188042fd97be")}
                        {endpointData.cost_per_request}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Route Preview Section */}
            <div className="mt-6">
              <RoutePreview
                pathValue={endpointData.path}
                targetValue={endpointData.target}
                includeSubpath={endpointData.include_subpath || false}
              />
            </div>

            {endpointData.headers && Object.keys(endpointData.headers).length > 0 && (
              <Card className="block mt-6 p-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{uiT("ui.194e9fe656a1bcab")}</p>
                  <Badge variant="secondary">
                    {Object.keys(endpointData.headers).length} {uiT("ui.eff8eeafe6fae6fe")}
                  </Badge>
                </div>
                <div className="mt-4">
                  <PasswordField value={endpointData.headers} />
                </div>
              </Card>
            )}

            {endpointData.guardrails && Object.keys(endpointData.guardrails).length > 0 && (
              <Card className="block mt-6 p-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{uiT("ui.443f975eefe8")}</p>
                  <Badge variant="secondary">
                    {Object.keys(endpointData.guardrails).length} {uiT("ui.078d43ee509c130f")}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {Object.entries(endpointData.guardrails).map(([name, settings]) => (
                    <div key={name} className="p-3 bg-muted rounded-sm">
                      <div className="font-medium text-sm">{name}</div>
                      {settings && (settings.request_fields || settings.response_fields) && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {settings.request_fields && (
                            <div>
                              {uiT("ui.f6848aa21892b2a0")} {settings.request_fields.join(", ")}
                            </div>
                          )}
                          {settings.response_fields && (
                            <div>
                              {uiT("ui.649e3059868a3a0a")} {settings.response_fields.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                      {!settings && (
                        <div className="text-xs text-muted-foreground mt-1">{uiT("ui.036f62e0ae1f603a")}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Settings Panel (only for admins) */}
          {isAdmin && (
            <TabsContent value="settings" keepMounted>
              <Card className="block p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{uiT("ui.85854825f9416b3b")}</h3>
                  <div className="space-x-2">
                    {!isEditing && (
                      <>
                        <Button onClick={() => setIsEditing(true)}>{uiT("ui.cddc5824575b")}</Button>
                        <Button onClick={handleDeleteEndpoint} variant="destructive">
                          {uiT("ui.05e97a2deb65bcd8")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={form.handleSubmit(handleEndpointUpdate)}>
                    <FormField control={form.control} name="target" label={uiT("ui.5b341c960fb7166e")}>
                      {({ value, ...field }) => (
                        <Input {...field} placeholder="https://api.example.com" value={value ?? ""} />
                      )}
                    </FormField>

                    <FormField control={form.control} name="headers" label={uiT("ui.0a768a0de4f0124d")}>
                      {({ value, ...field }) => (
                        <Textarea
                          {...field}
                          rows={5}
                          value={value ?? ""}
                          placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
                        />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="methods"
                      label={uiT("ui.200ee3e1b8a71faf")}
                      description={
                        selectedMethods.length === 0
                          ? uiT("ui.c47de8f7320089c5")
                          : uiT("ui.2b571a1c9b8698db", { v0: String(selectedMethods.join(", ")) })
                      }
                    >
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <Select multiple items={HTTP_METHOD_OPTIONS} value={value} onValueChange={onChange}>
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

                    <FormField control={form.control} name="include_subpath" label={uiT("ui.6f9f1c0a5b6fa3fe")}>
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <Switch {...field} checked={value} onCheckedChange={onChange} />
                      )}
                    </FormField>

                    <FormField control={form.control} name="cost_per_request" label={uiT("ui.d51cdd5f65da3fa7")}>
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <PrecisionNumberInput
                          {...field}
                          min={0}
                          step={0.01}
                          precision={2}
                          placeholder="0.00"
                          prefix="$"
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="timeout"
                      label={uiT("ui.d20c08e869997517")}
                      description={uiT("ui.83783ba18ec809e7")}
                    >
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <PrecisionNumberInput
                          {...field}
                          min={1}
                          step={1}
                          precision={0}
                          placeholder="600"
                          value={value}
                          onValueChange={onChange}
                        />
                      )}
                    </FormField>

                    <FormField control={form.control} name="auth">
                      {({ value, onChange }) => (
                        <PassThroughSecuritySection
                          premiumUser={premiumUser}
                          authEnabled={value}
                          onAuthChange={onChange}
                        />
                      )}
                    </FormField>

                    <div className="mt-4">
                      <PassThroughGuardrailsSection
                        accessToken={accessToken || ""}
                        value={guardrails}
                        onChange={setGuardrails}
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        {uiT("ui.19766ed6ccb2")}
                      </Button>
                      <Button type="submit">{uiT("ui.35322b5bb5a2")}</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.62fa5a5b0d3c3188")}</p>
                      <div className="font-mono">{endpointData.path}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.5b341c960fb7166e")}</p>
                      <div>{endpointData.target}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.6f9f1c0a5b6fa3fe")}</p>
                      <Badge variant={endpointData.include_subpath ? "secondary" : "outline"}>
                        {endpointData.include_subpath ? uiT("ui.85a39ab345d672ff") : uiT("ui.1ea442a134b2a184")}
                      </Badge>
                    </div>
                    {endpointData.cost_per_request !== undefined && (
                      <div>
                        <p className="text-sm font-medium">{uiT("ui.d51cdd5f65da3fa7")}</p>
                        <div>${endpointData.cost_per_request}</div>
                      </div>
                    )}
                    {endpointData.timeout !== undefined && endpointData.timeout !== null && (
                      <div>
                        <p className="text-sm font-medium">{uiT("ui.00eaf86be2967e16")}</p>
                        <div>{endpointData.timeout}s</div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.732c5220f394086a")}</p>
                      <Badge variant={endpointData.auth ? "secondary" : "outline"}>
                        {endpointData.auth ? uiT("ui.85a39ab345d672ff") : uiT("ui.1ea442a134b2a184")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{uiT("ui.194e9fe656a1bcab")}</p>
                      {endpointData.headers && Object.keys(endpointData.headers).length > 0 ? (
                        <div className="mt-2">
                          <PasswordField value={endpointData.headers} />
                        </div>
                      ) : (
                        <div className="text-muted-foreground">{uiT("ui.684dd46b1f1d752d")}</div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default PassThroughInfoView;
