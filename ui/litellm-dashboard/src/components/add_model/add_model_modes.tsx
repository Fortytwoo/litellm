import { t as translateUi } from "@/i18n";
// Define the available test modes
export const TEST_MODES = [
  {
    value: "chat",
    get label() {
      return translateUi("ui.e5293794e79163ea");
    },
  },
  {
    value: "completion",
    get label() {
      return translateUi("ui.f14912db343f9699");
    },
  },
  {
    value: "embedding",
    get label() {
      return translateUi("ui.6b74697d80b86025");
    },
  },
  {
    value: "audio_speech",
    get label() {
      return translateUi("ui.69c1f658e8020305");
    },
  },
  {
    value: "audio_transcription",
    get label() {
      return translateUi("ui.1d8ed877dcf14bd7");
    },
  },
  {
    value: "image_generation",
    get label() {
      return translateUi("ui.d01cc2686269a122");
    },
  },
  {
    value: "image_edit",
    get label() {
      return translateUi("ui.42b5b2a5e0aa678d");
    },
  },
  {
    value: "video_generation",
    get label() {
      return translateUi("ui.8423376f74e495f5");
    },
  },
  {
    value: "rerank",
    get label() {
      return translateUi("ui.6a941ec942046ed7");
    },
  },
  {
    value: "realtime",
    get label() {
      return translateUi("ui.b38b8e29a6b50a15");
    },
  },
  {
    value: "batch",
    get label() {
      return translateUi("ui.d125c4ced965b701");
    },
  },
  {
    value: "anthropic_messages",
    get label() {
      return translateUi("ui.3c587907da4344be");
    },
  },
  {
    value: "ocr",
    get label() {
      return translateUi("ui.45a6d75c2fd7c5ba");
    },
  },
  {
    value: "evaluation",
    get label() {
      return translateUi("ui.7bd310c9d4fedea4");
    },
  },
];

// Define the available auto router routing strategies
export const AUTO_ROUTER_MODES = [
  {
    value: "simple-shuffle",
    get label() {
      return translateUi("ui.23017912ed36c25b");
    },
  },
  {
    value: "least-busy",
    get label() {
      return translateUi("ui.f3589597294f0953");
    },
  },
  {
    value: "latency-based",
    get label() {
      return translateUi("ui.cdb743c7b8fd6f9f");
    },
  },
  {
    value: "cost-based",
    get label() {
      return translateUi("ui.0a4756148b6244cf");
    },
  },
  {
    value: "usage-based",
    get label() {
      return translateUi("ui.f7f66a9824345216");
    },
  },
  {
    value: "custom",
    get label() {
      return translateUi("ui.f89387a39b23c708");
    },
  },
];
