"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useEditSSOSettings } from "@/app/(dashboard)/hooks/sso/useEditSSOSettings";
import { useSSOSettings } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import React from "react";
import DeleteResourceModal from "../../../../common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { parseErrorMessage } from "../../../../shared/errorUtils";
import { detectSSOProvider } from "../utils";

interface DeleteSSOSettingsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const DeleteSSOSettingsModal: React.FC<DeleteSSOSettingsModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t: uiT } = useDashboardLanguage();

  const { data: ssoSettings } = useSSOSettings();
  const { mutateAsync: editSSOSettings, isPending: isEditingSSOSettings } = useEditSSOSettings();

  // Handle clearing SSO settings
  const handleClearSSO = async () => {
    const clearSettings = {
      google_client_id: null,
      google_client_secret: null,
      microsoft_client_id: null,
      microsoft_client_secret: null,
      microsoft_tenant: null,
      generic_client_id: null,
      generic_client_secret: null,
      generic_authorization_endpoint: null,
      generic_token_endpoint: null,
      generic_userinfo_endpoint: null,
      saml_idp_metadata_url: null,
      saml_idp_metadata_xml: null,
      saml_sp_entity_id: null,
      saml_allow_unsolicited: null,
      proxy_base_url: null,
      user_email: null,
      sso_provider: null,
      role_mappings: null,
      team_mappings: null,
    };

    await editSSOSettings(clearSettings, {
      onSuccess: () => {
        toast.success(translateUi("ui.0970d74003694903"));
        onCancel();
        onSuccess();
      },
      onError: (error) => {
        toast.fromError("Failed to clear SSO settings: " + parseErrorMessage(error));
      },
    });
  };

  return (
    <DeleteResourceModal
      isOpen={isVisible}
      title={uiT("ui.290713de9bb73c3c")}
      alertMessage="This action cannot be undone."
      message={uiT("ui.29da75860a32007a")}
      resourceInformationTitle="SSO Settings"
      resourceInformation={[
        {
          label: uiT("ui.472590ae974d"),
          value: (ssoSettings?.values && detectSSOProvider(ssoSettings?.values)) || "Generic",
        },
      ]}
      onCancel={onCancel}
      onOk={handleClearSSO}
      confirmLoading={isEditingSSOSettings}
    />
  );
};

export default DeleteSSOSettingsModal;
