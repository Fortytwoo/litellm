import { t as translateUi } from "@/i18n";
export const ACTION_ITEMS = [
  {
    value: "BLOCK",
    get label() {
      return translateUi("ui.211d0bb8cf4f");
    },
  },
  { value: "MASK", label: "Mask" },
] as const;

export const SEVERITY_ITEMS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;
