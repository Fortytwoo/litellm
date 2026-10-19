"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { FileText } from "lucide-react";
import { MessageType } from "@/components/chat_ui/types";
import { shouldShowAttachedImage } from "./ResponsesImageUtils";

interface ResponsesImageRendererProps {
  message: MessageType;
}

const ResponsesImageRenderer: React.FC<ResponsesImageRendererProps> = ({ message }) => {
  const { t: uiT } = useDashboardLanguage();

  if (!shouldShowAttachedImage(message)) {
    return null;
  }

  const isPdf = typeof message.content === "string" && message.content.includes("[PDF attached]");

  return (
    <div className="mb-2">
      {isPdf ? (
        <div className="flex h-32 w-64 items-center justify-center rounded-md border border-border bg-destructive/10">
          <FileText className="size-12 text-destructive" aria-label={uiT("ui.7fe178020ac942ed")} />
        </div>
      ) : (
        <img
          src={message.imagePreviewUrl}
          alt={uiT("ui.f5de92e139102890")}
          className="max-h-[200px] max-w-64 rounded-md border border-border shadow-xs"
        />
      )}
    </div>
  );
};

export default ResponsesImageRenderer;
