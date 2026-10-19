"use client";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Edit, ExternalLink, Info, KeyRound, PlugZap, Trash2 } from "lucide-react";
import { useState } from "react";

import { testCyberArkConnection } from "@/app/(dashboard)/hooks/configOverrides/cyberArkApi";
import { useCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig";
import { useDeleteCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkConfig";
import { useUpdateCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import CyberArkEmptyPlaceholder from "./CyberArkEmptyPlaceholder";
import EditCyberArkModal from "./EditCyberArkModal";
import { FIELD_LABELS, SENSITIVE_FIELDS } from "./constants";

function detectAuthMethod(values: Record<string, unknown>): string {
  if (values.cyberark_api_key) return "API Key";
  if (values.client_cert && values.client_key) return "TLS Certificate";
  return "None";
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

export default function CyberArk() {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useCyberArkConfig();
  const { mutate: deleteConfig, isPending: isDeleting } = useDeleteCyberArkConfig(accessToken);
  const { mutate: updateConfig, isPending: isClearingField } = useUpdateCyberArkConfig(accessToken);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clearingField, setClearingField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const rawValues = data?.values ?? {};
  const isConfigured = Boolean(rawValues.cyberark_api_base);

  const handleTestConnection = async () => {
    if (!accessToken) return;
    setIsTesting(true);
    try {
      const result = await testCyberArkConnection(accessToken);
      toast.success(result.message || translateUi("ui.72f6b6df0908eb15"));
    } catch (err) {
      toast.fromError(err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = () => {
    deleteConfig(undefined, {
      onSuccess: () => {
        toast.success(translateUi("ui.a1f6fe2d5ecdf1fa"));
        setIsDeleteModalOpen(false);
      },
      onError: (err) => toast.fromError(err),
    });
  };

  const handleClearField = () => {
    if (!clearingField) return;
    updateConfig(
      { [clearingField]: "" },
      {
        onSuccess: () => {
          toast.success(
            translateUi("ui.f221bbbc0ddd4d4f", undefined, { v0: String(FIELD_LABELS[clearingField] ?? clearingField) }),
          );
          setClearingField(null);
        },
        onError: (err) => toast.fromError(err),
      },
    );
  };

  const renderValue = (key: string) => {
    const value = rawValues[key];
    if (!value) return <span className="text-muted-foreground italic">{uiT("ui.dd1841d295024256")}</span>;
    if (!SENSITIVE_FIELDS.has(key)) return <span className="font-mono text-muted-foreground">{value}</span>;

    return (
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-muted-foreground">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={uiT("ui.ada4add9f42761ca", { v0: String(FIELD_LABELS[key] ?? key) })}
          onClick={() => setClearingField(key)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    );
  };

  const fieldsToShow = Object.entries(rawValues).filter(([, value]) => value != null && value !== "");

  const renderCard = () => {
    if (isLoading) {
      return (
        <Card role="status" aria-label={uiT("ui.8f195db2ed8fc026")}>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      );
    }
    if (isError) {
      return (
        <Card>
          <CardContent>
            <Alert variant="error">
              <AlertTitle>{uiT("ui.5377322f5a9ba3b9")}</AlertTitle>
              {error instanceof Error && <AlertDescription>{error.message}</AlertDescription>}
            </Alert>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyRound className="size-6 text-muted-foreground" />
            <div>
              <CardTitle>
                <h3>{uiT("ui.a5e2959fe62d113f")}</h3>
              </CardTitle>
              <CardDescription>{uiT("ui.84b52e8beac8684a")}</CardDescription>
            </div>
          </div>
          {isConfigured && (
            <CardAction className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={isTesting} onClick={handleTestConnection}>
                <PlugZap />
                {isTesting ? uiT("ui.6c02a28421f8ad91") : uiT("ui.c02977b07ec93816")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditModalVisible(true)}>
                <Edit />
                {uiT("ui.0a397326a036f57a")}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 />
                {uiT("ui.9ac1ac7be0a63da1")}
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isConfigured && (
            <Alert variant="info">
              <Info />
              <AlertTitle>{uiT("ui.ece2087a4a64ed7f")}</AlertTitle>
              <AlertDescription>
                <a
                  href="https://docs.litellm.ai/docs/secret_managers/cyberark"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  {uiT("ui.392e16f77e9f5d6d")}
                  <ExternalLink className="size-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          {isConfigured ? (
            fieldsToShow.length > 0 && (
              <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
                <DetailRow label={uiT("ui.b765e993fce69784")}>{translateText(detectAuthMethod(rawValues))}</DetailRow>
                {fieldsToShow.map(([key]) => (
                  <DetailRow key={key} label={FIELD_LABELS[key] ?? key}>
                    {renderValue(key)}
                  </DetailRow>
                ))}
              </dl>
            )
          ) : (
            <CyberArkEmptyPlaceholder onAdd={() => setIsEditModalVisible(true)} />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderCard()}

      <EditCyberArkModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => setIsEditModalVisible(false)}
      />
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={uiT("ui.880004b1faf87031")}
        message={uiT("ui.45672cae535b0d11")}
        resourceInformationTitle="CyberArk Configuration"
        resourceInformation={[{ label: uiT("ui.7153367d0ad7eaf3"), value: rawValues.cyberark_api_base }]}
        onCancel={() => setIsDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={isDeleting}
      />
      <DeleteResourceModal
        isOpen={clearingField !== null}
        title={uiT("ui.4f137c555ab4e3ec", {
          v0: String(clearingField ? FIELD_LABELS[clearingField] ?? clearingField : ""),
        })}
        message={uiT("ui.c3631bf5b94e22c1")}
        resourceInformationTitle="Field"
        resourceInformation={[
          {
            label: uiT("ui.f45fc1dfdc96db27"),
            value: clearingField ? FIELD_LABELS[clearingField] ?? clearingField : "",
          },
        ]}
        onCancel={() => setClearingField(null)}
        onOk={handleClearField}
        confirmLoading={isClearingField}
      />
    </>
  );
}
