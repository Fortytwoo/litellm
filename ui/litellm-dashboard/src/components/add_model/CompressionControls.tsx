"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect, SearchSelectOption } from "@/components/shared/SearchSelect";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import React from "react";
import { useGuardrails } from "@/app/(dashboard)/hooks/guardrails/useGuardrails";
import {
  AutoRouterCompressionState,
  isCompressionGuardrailProvider,
  NO_COMPRESSION,
} from "./buildAutoRouterCompression";

interface CompressionControlsProps {
  value: AutoRouterCompressionState;
  onChange: (state: AutoRouterCompressionState) => void;
}

const NONE_OPTION: SearchSelectOption = {
  get label() {
    return translateUi("ui.7cdfedcc5aa42a43");
  },
  value: NO_COMPRESSION,
};

const CompressionControls: React.FC<CompressionControlsProps> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const { routing, sameAsRouting, model } = value;
  const onRoutingChange = (newRouting: string | undefined) => onChange({ ...value, routing: newRouting });
  const onSameAsRoutingChange = (newSameAsRouting: boolean) => onChange({ ...value, sameAsRouting: newSameAsRouting });
  const onModelChange = (newModel: string | undefined) => onChange({ ...value, model: newModel });

  const { data } = useGuardrails();
  const compressionOptions: SearchSelectOption[] = (data?.guardrails ?? [])
    .filter((g) => isCompressionGuardrailProvider(g.litellm_params?.guardrail))
    .map((g) => ({ label: g.guardrail_name, value: g.guardrail_name }));
  const options: SearchSelectOption[] = [NONE_OPTION, ...compressionOptions];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">{uiT("ui.1850dfc6f1f49a05")}</span>
          <SimpleTooltip content={uiT("ui.cb9f44ad02d546af")}>
            <Info className="size-4 text-muted-foreground" />
          </SimpleTooltip>
        </div>
        <SearchSelect
          options={options}
          value={routing}
          onValueChange={(value) => onRoutingChange(value ?? undefined)}
          placeholder={uiT("ui.4e9350cdaf0cc316")}
          emptyText={uiT("ui.38b4c6e0b4163c17")}
          aria-label={uiT("ui.ea2dabd9e1f74d3d")}
        />
      </div>

      {routing !== undefined && (
        <div>
          <span className="mb-2 block text-sm font-medium">{uiT("ui.1eeda0f7103f9ac4")}</span>
          <RadioGroup
            value={sameAsRouting ? "same" : "different"}
            onValueChange={(value: unknown) => onSameAsRoutingChange(value === "same")}
            className="w-full"
          >
            <div className="flex w-full flex-col items-start gap-2">
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="same" className="mt-0.5" />
                <span>{uiT("ui.1027b5deac393942")}</span>
              </Label>
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="different" className="mt-0.5" />
                <span>{uiT("ui.e89946060aead7dd")}</span>
              </Label>
            </div>
          </RadioGroup>

          {!sameAsRouting && (
            <div className="mt-3">
              <SearchSelect
                options={options}
                value={model}
                onValueChange={(value) => onModelChange(value ?? undefined)}
                placeholder={uiT("ui.7cdfedcc5aa42a43")}
                emptyText={uiT("ui.38b4c6e0b4163c17")}
                aria-label={uiT("ui.faf20e01e579ef1c")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
