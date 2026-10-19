"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
/* eslint-disable react/no-unescaped-entities */

import React, { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CopyIcon,
  Code,
  Terminal,
  Globe,
  CheckIcon,
  ExternalLinkIcon,
  Info,
  KeyIcon,
  ServerIcon,
  Zap,
} from "lucide-react";
import { getProxyBaseUrl } from "@/components/networking";
import { copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";

interface CodeBlockProps {
  code: string;
  title?: string;
  copyKey: string;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  serverName?: string;
  accessGroups?: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  children,
  serverName,
  accessGroups = ["dev-group"],
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [useServerHeader, setUseServerHeader] = useState(false);
  const serverHeaderToggleId = useId();

  const getHeadersConfig = () => {
    const headers: Record<string, any> = {
      "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
    };
    if (useServerHeader && serverName) {
      const formattedServerName = serverName.replace(/\s+/g, "_");
      // Include both server name and access groups in the same header (comma-separated string)
      const serverAndGroups = [formattedServerName, ...accessGroups].join(",");
      headers["x-mcp-servers"] = serverAndGroups;
    }
    return headers;
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg bg-muted">{icon}</span>
          <div>
            <h5 className="mb-0 text-base font-semibold text-foreground">{title}</h5>
            <span className="text-muted-foreground">{description}</span>
          </div>
        </div>
        {serverName && (title === uiT("ui.ca88ba30f41b50ac") || title === uiT("ui.b332c3492d5eb10a")) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Switch
                id={serverHeaderToggleId}
                size="sm"
                checked={useServerHeader}
                onCheckedChange={setUseServerHeader}
              />
              <Label htmlFor={serverHeaderToggleId} className="font-normal leading-normal">
                {uiT("ui.b5ccb3adb3378761")} <code>x-mcp-servers</code> {uiT("ui.1e0584a25d9f43bf")}
              </Label>
            </div>
            {useServerHeader && (
              <Alert className="mt-2" variant="info">
                <Info />
                <AlertTitle>{uiT("ui.18f61b4ae1749971")}</AlertTitle>
                <AlertDescription>
                  <div>
                    <p>
                      <strong>{uiT("ui.fde4d203437efbde")}</strong> {uiT("ui.4f3b7fedc2e5d098")}{" "}
                      <code>"{serverName.replace(/\s+/g, "_")}"</code>
                    </p>
                    <p>
                      <strong>{uiT("ui.eb8f455db0352c7b")}</strong> {uiT("ui.3cedf9d84b91b055")}{" "}
                      <code>"dev-group"</code>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {uiT("ui.9ce0eec6eafa4e2b")} <code>"Server1,dev-group"</code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement<CodeBlockProps>(child) &&
            child.props.hasOwnProperty("code") &&
            child.props.hasOwnProperty("copyKey")
          ) {
            const code = child.props.code;
            if (code && code.includes('"headers":')) {
              return React.cloneElement(child, {
                code: code.replace(/"headers":\s*{[^}]*}/, `"headers": ${JSON.stringify(getHeadersConfig(), null, 8)}`),
              });
            }
          }
          return child;
        })}
      </CardContent>
    </Card>
  );
};

interface MCPConnectProps {
  currentServerAccessGroups?: string[];
}

const MCPConnect: React.FC<MCPConnectProps> = ({ currentServerAccessGroups = [] }) => {
  const { t: uiT } = useDashboardLanguage();

  const proxyBaseUrl = getProxyBaseUrl();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [currentServer] = useState("Zapier_MCP"); // This should match the current server being viewed

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const CodeBlock: React.FC<{
    code: string;
    copyKey: string;
    title?: string;
    className?: string;
  }> = ({ code, copyKey, title, className = "" }) => (
    <div className="relative group">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Code size={16} className="text-info" />
          <strong className="font-semibold text-foreground">{title}</strong>
        </div>
      )}
      <Card className={`relative bg-muted ${className}`}>
        <CardContent>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => copyToClipboard(code, copyKey)}
            className={`absolute top-2 right-2 z-raised transition-all duration-200 ${
              copiedStates[copyKey]
                ? "text-success bg-success/10 border-success/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {copiedStates[copyKey] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </Button>
          <pre className="text-sm overflow-x-auto pr-10 text-foreground font-mono leading-relaxed">{code}</pre>
        </CardContent>
      </Card>
    </div>
  );

  const StepCard: React.FC<{
    step: number;
    title: string;
    children: React.ReactNode;
  }> = ({ step, title, children }) => (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-8 h-8 bg-info text-info-foreground rounded-full flex items-center justify-center text-sm font-semibold">
          {step}
        </div>
      </div>
      <div className="flex-1">
        <strong className="mb-2 block font-semibold text-foreground">{title}</strong>
        {children}
      </div>
    </div>
  );

  const LiteLLMProxyTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">{uiT("ui.8ada29b37a0ccb79")}</h4>
        </div>
        <span className="text-success">{uiT("ui.56a4c6f1dd4cccf8")}</span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-success" size={16} />}
          title={uiT("ui.34414e21c4024f88")}
          description={uiT("ui.8c59f715f0ce7924")}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>{uiT("ui.4ba38149853c7285")}</span>
            </div>
            <CodeBlock
              title={uiT("ui.0a32650ed9b934f0")}
              code='export LITELLM_API_KEY="sk-..."'
              copyKey="litellm-env"
            />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-success" size={16} />}
          title={uiT("ui.a54a42c1fdb4986f")}
          description={uiT("ui.666d968313a1a4a5")}
        >
          <CodeBlock title={uiT("ui.22f5ebc3ad3ff763")} code={`${proxyBaseUrl}/mcp`} copyKey="litellm-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-success" size={16} />}
          title={uiT("ui.ca88ba30f41b50ac")}
          description={uiT("ui.dfd95c258852832a")}
          serverName={currentServer}
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location '${proxyBaseUrl}/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $LITELLM_VIRTUAL_KEY" \\
--data '{
    "model": "gpt-4",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_VIRTUAL_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="litellm-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const OpenAITab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-info/15 to-info/5 p-6 rounded-lg border border-info/15">
        <div className="flex items-center gap-3 mb-3">
          <Code className="text-info" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-info">{uiT("ui.d08282c69590adc6")}</h4>
        </div>
        <span className="text-info">{uiT("ui.38c671ab7042b75e")}</span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-info" size={16} />}
          title={uiT("ui.548d0f1d7cdb5249")}
          description={uiT("ui.a6f2efe93cfd5d77")}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>
                {uiT("ui.372adcdb5d2715e3")}{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:text-info/80 inline-flex items-center gap-1"
                >
                  {uiT("ui.e84eccde096174ec")} <ExternalLinkIcon size={12} />
                </a>
              </span>
            </div>
            <CodeBlock title={uiT("ui.0a32650ed9b934f0")} code='export OPENAI_API_KEY="sk-..."' copyKey="openai-env" />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-info" size={16} />}
          title={uiT("ui.a54a42c1fdb4986f")}
          description={uiT("ui.666d968313a1a4a5")}
        >
          <CodeBlock title={uiT("ui.22f5ebc3ad3ff763")} code={`${proxyBaseUrl}/mcp`} copyKey="openai-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-info" size={16} />}
          title={uiT("ui.ca88ba30f41b50ac")}
          description={uiT("ui.c0f38c6973f7025d")}
          serverName="Zapier Gmail"
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location 'https://api.openai.com/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $OPENAI_API_KEY" \\
--data '{
    "model": "gpt-4.1",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "${proxyBaseUrl}/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="openai-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const CursorTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100 dark:from-purple-950 dark:to-blue-950 dark:border-purple-900">
        <div className="flex items-center gap-3 mb-3">
          <Terminal className="text-purple-600 dark:text-purple-400" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-purple-900 dark:text-purple-100">
            {uiT("ui.239bb15957f0dcf9")}
          </h4>
        </div>
        <span className="text-purple-700 dark:text-purple-300">{uiT("ui.0f115842df09e3df")}</span>
      </div>

      <Card>
        <CardContent>
          <h5 className="mb-4 text-base font-semibold text-foreground">{uiT("ui.9c23b8d3214f6cf7")}</h5>
          <div className="flex w-full flex-col gap-6">
            <StepCard step={1} title={uiT("ui.7c93a4187e45d38f")}>
              <span className="text-muted-foreground">
                {uiT("ui.4f0d15bcfe0bddaf")} <code className="bg-muted px-2 py-1 rounded-sm">⇧+⌘+J</code>{" "}
                {uiT("ui.cc981bc77396e0a3")} <code className="bg-muted px-2 py-1 rounded-sm">Ctrl+Shift+J</code>{" "}
                {uiT("ui.9397eb5e3bfa8344")}
              </span>
            </StepCard>

            <StepCard step={2} title={uiT("ui.a7393d9dcb33cf5f")}>
              <span className="text-muted-foreground">{uiT("ui.c372006161f0f2f0")}</span>
            </StepCard>

            <StepCard step={3} title={uiT("ui.b2512e3db1601559")}>
              <span className="mb-3 text-muted-foreground">
                {uiT("ui.0824b3d4c33ac75d")} <code className="bg-muted px-2 py-1 rounded-sm">Cmd+S</code>{" "}
                {uiT("ui.7175517a370b5cd2")} <code className="bg-muted px-2 py-1 rounded-sm">Ctrl+S</code>
              </span>
              <FeatureCard
                icon={<Code className="text-purple-600 dark:text-purple-400" size={16} />}
                title={uiT("ui.b332c3492d5eb10a")}
                description={uiT("ui.abf85ec26916223f")}
                serverName="Zapier Gmail"
                accessGroups={["dev-group"]}
              >
                <CodeBlock
                  code={`{
    "mcpServers": {
      "Zapier_MCP": {
        "url": "${proxyBaseUrl}/mcp",
        "headers": {
          "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
          "x-mcp-servers": "Zapier_MCP,dev-group"
        }
      }
    }
  }`}
                  copyKey="cursor-config"
                  className="text-xs"
                />
              </FeatureCard>
            </StepCard>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StreamableHTTPTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">{uiT("ui.abe0f3457e24aab0")}</h4>
        </div>
        <span className="text-success">{uiT("ui.0dccdc9089748364")}</span>
      </div>

      <FeatureCard
        icon={<Globe className="text-success" size={16} />}
        title={uiT("ui.3b920a383c0d949b")}
        description={uiT("ui.d9214a146d2b7371")}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <span>{uiT("ui.9ae86a90a0d383d8")}</span>
          </div>
          <CodeBlock title={uiT("ui.22f5ebc3ad3ff763")} code={`${proxyBaseUrl}/mcp`} copyKey="http-server-url" />
          <CodeBlock
            title={uiT("ui.d101778320de7475")}
            code={JSON.stringify(
              {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
              },
              null,
              2,
            )}
            copyKey="http-headers"
          />
          <div className="mt-4">
            <Button
              variant="link"
              className="p-0 h-auto text-info hover:text-info/80"
              nativeButton={false}
              render={
                <a
                  href="https://modelcontextprotocol.io/docs/concepts/transports"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLinkIcon size={14} />
              {uiT("ui.96d56b51098993a6")}
            </Button>
          </div>
        </div>
      </FeatureCard>
    </div>
  );

  return (
    <div>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-3">{uiT("ui.5aa0ec8f7a522799")}</h2>
          <p className="text-lg text-muted-foreground">{uiT("ui.21787cf471055b77")}</p>
        </div>

        <Tabs defaultValue="openai" className="w-full">
          <TabsList variant="line" className="mt-8 mb-6 h-auto w-full justify-start rounded-none border-b p-0">
            <div className="flex rounded-lg bg-muted p-1">
              <TabsTrigger value="openai" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Code size={18} />
                  {uiT("ui.c9b1ce47b2aaedec")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="litellm" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Zap size={18} />
                  {uiT("ui.d39b030ccf4a26b0")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cursor" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Terminal size={18} />
                  {uiT("ui.2c014f8f8986f1b2")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="http" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Globe size={18} />
                  {uiT("ui.e885e4421e6a6afb")}
                </span>
              </TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="openai" keepMounted className="mt-6">
            <OpenAITab />
          </TabsContent>
          <TabsContent value="litellm" keepMounted className="mt-6">
            <LiteLLMProxyTab />
          </TabsContent>
          <TabsContent value="cursor" keepMounted className="mt-6">
            <CursorTab />
          </TabsContent>
          <TabsContent value="http" keepMounted className="mt-6">
            <StreamableHTTPTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MCPConnect;
