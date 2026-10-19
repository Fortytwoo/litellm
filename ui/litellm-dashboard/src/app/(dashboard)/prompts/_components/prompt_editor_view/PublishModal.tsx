"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{uiT("ui.c5d386e43cbe9347")}</DialogTitle>
          <DialogDescription>{uiT("ui.5b302f2cf32dab95")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="publish-prompt-name" className="mb-2 block">
            {uiT("ui.dcd1d5223f73")}
          </label>
          <Input
            id="publish-prompt-name"
            value={promptName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={uiT("ui.435adda15f01b611")}
            onKeyDown={(event) => event.key === "Enter" && onPublish()}
            autoFocus
          />
          <p className="text-muted-foreground text-xs mt-2">{uiT("ui.31e99bae1e7568c9")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button onClick={onPublish} disabled={isSaving}>
            {isSaving && <LoaderCircleIcon className="animate-spin" />}
            {uiT("ui.859390eb495b2ead")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishModal;
