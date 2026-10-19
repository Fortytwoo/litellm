"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiModelResult } from "./types";
import { exportMultiToPDF, exportMultiToCSV } from "./multi_export_utils";

interface MultiExportDropdownProps {
  multiResult: MultiModelResult;
}

const MultiExportDropdown: React.FC<MultiExportDropdownProps> = ({ multiResult }) => {
  const { t: uiT } = useDashboardLanguage();

  const hasResults = multiResult.entries.some((e) => e.result !== null);

  if (!hasResults) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "secondary", size: "xs" })}>
        <Download />
        {uiT("ui.3664895579f0")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => exportMultiToPDF(multiResult)}>
          <FileText />
          {uiT("ui.1bf7868792f8a4b8")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportMultiToCSV(multiResult)}>
          <FileSpreadsheet />
          {uiT("ui.868da4093e746112")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiExportDropdown;
