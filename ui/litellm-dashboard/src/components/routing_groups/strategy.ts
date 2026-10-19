import { t as translateUi } from "@/i18n";
const STRATEGY_LABELS: Readonly<Record<string, string>> = {
  get "simple-shuffle"() {
    return translateUi("ui.2c885611171b4f07");
  },
  get "least-busy"() {
    return translateUi("ui.10d7ceeae12f2f8a");
  },
  get "usage-based-routing"() {
    return translateUi("ui.66632beafc4278ae");
  },
  get "latency-based-routing"() {
    return translateUi("ui.7b6d12d385125674");
  },
  get priority() {
    return translateUi("ui.d60dbba079223254");
  },
};

export const formatStrategyLabel = (strategy: string): string => STRATEGY_LABELS[strategy] ?? strategy;
