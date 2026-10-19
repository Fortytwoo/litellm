"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useId, useRef } from "react";
import { Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { copyToClipboard } from "@/utils/dataUtils";

export interface InvitationLink {
  id: string;
  user_id: string;
  is_accepted: boolean;
  accepted_at: Date | null;
  expires_at: Date;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  has_user_setup_sso: boolean;
}

interface OnboardingProps {
  isInvitationLinkModalVisible: boolean;
  setIsInvitationLinkModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  baseUrl: string;
  invitationLinkData: InvitationLink | null;
  modalType?: "invitation" | "resetPassword";
}

export function buildOnboardingUrl({
  baseUrl,
  invitationId,
  hasUserSetupSso,
  resetPassword,
}: {
  baseUrl: string;
  invitationId: string | undefined;
  hasUserSetupSso: boolean;
  resetPassword: boolean;
}): string {
  if (!baseUrl) {
    return "";
  }
  const basePath = new URL(baseUrl).pathname;
  const uiPath = basePath && basePath !== "/" ? `${basePath}/ui` : "ui";
  if (hasUserSetupSso) {
    return new URL(uiPath, baseUrl).toString();
  }
  if (!invitationId) {
    return "";
  }
  const action = resetPassword ? "&action=reset_password" : "";
  return new URL(`${uiPath}/onboarding?invitation_id=${invitationId}${action}`, baseUrl).toString();
}

export default function OnboardingModal({
  isInvitationLinkModalVisible,
  setIsInvitationLinkModalVisible,
  baseUrl,
  invitationLinkData,
  modalType = "invitation",
}: OnboardingProps) {
  const { t: uiT } = useDashboardLanguage();

  const linkFieldId = useId();
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const isInvitation = modalType === "invitation";
  const invitationUrl = buildOnboardingUrl({
    baseUrl,
    invitationId: invitationLinkData?.id,
    hasUserSetupSso: invitationLinkData?.has_user_setup_sso ?? false,
    resetPassword: !isInvitation,
  });

  return (
    <Dialog
      open={isInvitationLinkModalVisible}
      onOpenChange={(open) => !open && setIsInvitationLinkModalVisible(false)}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl" initialFocus={copyButtonRef}>
        <DialogHeader>
          <DialogTitle>{isInvitation ? uiT("ui.fedcc0e05a8fc438") : uiT("ui.583eebd8ec11c583")}</DialogTitle>
          <DialogDescription>
            {isInvitation ? uiT("ui.7dba3acb07d9ae78") : uiT("ui.3677ca4515b0ad92")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">{uiT("ui.7967e089a7b9")}</p>
            <p className="font-mono text-sm break-all">{invitationLinkData?.user_id}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={linkFieldId} className="text-xs font-normal text-muted-foreground">
              {isInvitation ? uiT("ui.88c3be35063553d5") : uiT("ui.453757e4bd5d43cd")}
            </Label>
            <InputGroup>
              <InputGroupInput id={linkFieldId} readOnly value={invitationUrl} className="font-mono text-xs" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  ref={copyButtonRef}
                  aria-label={isInvitation ? uiT("ui.641dce44f65bbd68") : uiT("ui.485b02054baea56b")}
                  onClick={() => copyToClipboard(invitationUrl)}
                >
                  <Copy />
                  {uiT("ui.e21f935f11d7")}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
