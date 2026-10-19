"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Sparkles, X } from "lucide-react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useDisableLiteAdmin } from "@/app/(dashboard)/hooks/useDisableLiteAdmin";
import { useProxySettingsQuery } from "@/app/(dashboard)/hooks/proxySettings/useProxySettings";
import { ChatComposer } from "@/app/(dashboard)/playground/components/chat_ui/ChatComposer";
import { EndpointType, isModeCompatibleWithEndpoint } from "@/components/chat_ui/mode_endpoint_mapping";
import { fetchAvailableModels, type ModelGroup } from "@/components/llm_calls/fetch_models";
import { getProxyBaseUrl } from "@/components/networking";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cva.config";
import { isProxyAdminRole } from "@/utils/roles";
import { MAX_INPUT_LENGTH, resolveInferenceTarget } from "./agent";
import { LiteAdminConversation } from "./LiteAdminConversation";
import { useLiteAdmin, type LiteAdminSession } from "./useLiteAdmin";

type ManagementSession = Omit<LiteAdminSession, "inferenceBaseUrl">;
type LiteAdminState = { open: boolean; toggle: () => void };

const LiteAdminContext = createContext<LiteAdminState | null>(null);

function useLiteAdminSession() {
  const auth = useAuthorized();
  const [disabled] = useDisableLiteAdmin(auth.userId);
  const sessionReady = !auth.isLoading && auth.isAuthorized && auth.premiumUser === true;
  const writableAdmin = !auth.isViewOnly && isProxyAdminRole(auth.userRole);
  const allowed = sessionReady && writableAdmin && !disabled;
  if (!allowed || !auth.token || !auth.accessToken) return null;
  const session = { token: auth.token, accessToken: auth.accessToken, managementBaseUrl: getProxyBaseUrl() };
  return { session, key: JSON.stringify([auth.userId, session.token, session.accessToken, session.managementBaseUrl]) };
}

/** Wraps the dashboard content column and docks the LiteAdmin panel beside it, so opening it narrows the page instead of covering it. */
export function LiteAdminFrame({ children }: { children: ReactNode }) {
  const configured = useLiteAdminSession();
  const sessionKey = configured?.key ?? null;
  const [open, setOpen] = useState(false);
  const [openedSession, setOpenedSession] = useState(sessionKey);
  if (openedSession !== sessionKey) {
    setOpenedSession(sessionKey);
    setOpen(false);
  }
  const toggle = () => setOpen((current) => !current);
  useEffect(() => {
    if (sessionKey === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      const extraModifier = event.shiftKey || event.altKey;
      if (event.key.toLowerCase() !== "j" || !modifier || extraModifier) return;
      event.preventDefault();
      toggle();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sessionKey]);
  return (
    <LiteAdminContext.Provider value={configured ? { open, toggle } : null}>
      {children}
      {configured && (
        <DockedPanel key={configured.key} session={configured.session} open={open} close={() => setOpen(false)} />
      )}
    </LiteAdminContext.Provider>
  );
}

export default function LiteAdminTrigger() {
  const { t: uiT } = useDashboardLanguage();

  const state = useContext(LiteAdminContext);
  if (!state) return null;
  return (
    <Button
      variant="ghost"
      aria-label={uiT("ui.88bdddccecc147ce")}
      aria-keyshortcuts="Meta+J Control+J"
      aria-expanded={state.open}
      onClick={state.toggle}
      className="rounded-full bg-info/10 text-info hover:bg-info/15 hover:text-info/80 aria-expanded:bg-info/15 aria-expanded:text-info"
    >
      <Sparkles className="size-4" />
      <span className="hidden lg:inline">{uiT("ui.88bdddccecc147ce")}</span>
      <kbd className="hidden rounded-full border border-info/30 px-1.5 font-sans text-xs lg:inline">⌘J</kbd>
    </Button>
  );
}

function DockedPanel({ session, open, close }: { session: ManagementSession; open: boolean; close: () => void }) {
  const settings = useProxySettingsQuery(session.accessToken);
  const candidate =
    settings.data?.LITELLM_UI_API_DOC_BASE_URL?.trim() ||
    settings.data?.PROXY_BASE_URL?.trim() ||
    session.managementBaseUrl;
  const target = settings.data
    ? resolveInferenceTarget(candidate, session.managementBaseUrl, window.location.href)
    : null;
  return (
    <Destination
      key={target?.baseUrl ?? "unavailable"}
      session={session}
      target={target}
      loading={settings.isPending}
      retry={() => void settings.refetch()}
      open={open}
      close={close}
    />
  );
}

function Destination({
  session,
  target,
  loading,
  retry,
  open,
  close,
}: {
  session: ManagementSession;
  target: ReturnType<typeof resolveInferenceTarget> | null;
  loading: boolean;
  retry: () => void;
  open: boolean;
  close: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [approved, setApproved] = useState(false);
  if (target?.baseUrl && (!target.requiresConsent || approved)) {
    return <LiteAdminChat session={{ ...session, inferenceBaseUrl: target.baseUrl }} open={open} close={close} />;
  }
  return (
    <Panel open={open}>
      <PanelHeader close={close} />
      <div className="p-4">
        {loading && <Skeleton className="h-24" aria-label={uiT("ui.f6e4314a1a4d335e")} />}
        {!loading && !target?.baseUrl && (
          <Alert variant="destructive">
            <AlertDescription>{target?.error || uiT("ui.46ed0f5975c8a248")}</AlertDescription>
            <Button variant="link" onClick={retry}>
              {uiT("ui.942087cc2d41e013")}
            </Button>
          </Alert>
        )}
        {!loading && target?.baseUrl && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>{uiT("ui.6c92169912874f29")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-all font-mono text-xs">{target.baseUrl}</p>
              <p className="text-muted-foreground">{uiT("ui.a62f722e5b8d9783")}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setApproved(true)}>{uiT("ui.9d2c9ec134db7053")}</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </Panel>
  );
}

/** On open, focus `initialFocus` when given, else the composer when it is usable, else the panel itself. */
function Panel({
  open,
  initialFocus,
  children,
}: {
  open: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const { t: uiT } = useDashboardLanguage();

  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;
    (initialFocus?.current ?? panel.querySelector<HTMLElement>("textarea:enabled") ?? panel).focus({
      preventScroll: true,
    });
  }, [open, initialFocus]);
  return (
    <aside
      ref={ref}
      aria-label={uiT("ui.88bdddccecc147ce")}
      tabIndex={-1}
      hidden={!open}
      className={cn(
        "w-[min(26rem,40vw)] min-w-80 flex-none flex-col overflow-hidden border-l bg-background outline-none",
        open && "flex",
      )}
    >
      {children}
    </aside>
  );
}

function LiteAdminChat({ session, open, close }: { session: LiteAdminSession; open: boolean; close: () => void }) {
  const { t: uiT } = useDashboardLanguage();

  const chat = useLiteAdmin(session);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const modelQuery = {
    queryKey: ["liteadmin-models", session.accessToken, session.managementBaseUrl],
    queryFn: () => fetchAvailableModels(session.accessToken),
    enabled: open,
    select: (available: ModelGroup[]) =>
      available.filter((item) => isModeCompatibleWithEndpoint(item.mode, EndpointType.CHAT)),
  };
  const models = useQuery(modelQuery);
  const selectedModel = models.data?.some((item) => item.model_group === model) ? model : null;
  const busy = chat.phase !== "idle";
  const tooLong = input.trim().length > MAX_INPUT_LENGTH;
  const hasValidInput = selectedModel && input.trim() && !tooLong;
  const submitDisabled = busy || models.isError || !hasValidInput;
  const send = () => {
    if (submitDisabled || !selectedModel) return;
    void chat.send(input, selectedModel);
    setInput("");
  };
  return (
    <Panel open={open} initialFocus={chat.phase === "review" ? reviewRef : undefined}>
      <PanelHeader close={close}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={uiT("ui.db18382a249e0206")}
          title={uiT("ui.db18382a249e0206")}
          disabled={chat.phase === "applying"}
          onClick={() => {
            chat.reset();
            setInput("");
          }}
        >
          <RotateCcw className="size-4" />
        </Button>
      </PanelHeader>
      <LiteAdminConversation
        entries={chat.entries}
        thinking={chat.phase === "thinking"}
        open={open}
        reviewRef={reviewRef}
        onAnswer={chat.answer}
      />
      <div className="space-y-3 border-t p-3">
        {models.isPending ? (
          <Skeleton className="h-8" aria-label={uiT("ui.ac72c34bcf43cc71")} />
        ) : (
          <SearchSelect
            aria-label={uiT("ui.fbc7f4d3ec8718d3")}
            options={(models.data ?? []).map((item) => ({ value: item.model_group, label: item.model_group }))}
            value={selectedModel}
            onValueChange={setModel}
            placeholder={uiT("ui.833ed2c10712271f")}
            disabled={busy}
            allowClear={false}
          />
        )}
        {models.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {uiT("ui.594ac9a5341482cd")}{" "}
              <Button variant="link" onClick={() => void models.refetch()}>
                {uiT("ui.942087cc2d41e013")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {models.isSuccess && models.data.length === 0 && (
          <Alert role="status">
            <AlertDescription>{uiT("ui.01f94c419bc72b2e")}</AlertDescription>
          </Alert>
        )}
        {tooLong && (
          <FieldError>
            {uiT("ui.20d2bf9a15b5282e")} {MAX_INPUT_LENGTH.toLocaleString()} {uiT("ui.58213fd0f931b4b7")}
          </FieldError>
        )}
        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={send}
          onCancel={chat.phase === "applying" ? undefined : chat.stop}
          placeholder={uiT("ui.65c6a32df73a7ba6")}
          disabled={busy || !selectedModel}
          isLoading={busy}
          submitDisabled={submitDisabled}
        />
        <p className="text-xs text-muted-foreground">{uiT("ui.6d7db8215867dcb8")}</p>
      </div>
    </Panel>
  );
}

function PanelHeader({ close, children }: { close: () => void; children?: ReactNode }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="flex items-start justify-between gap-3 border-b p-4">
      <div className="flex flex-col gap-1 text-sm">
        <h2 className="flex items-center gap-1.5 font-medium">
          <Sparkles className="size-4 text-info" />
          {uiT("ui.88bdddccecc147ce")}
        </h2>
        <p className="text-muted-foreground">{uiT("ui.2a21b6f0922fb6df")}</p>
      </div>
      <div className="flex shrink-0">
        {children}
        <Button variant="ghost" size="icon-sm" aria-label={uiT("ui.2aceb386a9f5b108")} onClick={close}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
