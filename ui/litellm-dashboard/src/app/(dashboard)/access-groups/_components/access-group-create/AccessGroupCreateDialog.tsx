"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BotIcon, InfoIcon, LayersIcon, ServerIcon } from "lucide-react";
import * as React from "react";

import { accessGroupKeys } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildAccessGroupCreateBody, emptyAccessGroupFormValues, type AccessGroupCreateBody } from "./mapper";
import { accessGroupCreateSchema } from "./schema";

const GENERAL_TAB = "general";

const defaultCreateAccessGroup = async (body: AccessGroupCreateBody): Promise<unknown> => {
  const { data } = await fetchClient.POST("/v1/access_group", { body });
  return data;
};

interface AccessGroupCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createAccessGroup?: (body: AccessGroupCreateBody) => Promise<unknown>;
}

export const AccessGroupCreateDialog = ({
  open,
  onOpenChange,
  createAccessGroup = defaultCreateAccessGroup,
}: AccessGroupCreateDialogProps) => {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const form = useZodForm(accessGroupCreateSchema, { defaultValues: emptyAccessGroupFormValues });
  const [activeTab, setActiveTab] = React.useState(GENERAL_TAB);

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

  const closeAndReset = () => {
    form.reset(emptyAccessGroupFormValues);
    setActiveTab(GENERAL_TAB);
    onOpenChange(false);
  };

  const mutation = useMutation({
    mutationFn: (body: AccessGroupCreateBody) => createAccessGroup(body),
    onSuccess: () => {
      toast.success(translateUi("ui.ffe33c91a131c30e"));
      queryClient.invalidateQueries({ queryKey: accessGroupKeys.all });
      closeAndReset();
    },
    onError: (error: unknown) =>
      toast.fromError(error instanceof Error ? error.message : "Failed to create access group"),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset(emptyAccessGroupFormValues);
      setActiveTab(GENERAL_TAB);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      if (mutation.isPending) return;
      mutation.mutate(buildAccessGroupCreateBody(values));
    },
    // the only validated field (name) lives on the General Info tab
    () => setActiveTab(GENERAL_TAB),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{uiT("ui.e30f3886e51cb79c")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value={GENERAL_TAB}>
                <InfoIcon />
                {uiT("ui.19f115f04394fd82")}
              </TabsTrigger>
              <TabsTrigger value="models">
                <LayersIcon />
                {uiT("ui.d17d2d78d76e")}
              </TabsTrigger>
              <TabsTrigger value="mcp-servers">
                <ServerIcon />
                {uiT("ui.aab669a72882")}
              </TabsTrigger>
              <TabsTrigger value="agents">
                <BotIcon />
                {uiT("ui.279b44d2ab4b")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={GENERAL_TAB} className="pt-4">
              <FieldGroup>
                <FormField control={form.control} name="name" label={uiT("ui.8e7526fdcc5cc34f")}>
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={uiT("ui.e28e43b933f4530d")} />}
                </FormField>
                <FormField control={form.control} name="description" label={uiT("ui.526e0087cc3f")}>
                  {({ ref, ...field }) => (
                    <Textarea {...field} ref={ref} rows={4} placeholder={uiT("ui.59a6dce6349151e2")} />
                  )}
                </FormField>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="models" className="pt-4">
              <FormField control={form.control} name="modelIds" label={uiT("ui.bd7237634a25de42")}>
                {(field) => <ModelSelect context="global" value={field.value} onChange={field.onChange} />}
              </FormField>
            </TabsContent>

            <TabsContent value="mcp-servers" className="pt-4">
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

            <TabsContent value="agents" className="pt-4">
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

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? uiT("ui.def70944c9bb") : uiT("ui.1213394682bfa8c6")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
