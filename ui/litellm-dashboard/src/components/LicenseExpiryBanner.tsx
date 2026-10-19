"use client";
import { translateText } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";
import { CircleAlert, TriangleAlert, X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { LicenseInfo } from "@/components/networking";
import { useLicenseInfo } from "@/app/(dashboard)/hooks/license/useLicenseInfo";
import { formatExpiryDate, getDaysUntilExpiration, getLicenseExpiryTier } from "@/utils/licenseUtils";

const DISMISS_KEY_PREFIX = "litellm:licenseExpiryBannerDismissed:";
const SALES_EMAIL = "sales@berri.ai";

const salesLink = <a href={`mailto:${SALES_EMAIL}`}>{translateText(SALES_EMAIL)}</a>;

interface LicenseExpiryBannerProps {
  accessToken: string | null;
}

interface LicenseExpiryBannerViewProps {
  licenseInfo: LicenseInfo | null;
}

const describeCountdown = (days: number): string => {
  if (days <= 0) {
    return "expires today";
  }
  if (days === 1) {
    return "expires in 1 day";
  }
  return `expires in ${days} days`;
};

const expiryDescription = (tier: "warning" | "critical" | "expired"): React.ReactNode => {
  if (tier === "expired") {
    return (
      <>
        {translateUi("ui.bef747292a12358a")} {salesLink} {translateUi("ui.f29b9677af216d17")}
      </>
    );
  }
  if (tier === "critical") {
    return (
      <>
        {translateUi("ui.e42da0fb40ec2587")} {salesLink}
      </>
    );
  }
  return (
    <>
      {translateUi("ui.821a6ee60f76f898")} {salesLink}
    </>
  );
};

export const LicenseExpiryBannerView: React.FC<LicenseExpiryBannerViewProps> = ({ licenseInfo }) => {
  const { t: uiT } = useDashboardLanguage();

  const [locallyDismissed, setLocallyDismissed] = useState(false);

  const expirationDate = licenseInfo?.expiration_date ?? null;
  const tier = getLicenseExpiryTier(expirationDate);
  const days = getDaysUntilExpiration(expirationDate);

  if (expirationDate === null || tier === "none" || days === null) {
    return null;
  }

  const isDismissible = tier === "warning";
  const dismissKey = `${DISMISS_KEY_PREFIX}${expirationDate}`;
  const previouslyDismissed =
    isDismissible && typeof window !== "undefined" ? sessionStorage.getItem(dismissKey) === "true" : false;

  if (isDismissible && (locallyDismissed || previouslyDismissed)) {
    return null;
  }

  const formattedDate = formatExpiryDate(expirationDate);

  const message =
    tier === "expired"
      ? `Your LiteLLM Enterprise license expired on ${formattedDate}`
      : `Your LiteLLM Enterprise license ${describeCountdown(days)} (${formattedDate})`;

  const description = expiryDescription(tier);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissKey, "true");
    }
    setLocallyDismissed(true);
  };

  return (
    <Alert variant={tier === "warning" ? "warning" : "error"} className="rounded-none border-x-0 border-t-0">
      {tier === "warning" ? (
        <TriangleAlert className="size-4" aria-hidden />
      ) : (
        <CircleAlert className="size-4" aria-hidden />
      )}
      <AlertTitle>{translateText(message)}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {isDismissible && (
        <AlertAction>
          <Button variant="ghost" size="icon-sm" aria-label={uiT("ui.7d9eb7acb13e")} onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
};

export const LicenseExpiryBanner: React.FC<LicenseExpiryBannerProps> = ({ accessToken }) => {
  const { data } = useLicenseInfo(accessToken);
  return <LicenseExpiryBannerView licenseInfo={data ?? null} />;
};
