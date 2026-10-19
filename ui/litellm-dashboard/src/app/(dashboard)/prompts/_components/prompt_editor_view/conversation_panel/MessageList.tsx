"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Loader2 } from "lucide-react";
import EmptyState from "./EmptyState";
import MessageBubble from "./MessageBubble";
import { Message } from "./types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  hasVariables: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, hasVariables, messagesEndRef }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-0">
      {messages.length === 0 && <EmptyState hasVariables={hasVariables} />}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label={uiT("ui.2f537f01868a27b1")} />
        </div>
      )}
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
};

export default MessageList;
