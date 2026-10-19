import { t as translateUi } from "@/i18n";
import { PTU_COUNT_FIELD, PTU_RATE_FIELD, PTU_START_FIELD, PTU_END_FIELD } from "../utils/ptuValidation";
interface PtuEditField {
  name: string;
  label: string;
  input: "number" | "datetime";
  placeholder?: string;
  isCount?: boolean;
}

export const PTU_EDIT_FIELDS: PtuEditField[] = [
  {
    name: PTU_COUNT_FIELD,
    get label() {
      return translateUi("ui.9adb1e220acd2804");
    },
    input: "number",
    get placeholder() { return translateUi("ui.4e4173b891c5910c"); },
    isCount: true,
  },
  {
    name: PTU_RATE_FIELD,
    get label() {
      return translateUi("ui.e33d494bc4628c5e");
    },
    input: "number",
    get placeholder() { return translateUi("ui.fe3eaf47a7944f83"); },
  },
  {
    name: PTU_START_FIELD,
    get label() {
      return translateUi("ui.174213fa333f4f0c");
    },
    input: "datetime",
  },
  {
    name: PTU_END_FIELD,
    get label() {
      return translateUi("ui.ec5fc229dd15145f");
    },
    input: "datetime",
  },
];
