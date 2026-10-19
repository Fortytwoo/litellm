"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useEffect } from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { ChevronRight, CircleMinus, Info, Plus, TriangleAlert, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { MCPServer, AUTH_TYPE } from "@/components/mcp_tools/types";
import {
  MountedFormField,
  useMountedName,
  type MountedFieldControlProps,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { Field, FieldLabel } from "@/components/ui/field";
import { invertedSwitchControl, switchControl, tagsControl, textControl } from "./mcpFieldRules";
import { listControl } from "./mcpFormStore";

interface MCPPermissionManagementProps {
  availableAccessGroups: string[];
  mcpServer: MCPServer | null;
  /**
   * The auth type as seen through the gate that mounts the auth_type field.
   * Callers pass undefined whenever that field is unmounted, because both
   * toggles below are mounted from this value and the payload only carries
   * what is mounted.
   */
  mountedAuthType: string | null | undefined;
}

const ClearableInput: React.FC<{
  control: MountedFieldControlProps;
  placeholder: string;
  clearLabel: string;
}> = ({ control, placeholder, clearLabel }) => {
  const text = textControl(control);
  return (
    <InputGroup className="rounded-lg">
      <InputGroupInput {...text} placeholder={placeholder} />
      {text.value !== "" && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label={clearLabel} onClick={() => control.onChange("")}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
};

const StaticHeadersFieldArray: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<MountedFormValues>();
  const { fields, append, remove } = useFieldArray({ control: listControl(control), name: "static_headers" });
  useMountedName("static_headers");

  return (
    <div className="space-y-3">
      {fields.map((item, index) => (
        <div key={item.id} className="flex w-full items-baseline gap-4">
          <MountedFormField
            name={["static_headers", String(index), "header"]}
            className="flex-1"
            rules={{ validate: { required: requiredRule("Header name is required") } }}
          >
            {(headerControl) => (
              <ClearableInput
                control={headerControl}
                placeholder={uiT("ui.5f9156e6d86d0cf9")}
                clearLabel="Clear header name"
              />
            )}
          </MountedFormField>
          <MountedFormField
            name={["static_headers", String(index), "value"]}
            className="flex-1"
            rules={{ validate: { required: requiredRule("Header value is required") } }}
          >
            {(valueControl) => (
              <ClearableInput
                control={valueControl}
                placeholder={uiT("ui.f9a9058c0c22e511")}
                clearLabel="Clear header value"
              />
            )}
          </MountedFormField>
          <CircleMinus
            onClick={() => remove(index)}
            className="size-4 text-muted-foreground hover:text-destructive cursor-pointer"
          />
        </div>
      ))}
      <Button variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {uiT("ui.5ab7fe67cc263312")}
      </Button>
    </div>
  );
};

const MCPPermissionManagement: React.FC<MCPPermissionManagementProps> = ({
  availableAccessGroups,
  mcpServer,
  mountedAuthType,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const { setValue } = useFormContext<MountedFormValues>();
  const isOAuth2 = mountedAuthType === AUTH_TYPE.OAUTH2;
  const isNoneAuth = mountedAuthType === AUTH_TYPE.NONE || mountedAuthType == null;
  const watchedExtraHeaders = useWatch({ name: "extra_headers" });
  const hasAuthorizationHeader =
    Array.isArray(watchedExtraHeaders) &&
    watchedExtraHeaders.some((h) => typeof h === "string" && h.toLowerCase() === "authorization");
  // Two distinct, independent opt-ins:
  //   - delegate_auth_to_upstream: oauth2 servers only (PKCE passthrough —
  //     bypass LiteLLM admission).
  //   - oauth_passthrough: auth_type=none + Authorization in extra_headers
  //     (OAuth pass-through: proxy upstream oauth-protected-resource, emit 401
  //     challenges, propagate upstream 401/403).
  // Kept as separate flags so neither silently implies the other and existing
  // oauth2 servers can't regress into pass-through behavior.
  const canEnableOAuthPassthrough = isNoneAuth && hasAuthorizationHeader;
  const watchedDelegateAuth = useWatch({ name: "delegate_auth_to_upstream" });
  const watchedPublicInternet = useWatch({ name: "available_on_public_internet" });
  const showInternalDelegatePkceWarning = isOAuth2 && watchedDelegateAuth === true && watchedPublicInternet === false;

  // Set initial values when mcpServer changes
  useEffect(() => {
    if (mcpServer) {
      if (mcpServer.static_headers) {
        const staticHeaders = Object.entries(mcpServer.static_headers).map(([header, value]) => ({
          header,
          value: value != null ? String(value) : "",
        }));
        setValue("static_headers", staticHeaders);
      }
      if (Array.isArray(mcpServer.env_vars) && mcpServer.env_vars.length > 0) {
        setValue(
          "env_vars",
          mcpServer.env_vars.map((entry) => ({
            name: entry.name,
            value: entry.value ?? "",
            scope: entry.scope ?? "global",
            description: entry.description ?? "",
          })),
        );
      }
      if (typeof mcpServer.allow_all_keys === "boolean") {
        setValue("allow_all_keys", mcpServer.allow_all_keys);
      }
      if (typeof mcpServer.available_on_public_internet === "boolean") {
        setValue("available_on_public_internet", mcpServer.available_on_public_internet);
      }
      if (typeof mcpServer.delegate_auth_to_upstream === "boolean") {
        setValue("delegate_auth_to_upstream", mcpServer.delegate_auth_to_upstream);
      }
      if (typeof mcpServer.oauth_passthrough === "boolean") {
        setValue("oauth_passthrough", mcpServer.oauth_passthrough);
      }
    } else {
      setValue("allow_all_keys", false);
      setValue("available_on_public_internet", true);
      setValue("delegate_auth_to_upstream", false);
      setValue("oauth_passthrough", false);
    }
  }, [mcpServer, setValue]);

  // delegate_auth_to_upstream is only honored server-side for oauth2 servers.
  // Force it back to false whenever the user switches away from oauth2 so a
  // stale toggle value doesn't get persisted unexpectedly.
  useEffect(() => {
    if (!isOAuth2) {
      setValue("delegate_auth_to_upstream", false);
    }
  }, [isOAuth2, setValue]);

  // oauth_passthrough is only honored for auth_type=none servers that forward
  // Authorization upstream. Force it back to false otherwise.
  useEffect(() => {
    if (!canEnableOAuthPassthrough) {
      setValue("oauth_passthrough", false);
    }
  }, [canEnableOAuthPassthrough, setValue]);

  return (
    <Collapsible className="bg-muted border border-border rounded-lg">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 p-4 text-left">
        <span className="flex items-center">
          <span className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-info rounded-full"></span>
            <span className="text-lg font-semibold text-foreground">{uiT("ui.bae278ffd1697eb9")}</span>
          </span>
          <span className="text-sm text-muted-foreground ml-4">{uiT("ui.310b1c355765b997")}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted className="px-4 pb-4">
        <div className="space-y-6 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-foreground flex items-center">
                {uiT("ui.b19d3c55d1c9645e")}
                <SimpleTooltip content={uiT("ui.7aafce4e411929b4")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
              <p className="text-sm text-muted-foreground mt-1">{uiT("ui.664be2a7bf05c4c2")}</p>
            </div>
            <MountedFormField name="allow_all_keys" defaultValue={mcpServer?.allow_all_keys ?? false} className="mb-0">
              {(control) => <Switch aria-label={uiT("ui.b19d3c55d1c9645e")} {...switchControl(control)} />}
            </MountedFormField>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-foreground flex items-center">
                {uiT("ui.3e7ff73d543011e5")}
                <SimpleTooltip content={uiT("ui.03013ad21cba1e3e")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
              <p className="text-sm text-muted-foreground mt-1">{uiT("ui.ef9a3074561dc69c")}</p>
            </div>
            <MountedFormField name="available_on_public_internet" defaultValue={true} className="mb-0">
              {(control) => <Switch aria-label={uiT("ui.3e7ff73d543011e5")} {...invertedSwitchControl(control)} />}
            </MountedFormField>
          </div>

          {isOAuth2 && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-foreground flex items-center">
                  {uiT("ui.49192cfe7469be3e")}
                  <SimpleTooltip content={uiT("ui.57496d7421c48c0a")}>
                    <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                  </SimpleTooltip>
                </span>
                <p className="text-sm text-muted-foreground mt-1">{uiT("ui.43c2b5a6387a6b8c")}</p>
              </div>
              <MountedFormField
                name="delegate_auth_to_upstream"
                defaultValue={mcpServer?.delegate_auth_to_upstream ?? false}
                className="mb-0"
              >
                {(control) => <Switch aria-label={uiT("ui.49192cfe7469be3e")} {...switchControl(control)} />}
              </MountedFormField>
            </div>
          )}

          {canEnableOAuthPassthrough && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-foreground flex items-center">
                  {uiT("ui.2dfcbd8dd472326a")}
                  <SimpleTooltip content={uiT("ui.264ed8a71f26ae37")}>
                    <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                  </SimpleTooltip>
                </span>
                <p className="text-sm text-muted-foreground mt-1">{uiT("ui.b2f41ed257714e0e")}</p>
              </div>
              <MountedFormField
                name="oauth_passthrough"
                defaultValue={mcpServer?.oauth_passthrough ?? false}
                className="mb-0"
              >
                {(control) => <Switch aria-label={uiT("ui.2dfcbd8dd472326a")} {...switchControl(control)} />}
              </MountedFormField>
            </div>
          )}

          {showInternalDelegatePkceWarning && (
            <Alert variant="warning" className="mb-2">
              <TriangleAlert />
              <AlertTitle>{uiT("ui.5526a39a0ff746f3")}</AlertTitle>
              <AlertDescription>{uiT("ui.ca9c7ce2d28d6b4d")}</AlertDescription>
            </Alert>
          )}

          <MountedFormField
            label={
              <span className="text-sm font-medium text-foreground flex items-center">
                {uiT("ui.330da412f455f4e8")}
                <SimpleTooltip content={uiT("ui.42b8786a8a50efc7")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
            }
            name="mcp_access_groups"
            className="mb-4"
          >
            {(control) => (
              <MultiSelect
                {...tagsControl(control)}
                options={availableAccessGroups.map((group) => ({ label: group, value: group }))}
                placeholder={uiT("ui.13a4140b64289431")}
                className="rounded-lg"
              />
            )}
          </MountedFormField>

          <MountedFormField
            label={
              <span className="text-sm font-medium text-foreground flex items-center">
                {uiT("ui.3c1aeb3d156fdd97")}
                <SimpleTooltip content={uiT("ui.967bda3b9218aee7")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
                {mcpServer?.extra_headers && mcpServer.extra_headers.length > 0 && (
                  <span className="ml-2 text-xs bg-info/15 text-info px-2 py-1 rounded-full">
                    {mcpServer.extra_headers.length} {uiT("ui.20158224750041d6")}
                  </span>
                )}
              </span>
            }
            name="extra_headers"
          >
            {(control) => (
              <MultiSelect
                {...tagsControl(control)}
                placeholder={
                  mcpServer?.extra_headers && mcpServer.extra_headers.length > 0
                    ? uiT("ui.e52d2933836a7fbe", { v0: String(mcpServer.extra_headers.join(", ")) })
                    : uiT("ui.31f9d5fb5c230265")
                }
                className="rounded-lg"
              />
            )}
          </MountedFormField>

          <Field>
            <FieldLabel>
              <span className="text-sm font-medium text-foreground flex items-center">
                {uiT("ui.84ccf938f01589b2")}
                <SimpleTooltip content={uiT("ui.b196d9532027be0d")}>
                  <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
                </SimpleTooltip>
              </span>
            </FieldLabel>
            <StaticHeadersFieldArray />
          </Field>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MCPPermissionManagement;
