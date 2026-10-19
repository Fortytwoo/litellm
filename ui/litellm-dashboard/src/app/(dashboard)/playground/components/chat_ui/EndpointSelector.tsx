"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { SearchSelect } from "@/components/shared/SearchSelect";
import React from "react";
import { ENDPOINT_OPTIONS } from "./chatConstants";

interface EndpointSelectorProps {
  endpointType: string | null;
  onEndpointChange: (value: string | null) => void;
  className?: string;
}

const EndpointSelector: React.FC<EndpointSelectorProps> = ({ endpointType, onEndpointChange, className }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className={className}>
      <SearchSelect
        value={endpointType}
        onValueChange={onEndpointChange}
        options={ENDPOINT_OPTIONS}
        placeholder={uiT("ui.0bb690a3b0364e4c")}
      />
    </div>
  );
};

export default EndpointSelector;
