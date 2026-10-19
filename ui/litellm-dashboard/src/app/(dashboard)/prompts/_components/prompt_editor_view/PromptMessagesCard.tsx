"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React, { useState } from "react";
import { PlusIcon, TrashIcon, GripVerticalIcon } from "lucide-react";
import VariableTextArea from "../variable_textarea";
import { Message } from "./types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_ITEMS = [
  {
    value: "user",
    get label() {
      return translateUi("ui.b512d97e7cbf");
    },
  },
  {
    value: "assistant",
    get label() {
      return translateUi("ui.391e405152779acc");
    },
  },
  {
    value: "system",
    get label() {
      return translateUi("ui.6725e7bbcd28f3a8");
    },
  },
] as const;

interface PromptMessagesCardProps {
  messages: Message[];
  onAddMessage: () => void;
  onUpdateMessage: (index: number, field: "role" | "content", value: string) => void;
  onRemoveMessage: (index: number) => void;
  onMoveMessage: (fromIndex: number, toIndex: number) => void;
}

const PromptMessagesCard: React.FC<PromptMessagesCardProps> = ({
  messages,
  onAddMessage,
  onUpdateMessage,
  onRemoveMessage,
  onMoveMessage,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onMoveMessage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Card className="p-3">
      <div className="mb-2">
        <p className="text-sm font-medium">{uiT("ui.4a6e6280929c9408")}</p>
        <p className="text-muted-foreground text-xs mt-1">
          {uiT("ui.c36d819e7bc6d2b7")} <code className="bg-muted px-1 rounded-sm text-xs">{"{{variable}}"}</code>{" "}
          {uiT("ui.0f58605f6a879af6")}
        </p>
      </div>
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`border border-border rounded overflow-hidden bg-background transition-all ${
              draggedIndex === index ? "opacity-50" : ""
            } ${dragOverIndex === index && draggedIndex !== index ? "border-primary border-2" : ""}`}
          >
            <div className="bg-muted px-2 py-1.5 border-b border-border flex items-center justify-between">
              <ShadcnSelect
                items={ROLE_ITEMS}
                value={message.role}
                onValueChange={(value) => onUpdateMessage(index, "role", String(value))}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[110px] border-0 shadow-none"
                  aria-label={uiT("ui.3d3805ad85315320", { v0: String(index + 1) })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={uiT("ui.c7680ff708058262", { v0: String(index + 1) })}
                    onClick={() => onRemoveMessage(index)}
                  >
                    <TrashIcon size={14} />
                  </Button>
                )}
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVerticalIcon size={16} />
                </div>
              </div>
            </div>
            <div className="p-2">
              <VariableTextArea
                value={message.content}
                onChange={(value) => onUpdateMessage(index, "content", value)}
                rows={3}
                placeholder={uiT("ui.40ca58b7fcdb74c2")}
              />
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={onAddMessage} className="mt-2">
        <PlusIcon size={14} className="mr-1" />
        {uiT("ui.f421966ef0b230e4")}
      </Button>
    </Card>
  );
};

export default PromptMessagesCard;
