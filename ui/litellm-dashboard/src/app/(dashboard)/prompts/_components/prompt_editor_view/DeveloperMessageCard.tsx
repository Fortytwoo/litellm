"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import VariableTextArea from "../variable_textarea";

interface DeveloperMessageCardProps {
  value: string;
  onChange: (value: string) => void;
}

const DeveloperMessageCard: React.FC<DeveloperMessageCardProps> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Card>
      <CardContent className="p-3">
        <p className="mb-2 text-sm font-medium text-foreground">{uiT("ui.5a2b1eb51db946bf")}</p>
        <p className="mb-2 text-xs text-muted-foreground">{uiT("ui.6e1ba689c84c6d05")}</p>
        <VariableTextArea value={value} onChange={onChange} rows={3} placeholder={uiT("ui.cd159961f289b120")} />
      </CardContent>
    </Card>
  );
};

export default DeveloperMessageCard;
