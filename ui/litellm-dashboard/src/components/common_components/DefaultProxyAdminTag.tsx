"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useUserDisplayLookup } from "@/app/(dashboard)/hooks/users/useUsers";
import { DEFAULT_PROXY_ADMIN_USER_ID } from "@/utils/sentinels";

interface DefaultProxyAdminTagProps {
  userId: string | null | undefined;
  displayName?: string | null;
  fallbackLabel?: string | null;
}

export default function DefaultProxyAdminTag({ userId, displayName, fallbackLabel }: DefaultProxyAdminTagProps) {
  const { t: uiT } = useDashboardLanguage();

  const { data: names = {} } = useUserDisplayLookup(
    userId && userId !== DEFAULT_PROXY_ADMIN_USER_ID && !displayName ? [userId] : [],
  );

  if (userId === DEFAULT_PROXY_ADMIN_USER_ID) {
    return <Badge variant="secondary">{uiT("ui.45511f6a4e578aea")}</Badge>;
  }

  return <span title={userId || undefined}>{displayName || (userId && names[userId]) || fallbackLabel || userId}</span>;
}
