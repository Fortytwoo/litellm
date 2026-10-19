"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { ArrowRight, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProxyBaseUrl } from "./networking";

interface RoutePreviewProps {
  pathValue: string;
  targetValue: string;
  includeSubpath: boolean;
}

const Endpoint = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0 flex-1 rounded-lg border bg-muted/40 p-3">
    <div className="mb-2 text-sm text-muted-foreground">{label}</div>
    <code className="block overflow-x-auto font-mono text-sm text-foreground">{children}</code>
  </div>
);

const RoutePreview: React.FC<RoutePreviewProps> = ({ pathValue, targetValue, includeSubpath }) => {
  const { t: uiT } = useDashboardLanguage();

  const proxyBaseUrl = getProxyBaseUrl();

  if (!pathValue || !targetValue) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{uiT("ui.0a85dd82cab297c5")}</CardTitle>
        <CardDescription>{uiT("ui.d1f01227cc13ddf0")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="mb-3 text-base font-semibold">{uiT("ui.49f5c0873a30e04e")}</h4>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Endpoint label={uiT("ui.cad6028adc8250e6")}>{`${proxyBaseUrl}${pathValue}`}</Endpoint>
            <ArrowRight className="size-5 shrink-0 self-center text-muted-foreground max-sm:rotate-90" />
            <Endpoint label={uiT("ui.34780568209b585e")}>{targetValue}</Endpoint>
          </div>
        </div>

        {includeSubpath ? (
          <div>
            <h4 className="mb-3 text-base font-semibold">{uiT("ui.e6229aa7053bf769")}</h4>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Endpoint label={uiT("ui.6c3e14703f213532")}>
                {`${proxyBaseUrl}${pathValue}`}
                <span className="text-primary">/v1/text-to-image/base/model</span>
              </Endpoint>
              <ArrowRight className="size-5 shrink-0 self-center text-muted-foreground max-sm:rotate-90" />
              <Endpoint label={uiT("ui.34780568209b585e")}>
                {targetValue}
                <span className="text-primary">/v1/text-to-image/base/model</span>
              </Endpoint>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {uiT("ui.12f4636d3aaa2087")} {pathValue} {uiT("ui.eb91430da6362363")}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium">{uiT("ui.4296ca902682b4ca")}</span> {uiT("ui.6d85fcc891657062")}{" "}
              <code className="rounded-sm bg-primary/10 px-1 py-0.5 font-mono text-xs">/api/v1/models</code>{" "}
              {uiT("ui.9e9a2240a47a6134")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoutePreview;
