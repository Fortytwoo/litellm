"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import CopyButton from "@/components/shared/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { JsonViewer } from "./JsonViewer";

interface ClassifierAuditViewProps {
  request: Record<string, unknown>;
  response: unknown;
}

export function ClassifierAuditView({ request, response }: ClassifierAuditViewProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="mb-6 space-y-4">
      <AuditField title={uiT("ui.d74fa715dea4")} value={request.classifier_input}>
        {uiT("ui.7860e65137c1")}
      </AuditField>
      <AuditField title={uiT("ui.cc39c83de891")} value={request.originating_request_masked}>
        {uiT("ui.6b852c7700a7")}
      </AuditField>
      <AuditField title={uiT("ui.48c932b5a333")} value={response}>
        {uiT("ui.49b5afd1f3e1")}
      </AuditField>
    </div>
  );
}

function AuditField({ title, value, children }: { title: string; value: unknown; children: ReactNode }) {
  const { t: uiT } = useDashboardLanguage();

  const serialized = JSON.stringify(value);
  const truncated = serialized?.includes("litellm_truncated") ?? false;

  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {value != null && <CopyButton value={JSON.stringify(value, null, 2)} label={`Copy ${title}`} />}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{children}</p>
        {truncated && (
          <p role="status" className="mb-3 text-sm text-warning">
            {uiT("ui.db11bcb98a66")}
          </p>
        )}
        {value == null ? (
          <p className="text-sm text-muted-foreground">{uiT("ui.137c2304b875")}</p>
        ) : (
          <JsonViewer data={value} mode="formatted" />
        )}
      </CardContent>
    </Card>
  );
}
