import { t as translateUi } from "@/i18n";
export const ACTION_ITEMS = [
  {
    value: "BLOCK",
    get label() {
      return translateUi("ui.211d0bb8cf4f");
    },
  },
  {
    value: "MASK",
    get label() {
      return translateUi("ui.e368929abd3614e9");
    },
  },
] as const;

export const SEVERITY_ITEMS = [
  {
    value: "high",
    get label() {
      return translateUi("ui.c4ebc6d4a5832cd9");
    },
  },
  {
    value: "medium",
    get label() {
      return translateUi("ui.8e588cd187741f1c");
    },
  },
  {
    value: "low",
    get label() {
      return translateUi("ui.f793de205ead5ac3");
    },
  },
] as const;
