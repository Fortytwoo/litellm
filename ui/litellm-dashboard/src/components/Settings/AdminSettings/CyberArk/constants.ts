import { t as translateUi } from "@/i18n";
export const SENSITIVE_FIELDS = new Set(["cyberark_api_key", "client_key"]);

export const FIELD_LABELS: Record<string, string> = {
  get cyberark_api_base() {
    return translateUi("ui.7153367d0ad7eaf3");
  },
  get cyberark_account() {
    return translateUi("ui.7e1b0d5641f2640c");
  },
  get cyberark_username() {
    return translateUi("ui.e3b89e9d33f88e52");
  },
  get cyberark_api_key() {
    return translateUi("ui.23189d55f697");
  },
  get client_cert() {
    return translateUi("ui.116293e97e67cf1f");
  },
  get client_key() {
    return translateUi("ui.207121062a80fec2");
  },
  get ssl_verify() {
    return translateUi("ui.872d6bbd7704c611");
  },
  get refresh_interval() {
    return translateUi("ui.f441f81e31294b20");
  },
};
