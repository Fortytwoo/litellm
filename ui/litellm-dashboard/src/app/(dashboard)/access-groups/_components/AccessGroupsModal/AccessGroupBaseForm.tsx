"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { BotIcon, InfoIcon, LayersIcon, ServerIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const accessGroupFormSchema = z.object({
  name: z.string().min(1, "Please enter the access group name"),
  description: z.string(),
  modelIds: z.array(z.string()),
  mcpServerIds: z.array(z.string()),
  agentIds: z.array(z.string()),
});

export type AccessGroupFormValues = z.output<typeof accessGroupFormSchema>;

export const GENERAL_TAB = "general";
export const MODELS_TAB = "models";
export const MCP_SERVERS_TAB = "mcp-servers";
export const AGENTS_TAB = "agents";

interface AccessGroupBaseFormProps {
  form: UseFormReturn<AccessGroupFormValues>;
  isNameDisabled?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AccessGroupBaseForm({
  form,
  isNameDisabled = false,
  activeTab,
  onTabChange,
}: AccessGroupBaseFormProps) {
  const { t: uiT } = useDashboardLanguage();

  const { data: agentsData } = useAgents();
  const { data: mcpServersData } = useMCPServers();

  const mcpServerOptions = (mcpServersData ?? []).map((server) => ({
    value: server.server_id,
    label: server.server_name ?? server.server_id,
  }));
  const agentOptions = (agentsData?.agents ?? []).map((agent) => ({
    value: agent.agent_id,
    label: agent.agent_name,
  }));

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value={GENERAL_TAB}>
          <InfoIcon size={16} />
          {uiT("ui.19f115f04394fd82")}
        </TabsTrigger>
        <TabsTrigger value={MODELS_TAB}>
          <LayersIcon size={16} />
          {uiT("ui.d17d2d78d76e")}
        </TabsTrigger>
        <TabsTrigger value={MCP_SERVERS_TAB}>
          <ServerIcon size={16} />
          {uiT("ui.aab669a72882")}
        </TabsTrigger>
        <TabsTrigger value={AGENTS_TAB}>
          <BotIcon size={16} />
          {uiT("ui.279b44d2ab4b")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={GENERAL_TAB} className="pt-4">
        <FieldGroup>
          <FormField control={form.control} name="name" label={uiT("ui.8e7526fdcc5cc34f")}>
            {({ ref, ...field }) => (
              <Input {...field} ref={ref} placeholder={uiT("ui.e28e43b933f4530d")} disabled={isNameDisabled} />
            )}
          </FormField>
          <FormField control={form.control} name="description" label={uiT("ui.526e0087cc3f")}>
            {({ ref, ...field }) => <Textarea {...field} ref={ref} rows={4} placeholder={uiT("ui.59a6dce6349151e2")} />}
          </FormField>
        </FieldGroup>
      </TabsContent>

      <TabsContent value={MODELS_TAB} className="pt-4">
        <FormField control={form.control} name="modelIds" label={uiT("ui.bd7237634a25de42")}>
          {(field) => <ModelSelect context="global" value={field.value} onChange={field.onChange} />}
        </FormField>
      </TabsContent>

      <TabsContent value={MCP_SERVERS_TAB} className="pt-4">
        <FormField control={form.control} name="mcpServerIds" label={uiT("ui.d9543d4a192d4721")}>
          {({ id, value, onChange }) => (
            <MultiSelect
              id={id}
              value={value}
              onValueChange={onChange}
              options={mcpServerOptions}
              placeholder={uiT("ui.53d4538fdfcceb6c")}
            />
          )}
        </FormField>
      </TabsContent>

      <TabsContent value={AGENTS_TAB} className="pt-4">
        <FormField control={form.control} name="agentIds" label={uiT("ui.299b3b300b6c1f97")}>
          {({ id, value, onChange }) => (
            <MultiSelect
              id={id}
              value={value}
              onValueChange={onChange}
              options={agentOptions}
              placeholder={uiT("ui.9c2f5e9fd3f263f4")}
            />
          )}
        </FormField>
      </TabsContent>
    </Tabs>
  );
}
