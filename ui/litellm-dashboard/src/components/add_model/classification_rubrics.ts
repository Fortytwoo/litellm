import { t as translateUi } from "@/i18n";
import type { ClassificationRubric } from "./ComplexityRouterConfig";
export const CLASSIFICATION_RUBRIC_DESCRIPTIONS: Record<ClassificationRubric, { label: string; description: string }> =
  {
    get legacy() { return {
      get label() {
        return translateUi("ui.e23c4a8f8d0bd03b");
      },
      description:
        translateUi("ui.b4ff41fbd7f6f0a9"),
    }; },
    get agentic() { return {
      get label() {
        return translateUi("ui.7b1f65c25801");
      },
      description:
        translateUi("ui.87dea57032e3e0c2"),
    }; },
    get chat() { return {
      get label() {
        return translateUi("ui.460b3a7da007b7af");
      },
      description:
        translateUi("ui.828f339899b8a23a"),
    }; },
    get business() { return {
      get label() {
        return translateUi("ui.76f68a75f01ed76f");
      },
      description:
        translateUi("ui.8653d721cdcb63d9"),
    }; },
  };
