"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OAUTH_FLOW } from "@/components/mcp_tools/types";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import TokenEndpointAuthMethodField from "./TokenEndpointAuthMethodField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import {
  numberControl,
  parsesAsJson,
  selectControl,
  selectTriggerControl,
  tagsControl,
  textControl,
} from "./mcpFieldRules";

interface OAuthFlowStatus {
  startOAuthFlow: () => void;
  status: string;
  error: string | null;
  tokenResponse: { access_token?: string; expires_in?: number } | null;
}

interface OAuthFormFieldsProps {
  isM2M: boolean;
  isEditing?: boolean;
  oauthFlow?: OAuthFlowStatus;
  initialFlowType?: string;
  /** Link to provider docs for creating an OAuth app (e.g. GitHub). */
  docsUrl?: string | null;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const OAUTH_FLOW_ITEMS = [
  {
    value: OAUTH_FLOW.M2M,
    get label() {
      return translateUi("ui.d5e9be6d9ae2a6f8");
    },
  },
  {
    value: OAUTH_FLOW.INTERACTIVE,
    get label() {
      return translateUi("ui.c0fcccb83814b732");
    },
  },
];

const UPSTREAM_RESOURCE_TOOLTIP =
  "RFC 8707 resource indicator sent to the authorization server so it mints a token audienced for this MCP server. " +
  "Leave blank to send nothing, which is the default and what most providers expect. Use 'auto' to send this server's " +
  "own URL. Set an exact identifier when the authorization server expects a specific one. Some providers reject this " +
  "parameter and take the audience from scopes instead; if you see AADSTS901002, leave it blank. If you see " +
  "invalid_target, the authorization server needs it set.";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const UpstreamResourceField: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <MountedFormField
      label={<FieldLabel label={uiT("ui.e1bf731a2a4aaac7")} tooltip={UPSTREAM_RESOURCE_TOOLTIP} />}
      name={["credentials", "upstream_resource"]}
    >
      {(control) => (
        <Input {...textControl(control)} placeholder={uiT("ui.7cb285fa0bc193a6")} className={fieldClassName} />
      )}
    </MountedFormField>
  );
};

const OAuthFormFields: React.FC<OAuthFormFieldsProps> = ({
  isM2M,
  isEditing = false,
  oauthFlow,
  initialFlowType,
  docsUrl,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={<FieldLabel label={uiT("ui.3faa0fd6d06b9ecb")} tooltip={uiT("ui.5b0c8103b28ab7d9")} />}
        name="oauth_flow_type"
        {...(initialFlowType ? { defaultValue: initialFlowType } : {})}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={OAUTH_FLOW_ITEMS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue placeholder={uiT("ui.eda4cf84a3dbe15a")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OAUTH_FLOW.M2M}>
                <div>
                  <span className="font-medium">{uiT("ui.d5e9be6d9ae2a6f8")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{uiT("ui.406d157e06171cca")}</span>
                </div>
              </SelectItem>
              <SelectItem value={OAUTH_FLOW.INTERACTIVE}>
                <div>
                  <span className="font-medium">{uiT("ui.c0fcccb83814b732")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{uiT("ui.ea47fe600d7b2084")}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </MountedFormField>

      {isM2M ? (
        <>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.8726db013948f070")} tooltip={uiT("ui.89f8d3c21479a6e5")} />}
            name={["credentials", "client_id"]}
            required={!isEditing}
            rules={requiredWhenCreating("Client ID is required for M2M OAuth")}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={uiT("ui.955e3aa90dfe35e7", { v0: String(placeholderSuffix) })}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.ae21cf6d24b8ca46")} tooltip={uiT("ui.21ef19b0c0f0959e")} />}
            name={["credentials", "client_secret"]}
            required={!isEditing}
            rules={requiredWhenCreating("Client Secret is required for M2M OAuth")}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={uiT("ui.6e151f13f14c3024", { v0: String(placeholderSuffix) })}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.431e0036cba3da27")} tooltip={uiT("ui.3f6e7aaac6818b4f")} />}
            name="token_url"
            required={!isEditing}
            rules={requiredWhenCreating("Token URL is required for M2M OAuth")}
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://auth.example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={<FieldLabel label={uiT("ui.f4d09ff950d6c0e1")} tooltip={uiT("ui.f06c93a621bdc754")} />}
            name={["credentials", "scopes"]}
          >
            {(control) => (
              <MultiSelect {...tagsControl(control)} placeholder={uiT("ui.f4426894f89e20f7")} className="rounded-lg" />
            )}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
        </>
      ) : (
        <>
          <MountedFormField
            label={
              <span className="flex items-center justify-between w-full">
                <FieldLabel label={uiT("ui.4c9c574199901660")} tooltip={uiT("ui.bbea34e27beac288")} />
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:text-info/80 ml-2 font-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {uiT("ui.1a07573d1556c3cf")}
                  </a>
                )}
              </span>
            }
            name={["credentials", "client_id"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={uiT("ui.fc23e3a6589628e6", { v0: String(placeholderSuffix) })}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.2abc2c6a12878988")} tooltip={uiT("ui.bbea34e27beac288")} />}
            name={["credentials", "client_secret"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={uiT("ui.f223cb2abb65231a", { v0: String(placeholderSuffix) })}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.f4d09ff950d6c0e1")} tooltip={uiT("ui.913eced58916dd6b")} />}
            name={["credentials", "scopes"]}
          >
            {(control) => (
              <MultiSelect {...tagsControl(control)} placeholder={uiT("ui.f4426894f89e20f7")} className="rounded-lg" />
            )}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
          <MountedFormField
            label={<FieldLabel label={uiT("ui.ea8352364f76b6da")} tooltip={uiT("ui.7219950b5fa52057")} />}
            name="issuer"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://issuer.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.2c6af65349cd04da")} tooltip={uiT("ui.9cc35c7c240b03d7")} />}
            name="authorization_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/authorize"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.804b52f6a75c7ab7")} tooltip={uiT("ui.35023429456382e8")} />}
            name="token_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={<FieldLabel label={uiT("ui.c854f2088ac58b30")} tooltip={uiT("ui.69e3d045737ece5a")} />}
            name="registration_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/register"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.47f95cb15bf7f898")} tooltip={uiT("ui.afbf6db87b9986a1")} />}
            name="token_validation_json"
            rules={{ validate: { json: parsesAsJson("Must be valid JSON") } }}
          >
            {(control) => (
              <Textarea
                {...textControl(control)}
                placeholder={'{\n  "organization": "my-org",\n  "team.id": "123"\n}'}
                rows={4}
                className="font-mono text-sm rounded-lg border-border focus:border-info focus:ring-ring"
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={uiT("ui.0dafb066d68c4826")} tooltip={uiT("ui.5510bdfdddf1604d")} />}
            name="token_storage_ttl_seconds"
          >
            {(control) => (
              <Input
                {...numberControl(control)}
                min={1}
                placeholder={uiT("ui.e0f3ed56fb24f0d0")}
                className="w-full rounded-lg"
              />
            )}
          </MountedFormField>
          {oauthFlow && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">{uiT("ui.fadad45cd06d8610")}</p>
              <Button
                variant="secondary"
                onClick={oauthFlow.startOAuthFlow}
                disabled={oauthFlow.status === "authorizing" || oauthFlow.status === "exchanging"}
              >
                {oauthFlow.status === "authorizing"
                  ? uiT("ui.349f8287035893da")
                  : oauthFlow.status === "exchanging"
                    ? uiT("ui.4f6bcb6fba504881")
                    : uiT("ui.1d2bab45333c209a")}
              </Button>
              {oauthFlow.error && <p className="text-sm text-destructive">{oauthFlow.error}</p>}
              {oauthFlow.status === "success" && oauthFlow.tokenResponse?.access_token && (
                <p className="text-sm text-success">
                  {uiT("ui.b8eeb35eebdadb4b")} {oauthFlow.tokenResponse.expires_in ?? "?"} {uiT("ui.5d992667f7075c53")}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default OAuthFormFields;
