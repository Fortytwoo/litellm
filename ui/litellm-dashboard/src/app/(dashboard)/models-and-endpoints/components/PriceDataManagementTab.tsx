"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import PriceDataReload from "@/components/price_data_reload";
import React from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useQueryClient } from "@tanstack/react-query";
import { modelCostMapKeys } from "../../hooks/models/useModelCostMap";

const PriceDataManagementTab = () => {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const queryClient = useQueryClient();

  return (
    <div>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{uiT("ui.93cbc077c5b07521")}</h2>
          <p className="text-sm text-muted-foreground">{uiT("ui.a654b969287d721d")}</p>
        </div>
        <PriceDataReload
          accessToken={accessToken}
          onReloadSuccess={() => {
            queryClient.invalidateQueries({ queryKey: modelCostMapKeys.all });
          }}
          buttonText={uiT("ui.4a6aa0de5cc20a47")}
          size="middle"
          type="primary"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default PriceDataManagementTab;
