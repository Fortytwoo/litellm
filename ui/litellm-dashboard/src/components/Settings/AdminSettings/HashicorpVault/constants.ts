import { t as translateUi } from "@/i18n";
export const SENSITIVE_FIELDS = new Set(["vault_token", "approle_secret_id", "client_key"]);

export const FIELD_LABELS: Record<string, string> = {
  get vault_addr() {
    return translateUi("ui.dad7f7adc2ac7c60");
  },
  get vault_namespace() {
    return translateUi("ui.c4e4e7abda206b07");
  },
  get vault_login_namespace() {
    return translateUi("ui.96f871cbcb1551a4");
  },
  get vault_secret_namespace() {
    return translateUi("ui.7be10f6b951c7dab");
  },
  get vault_mount_name() {
    return translateUi("ui.1c391f709fd08e08");
  },
  get vault_path_prefix() {
    return translateUi("ui.960004b385ebe27a");
  },
  get vault_token() {
    return translateUi("ui.d2089be672953d11");
  },
  get approle_role_id() {
    return translateUi("ui.d23f2f0cfdde4b9e");
  },
  get approle_secret_id() {
    return translateUi("ui.79592419e17b3919");
  },
  get approle_mount_path() {
    return translateUi("ui.ca72ba9bab3f7c3d");
  },
  get client_cert() {
    return translateUi("ui.116293e97e67cf1f");
  },
  get client_key() {
    return translateUi("ui.207121062a80fec2");
  },
  get vault_cert_role() {
    return translateUi("ui.639a0bcfdc94f062");
  },
};
