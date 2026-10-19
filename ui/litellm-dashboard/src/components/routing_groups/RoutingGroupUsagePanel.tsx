"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Code2 } from "lucide-react";
import React from "react";

import CodeBlock from "@/components/CodeBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatStrategyLabel } from "./strategy";
import type { RoutingGroup } from "./types";

interface RoutingGroupUsagePanelProps {
  group: RoutingGroup;
  baseUrl: string;
}

const exampleModel = (group: RoutingGroup): string =>
  group.routing_strategy === "priority" ? group.group_name : group.models[0] ?? "<your-model>";

const buildCurlSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `curl -X POST '${baseUrl}/v1/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $LITELLM_API_KEY" \\
  -d '{
    "model": "${exampleModel(group)}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

const buildPythonSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LITELLM_API_KEY"],
    base_url="${baseUrl}",
)

response = client.chat.completions.create(
    model="${exampleModel(group)}",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response)`;

const buildJsSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: "${baseUrl}",
});

const response = await client.chat.completions.create({
  model: "${exampleModel(group)}",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response);`;

const SNIPPET_TABS = [
  {
    value: "curl",
    get label() {
      return translateUi("ui.addc90cfd45b0f45");
    },
    language: "bash",
    build: buildCurlSnippet,
  },
  {
    value: "python",
    get label() {
      return translateUi("ui.87d0227ecd5dabf7");
    },
    language: "python",
    build: buildPythonSnippet,
  },
  {
    value: "javascript",
    get label() {
      return translateUi("ui.3175f6ca5e81de96");
    },
    language: "javascript",
    build: buildJsSnippet,
  },
] as const;

export function RoutingGroupUsagePanel({ group, baseUrl }: RoutingGroupUsagePanelProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="border-y bg-muted/40 px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Code2 className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{uiT("ui.ecaf3d69ce3de06a")}</span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {group.routing_strategy === "priority" ? (
          <>
            {uiT("ui.59f03d642b41")} <span className="font-medium text-foreground">{group.group_name}</span>{" "}
            {uiT("ui.b3ca7cb1c85aa4ff")}
          </>
        ) : (
          <>
            {uiT("ui.e69df4d39cf6334f")}{" "}
            <span className="font-medium text-foreground">{formatStrategyLabel(group.routing_strategy)}</span>{" "}
            {uiT("ui.fae41a639f96a131")}
          </>
        )}
      </p>
      <Tabs defaultValue="curl">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
          {SNIPPET_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-none rounded-none px-4 py-2">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SNIPPET_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-3">
            <CodeBlock language={tab.language} code={tab.build(group, baseUrl)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
