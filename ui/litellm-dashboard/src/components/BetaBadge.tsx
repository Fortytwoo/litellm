"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useDisableShowNewBadge } from "@/app/(dashboard)/hooks/useDisableShowNewBadge";

export default function BetaBadge({ children, dot = false }: { children?: React.ReactNode; dot?: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  const disableShowNewBadge = useDisableShowNewBadge();

  if (disableShowNewBadge) {
    return children ? <>{children}</> : null;
  }

  const badge = dot ? <Badge className="size-1.5 p-0" /> : <Badge>{uiT("ui.703390318bd5")}</Badge>;

  return children ? (
    <span className="inline-flex items-center gap-1.5">
      {children}
      {badge}
    </span>
  ) : (
    badge
  );
}
