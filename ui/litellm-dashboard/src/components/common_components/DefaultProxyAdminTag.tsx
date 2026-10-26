"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_PROXY_ADMIN_USER_ID } from "@/utils/sentinels";

interface DefaultProxyAdminTagProps {
  userId: string | null | undefined;
  displayName?: string | null;
}

export default function DefaultProxyAdminTag({ userId, displayName }: DefaultProxyAdminTagProps) {
  const { t: uiT } = useDashboardLanguage();

  if (userId === DEFAULT_PROXY_ADMIN_USER_ID) {
    return <Badge variant="secondary">{uiT("ui.45511f6a4e578aea")}</Badge>;
  }

  return <span title={userId || undefined}>{displayName || userId}</span>;
}
