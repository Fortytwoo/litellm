"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig";
import { useUpdateCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { toast } from "@/lib/toast";
import React, { useMemo } from "react";
import { z } from "zod";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Separator } from "@/components/ui/separator";
import { useZodForm } from "@/lib/forms/useZodForm";
import { SENSITIVE_FIELDS, FIELD_LABELS } from "./constants";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CyberArkFieldGroup {
  title: string;
  subtitle?: string;
  fields: string[];
}

const FIELD_GROUPS: CyberArkFieldGroup[] = [
  {
    get title() {
      return translateUi("ui.639a40e82b9a96f0");
    },
    fields: ["cyberark_api_base", "cyberark_account", "cyberark_username"],
  },
  {
    get title() {
      return translateUi("ui.f372368088b8fa2e");
    },
    get subtitle() {
      return translateUi("ui.f8deb3714ba618c8");
    },
    fields: ["cyberark_api_key"],
  },
  {
    get title() {
      return translateUi("ui.a79d23c12bf113c3");
    },
    get subtitle() {
      return translateUi("ui.71defe5e7c7121cb");
    },
    fields: ["client_cert", "client_key"],
  },
  {
    get title() {
      return translateUi("ui.9f088dbebd6c3c70");
    },
    get subtitle() {
      return translateUi("ui.1e4670469dcafb35");
    },
    fields: ["ssl_verify", "refresh_interval"],
  },
];

type CyberArkFormValues = Record<string, string>;

const buildSchema = (fields: readonly string[]): z.ZodType<CyberArkFormValues, CyberArkFormValues> =>
  z.object(
    Object.fromEntries(
      fields.map((name) => [
        name,
        name === "cyberark_api_base"
          ? z.string().refine((value) => value.length === 0 || /^https?:\/\/.+/.test(value), {
              get message() {
                return translateUi("ui.3ca6e40c7de5fa02");
              },
            })
          : z.string(),
      ]),
    ),
  ) as unknown as z.ZodType<CyberArkFormValues, CyberArkFormValues>;

interface EditCyberArkModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditCyberArkModal: React.FC<EditCyberArkModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const { data } = useCyberArkConfig();
  const { mutate, isPending } = useUpdateCyberArkConfig(accessToken);

  const properties: Record<string, { description?: string }> = useMemo(
    () => data?.field_schema?.properties ?? {},
    [data],
  );
  const rawValues: Record<string, unknown> = useMemo(() => data?.values ?? {}, [data]);

  const visibleFields = useMemo(
    () => FIELD_GROUPS.flatMap((group) => group.fields).filter((name) => properties[name] !== undefined),
    [properties],
  );

  const seededValues = useMemo(
    () =>
      Object.fromEntries(
        visibleFields.map((name) => [name, SENSITIVE_FIELDS.has(name) ? "" : ((rawValues[name] ?? "") as string)]),
      ),
    [visibleFields, rawValues],
  );

  const schema = useMemo(() => buildSchema(visibleFields), [visibleFields]);
  const form = useZodForm(schema, { values: seededValues });

  const handleSubmit = (formValues: CyberArkFormValues) => {
    const config: Record<string, string> = Object.fromEntries(
      Object.entries(formValues).flatMap(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") return [[key, value]];
        if (!SENSITIVE_FIELDS.has(key)) return [[key, ""]];
        return [];
      }),
    );

    mutate(config, {
      onSuccess: () => {
        toast.success(translateUi("ui.afc038fb481bae30"));
        onSuccess();
      },
      onError: (err) => {
        toast.fromError(err);
      },
    });
  };

  const handleCancel = () => {
    form.reset(seededValues);
    onCancel();
  };

  const renderField = (fieldName: string) => {
    const fieldSchema = properties[fieldName];
    if (!fieldSchema) return null;

    const isSensitive = SENSITIVE_FIELDS.has(fieldName);
    const existingValue = rawValues[fieldName];
    const hasExistingValue = isSensitive && existingValue != null && existingValue !== "";
    const placeholder = hasExistingValue ? `Leave blank to keep existing (${existingValue})` : fieldSchema?.description;

    return (
      <FormField key={fieldName} control={form.control} name={fieldName} label={FIELD_LABELS[fieldName] ?? fieldName}>
        {({ ref, ...field }) =>
          isSensitive ? (
            <PasswordInput ref={ref} placeholder={placeholder} {...field} />
          ) : (
            <Input ref={ref} placeholder={fieldSchema?.description} {...field} />
          )
        }
      </FormField>
    );
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{uiT("ui.26c582f24d5c2b04")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {FIELD_GROUPS.map((group, index) => (
            <div key={group.title}>
              {index > 0 && <Separator className="my-6" />}
              <h5 className="mb-1 text-base font-semibold text-foreground">{group.title}</h5>
              {group.subtitle && <p className="mb-4 text-sm text-muted-foreground">{group.subtitle}</p>}
              <FieldGroup>{group.fields.map(renderField)}</FieldGroup>
            </div>
          ))}
        </form>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button type="button" disabled={isPending} onClick={() => void form.handleSubmit(handleSubmit)()}>
              {isPending && <UiLoadingSpinner className="size-4 mr-1" />}
              {isPending ? uiT("ui.dc85af8f2b1d") : uiT("ui.1509f561f241")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCyberArkModal;
