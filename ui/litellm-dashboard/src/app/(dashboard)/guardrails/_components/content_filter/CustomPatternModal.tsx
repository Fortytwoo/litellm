"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_ITEMS } from "./action_options";

interface CustomPatternModalProps {
  visible: boolean;
  patternName: string;
  patternRegex: string;
  patternAction: "BLOCK" | "MASK";
  onNameChange: (name: string) => void;
  onRegexChange: (regex: string) => void;
  onActionChange: (action: "BLOCK" | "MASK") => void;
  onAdd: () => void;
  onCancel: () => void;
}

const CustomPatternModal: React.FC<CustomPatternModalProps> = ({
  visible,
  patternName,
  patternRegex,
  patternAction,
  onNameChange,
  onRegexChange,
  onActionChange,
  onAdd,
  onCancel,
}) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.c54bd164ab410032")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="font-semibold">{uiT("ui.7948d837382ac556")}</p>
            <Input
              className="mt-2"
              placeholder={uiT("ui.2f4f7ce612ad9da5")}
              value={patternName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div>
            <p className="font-semibold">{uiT("ui.c5b46488a11a6f10")}</p>
            <Input
              className="mt-2"
              placeholder={uiT("ui.675e8cae25cd6a96")}
              value={patternRegex}
              onChange={(e) => onRegexChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{uiT("ui.3ac4f006fee169f7")}</p>
          </div>

          <div>
            <p className="font-semibold">{uiT("ui.64cff1319d2f")}</p>
            <p className="mt-1 mb-2 text-muted-foreground">{uiT("ui.782a2e817d535857")}</p>
            <Select
              items={ACTION_ITEMS}
              value={patternAction}
              onValueChange={(value: string | null) => value && onActionChange(value as "BLOCK" | "MASK")}
            >
              <SelectTrigger className="w-full" aria-label={uiT("ui.64cff1319d2f")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button onClick={onAdd}>{uiT("ui.9fd728c66c9a")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPatternModal;
