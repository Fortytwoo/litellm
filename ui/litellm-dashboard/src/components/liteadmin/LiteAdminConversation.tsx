"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useEffect, type RefObject } from "react";
import { ArrowDown, Check, ChevronDown } from "lucide-react";
import { MessageScroller, useMessageScroller } from "@shadcn/react/message-scroller";
import { ChatMessageContent } from "@/components/chat/ChatMessages";
import CopyButton from "@/components/shared/CopyButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { ActionEntry, ConversationEntry } from "./useLiteAdmin";

const ACTION_STATUS: Record<ActionEntry["status"], string> = {
  review: "Review change",
  applying: "Applying…",
  completed: "Completed",
  cancelled: "Cancelled",
  unknown: "Check result",
};

interface ConversationProps {
  entries: ConversationEntry[];
  thinking: boolean;
  open: boolean;
  reviewRef: RefObject<HTMLDivElement | null>;
  onAnswer: (id: string, approved: boolean) => void;
}

export function LiteAdminConversation({ entries, thinking, open, reviewRef, onAnswer }: ConversationProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <MessageScroller.Provider autoScroll>
      <MessageScroller.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageScroller.Viewport
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain data-pending-scroll:invisible"
          aria-label={uiT("ui.af5017670500b7ce")}
        >
          <MessageScroller.Content className="flex flex-col gap-4 p-4" aria-busy={thinking}>
            {entries.map((entry) => (
              <MessageScroller.Item key={entry.id} messageId={entry.id}>
                {entry.kind === "message" && (
                  <ChatMessageContent
                    message={entry.message}
                    allowImages={false}
                    isLastMessage={false}
                    isStreaming={false}
                  />
                )}
                {entry.kind === "action" && (
                  <ActionCard entry={entry} open={open} reviewRef={reviewRef} onAnswer={onAnswer} />
                )}
                {entry.kind === "error" && (
                  <Alert variant="destructive">
                    <AlertDescription>{entry.text}</AlertDescription>
                  </Alert>
                )}
              </MessageScroller.Item>
            ))}
            {thinking && (
              <MessageScroller.Item messageId="thinking">
                <div role="status" aria-label={uiT("ui.85154efe0097473d")} className="space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <span className="sr-only">{uiT("ui.5474eef8d0f179c7")}</span>
                </div>
              </MessageScroller.Item>
            )}
          </MessageScroller.Content>
        </MessageScroller.Viewport>
        {entries.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 p-6">
            <p className="font-medium">{uiT("ui.4d35ea21b30d1141")}</p>
            <p className="text-sm text-muted-foreground">{uiT("ui.e8b43cd40b0a6fc3")}</p>
          </div>
        )}
        <MessageScroller.Button
          aria-label={uiT("ui.867524581f012f0b")}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-sm data-[active=false]:pointer-events-none data-[active=false]:opacity-0"
          render={<Button variant="outline" size="icon-sm" />}
        >
          <ArrowDown className="size-4" />
        </MessageScroller.Button>
      </MessageScroller.Root>
    </MessageScroller.Provider>
  );
}

function ActionCard({
  entry,
  open,
  reviewRef,
  onAnswer,
}: Pick<ConversationProps, "open" | "reviewRef" | "onAnswer"> & { entry: ActionEntry }) {
  const { t: uiT } = useDashboardLanguage();

  const { scrollToEnd } = useMessageScroller();
  const review = entry.status === "review";
  useEffect(() => {
    if (!open || !review) return;
    scrollToEnd();
    reviewRef.current?.focus({ preventScroll: true });
  }, [entry.id, open, review, reviewRef, scrollToEnd]);
  const answer = (approved: boolean) => {
    scrollToEnd();
    onAnswer(entry.id, approved);
  };
  const fields = (
    <div className="max-h-56 overflow-y-auto">
      <Table>
        <TableBody>
          {Object.entries(entry.action.arguments).map(([name, value]) => (
            <TableRow key={name}>
              <TableCell className="w-1/3 align-top text-muted-foreground whitespace-normal capitalize">
                {name.replaceAll("_", " ")}
              </TableCell>
              <TableCell className="whitespace-pre-wrap break-all">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  return (
    <Card
      ref={review ? reviewRef : undefined}
      tabIndex={review ? -1 : undefined}
      role="region"
      aria-label={entry.action.title}
      size="sm"
    >
      <CardHeader className="gap-2">
        <CardTitle>{entry.action.title}</CardTitle>
        <Badge variant={entry.status === "unknown" ? "destructive" : "secondary"} role="status">
          {entry.status === "completed" && <Check className="size-3" />}
          {ACTION_STATUS[entry.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {review || entry.status === "applying" ? (
          fields
        ) : (
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="ghost" size="xs" />}>
              <ChevronDown className="size-3" />
              {uiT("ui.45989de49fb7")}
            </CollapsibleTrigger>
            <CollapsibleContent>{fields}</CollapsibleContent>
          </Collapsible>
        )}
        {entry.status === "unknown" && (
          <Alert variant="destructive">
            <AlertDescription>{entry.message}</AlertDescription>
          </Alert>
        )}
        {entry.status === "completed" && entry.key && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 break-all text-xs">{entry.key}</code>
              <CopyButton value={entry.key} label={uiT("ui.357756e19511f1fb")} />
            </div>
            <p className="text-xs text-muted-foreground">{uiT("ui.e633e597a27450c3")}</p>
          </div>
        )}
      </CardContent>
      {review && (
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={() => answer(false)}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button variant={entry.action.destructive ? "destructive" : "default"} onClick={() => answer(true)}>
            {uiT("ui.704ac1d7acd8032b")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
