"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect, useId } from "react";
import { PlusCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/outline";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import ModelSelector from "./ModelSelector";
import { toast } from "@/lib/toast";

interface ModelAliasManagerProps {
  accessToken: string;
  initialModelAliases?: { [key: string]: string };
  onAliasUpdate?: (updatedAliases: { [key: string]: string }) => void;
  showExampleConfig?: boolean;
}

interface AliasItem {
  id: string;
  aliasName: string;
  targetModel: string;
}

const ModelAliasManager: React.FC<ModelAliasManagerProps> = ({
  accessToken,
  initialModelAliases = {},
  onAliasUpdate,
  showExampleConfig = true,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [aliases, setAliases] = useState<AliasItem[]>([]);
  const [newAlias, setNewAlias] = useState<{ aliasName: string; targetModel: string | null }>({
    aliasName: "",
    targetModel: null,
  });
  const [editingAlias, setEditingAlias] = useState<
    (Omit<AliasItem, "targetModel"> & { targetModel: string | null }) | null
  >(null);
  const aliasNameId = useId();

  useEffect(() => {
    // Convert object to array for display
    const aliasArray = Object.entries(initialModelAliases).map(([aliasName, targetModel], index) => ({
      id: `${index}-${aliasName}`,
      aliasName,
      targetModel,
    }));
    setAliases(aliasArray);
  }, [initialModelAliases]);

  const handleAddAlias = () => {
    if (!newAlias.aliasName || !newAlias.targetModel) {
      toast.fromError("Please provide both alias name and target model");
      return;
    }

    // Check for duplicate alias names
    if (aliases.some((alias) => alias.aliasName === newAlias.aliasName)) {
      toast.fromError("An alias with this name already exists");
      return;
    }

    const newAliasObj: AliasItem = {
      id: `${Date.now()}-${newAlias.aliasName}`,
      aliasName: newAlias.aliasName,
      targetModel: newAlias.targetModel,
    };

    const updatedAliases = [...aliases, newAliasObj];
    setAliases(updatedAliases);
    setNewAlias({ aliasName: "", targetModel: null });

    // Convert array back to object format and notify parent
    const aliasObject: { [key: string]: string } = {};
    updatedAliases.forEach((alias) => {
      aliasObject[alias.aliasName] = alias.targetModel;
    });

    if (onAliasUpdate) {
      onAliasUpdate(aliasObject);
    }

    toast.success(translateUi("ui.54efb1864caccafa"));
  };

  const handleEditAlias = (alias: AliasItem) => {
    setEditingAlias({ ...alias });
  };

  const handleUpdateAlias = () => {
    if (!editingAlias) return;

    if (!editingAlias.aliasName || !editingAlias.targetModel) {
      toast.fromError("Please provide both alias name and target model");
      return;
    }

    // Check for duplicate alias names (excluding current alias)
    if (aliases.some((alias) => alias.id !== editingAlias.id && alias.aliasName === editingAlias.aliasName)) {
      toast.fromError("An alias with this name already exists");
      return;
    }

    const savedAlias: AliasItem = { ...editingAlias, targetModel: editingAlias.targetModel };
    const updatedAliases = aliases.map((alias) => (alias.id === savedAlias.id ? savedAlias : alias));

    setAliases(updatedAliases);
    setEditingAlias(null);

    // Convert array back to object format and notify parent
    const aliasObject: { [key: string]: string } = {};
    updatedAliases.forEach((alias) => {
      aliasObject[alias.aliasName] = alias.targetModel;
    });

    if (onAliasUpdate) {
      onAliasUpdate(aliasObject);
    }

    toast.success(translateUi("ui.d911f9b876872732"));
  };

  const handleCancelEdit = () => {
    setEditingAlias(null);
  };

  const deleteAlias = (aliasId: string) => {
    const updatedAliases = aliases.filter((alias) => alias.id !== aliasId);
    setAliases(updatedAliases);

    // Convert array back to object format and notify parent
    const aliasObject: { [key: string]: string } = {};
    updatedAliases.forEach((alias) => {
      aliasObject[alias.aliasName] = alias.targetModel;
    });

    if (onAliasUpdate) {
      onAliasUpdate(aliasObject);
    }

    toast.success(translateUi("ui.02421fe738d0fdad"));
  };

  // Convert current aliases to object for config example
  const aliasObject = aliases.reduce(
    (acc, alias) => {
      acc[alias.aliasName] = alias.targetModel;
      return acc;
    },
    {} as { [key: string]: string },
  );

  return (
    <div className="mt-4">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-foreground">{uiT("ui.7c49e2704bbd1ee7")}</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor={aliasNameId} className="mb-1 block text-xs text-muted-foreground">
              {uiT("ui.334438a60d5ea48f")}
            </label>
            <Input
              id={aliasNameId}
              type="text"
              value={newAlias.aliasName}
              onChange={(e) =>
                setNewAlias({
                  ...newAlias,
                  aliasName: e.target.value,
                })
              }
              placeholder={uiT("ui.b47741a7888acc62")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{uiT("ui.9049605413403cfd")}</label>
            <ModelSelector
              accessToken={accessToken}
              value={newAlias.targetModel}
              placeholder={uiT("ui.30c50dac1fedcd4f")}
              onChange={(value) =>
                setNewAlias({
                  ...newAlias,
                  targetModel: value,
                })
              }
              showLabel={false}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddAlias} disabled={!newAlias.aliasName || !newAlias.targetModel}>
              <PlusCircleIcon className="mr-1 h-4 w-4" />
              {uiT("ui.378026d54cdaee03")}
            </Button>
          </div>
        </div>
      </div>

      <p className="mb-2 text-sm font-medium text-foreground">{uiT("ui.fe89490452eb0581")}</p>
      <div className="relative mb-6 rounded-lg border">
        <div className="overflow-x-auto">
          <Table className="[&_td]:py-0.5 [&_th]:py-1">
            <TableHeader>
              <TableRow>
                <TableHead className="py-1 h-8">{uiT("ui.334438a60d5ea48f")}</TableHead>
                <TableHead className="py-1 h-8">{uiT("ui.9049605413403cfd")}</TableHead>
                <TableHead className="py-1 h-8">{uiT("ui.ff8059dc6752")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aliases.map((alias) => (
                <TableRow key={alias.id} className="h-8">
                  {editingAlias && editingAlias.id === alias.id ? (
                    <>
                      <TableCell className="py-0.5">
                        <Input
                          type="text"
                          aria-label={uiT("ui.1d0370b3ac9f068e")}
                          value={editingAlias.aliasName}
                          onChange={(e) =>
                            setEditingAlias({
                              ...editingAlias,
                              aliasName: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="py-0.5">
                        <ModelSelector
                          accessToken={accessToken}
                          value={editingAlias.targetModel}
                          onChange={(value) =>
                            setEditingAlias({
                              ...editingAlias,
                              targetModel: value,
                            })
                          }
                          showLabel={false}
                          style={{ height: "32px" }}
                        />
                      </TableCell>
                      <TableCell className="py-0.5 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button variant="secondary" size="xs" onClick={handleUpdateAlias}>
                            {uiT("ui.1509f561f241")}
                          </Button>
                          <Button variant="outline" size="xs" onClick={handleCancelEdit}>
                            {uiT("ui.19766ed6ccb2")}
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="py-0.5 text-sm text-foreground">{alias.aliasName}</TableCell>
                      <TableCell className="py-0.5 text-sm text-muted-foreground">{alias.targetModel}</TableCell>
                      <TableCell className="py-0.5 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="icon-xs"
                            aria-label={uiT("ui.f1be7e63b84c48df", { v0: String(alias.aliasName) })}
                            onClick={() => handleEditAlias(alias)}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-xs"
                            aria-label={translateUi("ui.cd822e072981e849", undefined, { v0: String(alias.aliasName) })}
                            onClick={() => deleteAlias(alias.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {aliases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-0.5 text-center text-sm text-muted-foreground">
                    {uiT("ui.9612ae7357b15b6a")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Configuration Example */}
      {showExampleConfig && (
        <Card className="px-6">
          <CardTitle className="mb-4">{uiT("ui.a57a83b5792a88d9")}</CardTitle>
          <p className="mb-4 text-muted-foreground">{uiT("ui.5612aeec1c3e807a")}</p>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <div className="text-foreground">
              model_aliases:
              {Object.keys(aliasObject).length === 0 ? (
                <span className="text-muted-foreground">
                  <br /> {uiT("ui.e1c631fe7b82bc19")}
                </span>
              ) : (
                Object.entries(aliasObject).map(([key, value]) => (
                  <span key={key}>
                    <br /> {uiT("ui.b51ed63b98b49f21")}
                    {key}
                    {uiT("ui.6a86154696ca4475")}
                    {value} {uiT("ui.8a331fdde7032f33")}
                  </span>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModelAliasManager;
