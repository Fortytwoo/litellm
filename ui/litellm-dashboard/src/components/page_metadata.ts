import { t as translateUi } from "@/i18n";
/**
 * Page metadata for UI Settings configuration
 * This file contains descriptions and metadata for all navigation pages
 */

// Page descriptions for UI Settings configuration
export const pageDescriptions: Record<string, string> = {
  get home() {
    return translateUi("ui.388fcf94472dc823");
  },
  get "api-keys"() {
    return translateUi("ui.fab9c7961148bf52");
  },
  get "llm-playground"() {
    return translateUi("ui.ac0920ca0c7c34d1");
  },
  get models() {
    return translateUi("ui.170a2b293ab77e8c");
  },
  get agents() {
    return translateUi("ui.93084980d31c89d5");
  },
  get agentic() {
    return translateUi("ui.4f100f97f86f3a14");
  },
  get workflows() {
    return translateUi("ui.8982b7b1eee1555e");
  },
  get "mcp-servers"() {
    return translateUi("ui.0cc0d84db089ed7b");
  },
  get memory() {
    return translateUi("ui.875310682d16f2d6");
  },
  get guardrails() {
    return translateUi("ui.a5d171f1f3c6401d");
  },
  get policies() {
    return translateUi("ui.dfa071516d9dfd26");
  },
  get "search-tools"() {
    return translateUi("ui.ff3921e318cc3cea");
  },
  get "tool-policies"() {
    return translateUi("ui.185f40faf95c76b0");
  },
  get "vector-stores"() {
    return translateUi("ui.62512c1004c9c301");
  },
  get new_usage() {
    return translateUi("ui.a258fdc064e550bc");
  },
  get "cost-optimization"() {
    return translateUi("ui.189223b3ebf44337");
  },
  get "model-insights"() {
    return translateUi("ui.ebc63b025fc2fa20");
  },
  get logs() {
    return translateUi("ui.85c94fdc38da0b6e");
  },
  get lens() {
    return translateUi("ui.648b58d640754c1e");
  },
  get "guardrails-monitor"() {
    return translateUi("ui.7f0adae9f095141c");
  },
  get users() {
    return translateUi("ui.0f05b3c2b5535fa3");
  },
  get teams() {
    return translateUi("ui.d25f6234e43061be");
  },
  get organizations() {
    return translateUi("ui.355be8bc761478bb");
  },
  get projects() {
    return translateUi("ui.b48f62c5ee8c7a06");
  },
  get "access-groups"() {
    return translateUi("ui.a68b922e9dbaa368");
  },
  get budgets() {
    return translateUi("ui.d419c9ce5419ae1a");
  },
  get api_ref() {
    return translateUi("ui.58eb3008becbcc85");
  },
  get "model-hub-table"() {
    return translateUi("ui.47d8df88d12554a6");
  },
  get "learning-resources"() {
    return translateUi("ui.2e4fc99f86ca0275");
  },
  get caching() {
    return translateUi("ui.8d2217c83608c757");
  },
  get "transform-request"() {
    return translateUi("ui.971b6cfea0adb8ed");
  },
  get "cost-tracking"() {
    return translateUi("ui.d22771499f9fc713");
  },
  get "ui-theme"() {
    return translateUi("ui.1aba3a6167abb35e");
  },
  get "tag-management"() {
    return translateUi("ui.b6492deb8ca4f9fd");
  },
  get prompts() {
    return translateUi("ui.2701d572eeac5f83");
  },
  get skills() {
    return translateUi("ui.39715a210391ac0a");
  },
  get usage() {
    return translateUi("ui.57da13c69dbf67fa");
  },
  get "router-settings"() {
    return translateUi("ui.c02b71b802e0b726");
  },
  get "logging-and-alerts"() {
    return translateUi("ui.f6713409208a2a7c");
  },
  get "admin-panel"() {
    return translateUi("ui.491e8c91a8a42141");
  },
};

export interface PageMetadata {
  page: string;
  label: string;
  group: string;
  description: string;
}
