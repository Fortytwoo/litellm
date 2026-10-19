"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { obj, str } from "@/lib/http/managedGateway";
import { useGatewayQuery, useWriter, useAction, Notice } from "./Shared";
import { useCopy } from "./locale";

export function CentralAccount({ collapsed }: { collapsed: boolean }) {
  const t = useCopy();
  const { locale, setLocale } = useLanguage();
  const me = useGatewayQuery("me");
  const write = useWriter(str(me.data?.csrf_token));
  const action = useAction();
  const profile = obj(me.data?.profile);
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" className="w-full justify-start gap-2" />}>
        {str(profile.avatar_url) && (
          <Image unoptimized width={32} height={32} className="rounded-full" src={str(profile.avatar_url)} alt="" />
        )}
        {!collapsed && <span className="truncate">{str(profile.name) || t("owner")}</span>}
      </PopoverTrigger>
      <PopoverContent className="space-y-3">
        <p className="text-sm font-medium">{t("security")}</p>
        <Button variant="outline" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>
          {locale === "zh" ? "English" : "中文"}
        </Button>
        <Button
          variant="outline"
          disabled={action.pending}
          onClick={() =>
            action.run(async () => {
              await write("logout", {});
              window.location.href = "/admin?auto_sso=off";
            })
          }
        >
          {t("logout")}
        </Button>
        <Notice error={action.error} />
      </PopoverContent>
    </Popover>
  );
}
