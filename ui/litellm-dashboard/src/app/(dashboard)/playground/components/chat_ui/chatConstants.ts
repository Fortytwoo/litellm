import { t as translateUi } from "@/i18n";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";

export const OPEN_AI_VOICES = {
  ALLOY: "alloy",
  ASH: "ash",
  BALAD: "ballad",
  CORAL: "coral",
  ECHO: "echo",
  FABLE: "fable",
  NOVA: "nova",
  ONYX: "onyx",
  SAGE: "sage",
  SHIMMER: "shimmer",
} as const;

export type OpenAIVoice = (typeof OPEN_AI_VOICES)[keyof typeof OPEN_AI_VOICES];

export const OPEN_AI_VOICE_LABELS = {
  get ALLOY() {
    return translateUi("ui.cd01e7c4790dcef7");
  },
  get ASH() {
    return translateUi("ui.746683f5a7790136");
  },
  get BALAD() {
    return translateUi("ui.db76c6192c0d75ff");
  },
  get CORAL() {
    return translateUi("ui.2a2d312cf27db74c");
  },
  get ECHO() {
    return translateUi("ui.a70785bcfd4f19bf");
  },
  get FABLE() {
    return translateUi("ui.32d25adf0df02dd4");
  },
  get NOVA() {
    return translateUi("ui.4cf44b946839614d");
  },
  get ONYX() {
    return translateUi("ui.43c7d29a471de25b");
  },
  get SAGE() {
    return translateUi("ui.176655e6591035b5");
  },
  get SHIMMER() {
    return translateUi("ui.decf4a1bf79b0358");
  },
};

export const OPEN_AI_VOICE_SELECT_OPTIONS = Object.entries(OPEN_AI_VOICES).map(([key, voice]) => ({
  value: voice,
  get label() {
    return OPEN_AI_VOICE_LABELS[key as keyof typeof OPEN_AI_VOICE_LABELS];
  },
}));

export const ENDPOINT_OPTIONS = [
  { value: EndpointType.CHAT, label: "/v1/chat/completions" },
  { value: EndpointType.RESPONSES, label: "/v1/responses" },
  { value: EndpointType.ANTHROPIC_MESSAGES, label: "/v1/messages" },
  { value: EndpointType.IMAGE, label: "/v1/images/generations" },
  { value: EndpointType.IMAGE_EDITS, label: "/v1/images/edits" },
  { value: EndpointType.EMBEDDINGS, label: "/v1/embeddings" },
  { value: EndpointType.SPEECH, label: "/v1/audio/speech" },
  { value: EndpointType.TRANSCRIPTION, label: "/v1/audio/transcriptions" },
  { value: EndpointType.A2A_AGENTS, label: "/v1/a2a/message/send" },
  { value: EndpointType.MCP, label: "/mcp-rest/tools/call" },
  { value: EndpointType.REALTIME, label: "/v1/realtime" },
  { value: EndpointType.INTERACTIONS, label: "/v1beta/interactions" },
];
