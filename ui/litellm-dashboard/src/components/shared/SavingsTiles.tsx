"use client";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useMemo } from "react";

import SummaryCard from "@/components/shared/SummaryCard";
import {
  autorouterOf,
  cachingOf,
  compressionOf,
  gatewayAttributedCachingOf,
  SAVINGS_DRIVERS,
  savedTokensOf,
  sumOverDays,
  usd,
} from "@/app/(dashboard)/cost-optimization/_components/costOptimizationUtils";
import { DailyData } from "@/components/UsagePage/types";
import { formatNumberWithCommas } from "@/utils/dataUtils";

// The total sums SAVINGS_DRIVERS, so it is by construction the sum of what the
// charts plot; the donut and timelines derive from the same list in costOptimizationUtils.
const useSavingsTotals = (results: DailyData[]) =>
  useMemo(
    () => ({
      compression: sumOverDays(results, compressionOf),
      caching: sumOverDays(results, cachingOf),
      autorouter: sumOverDays(results, autorouterOf),
      gatewayAttributedCaching: sumOverDays(results, gatewayAttributedCachingOf),
      savedTokens: sumOverDays(results, savedTokensOf),
      total: SAVINGS_DRIVERS.reduce((sum, { of }) => sum + sumOverDays(results, of), 0),
    }),
    [results],
  );

const SavingsTiles = ({ results, isLoading }: { results: DailyData[]; isLoading: boolean }) => {
  const { t: uiT } = useDashboardLanguage();

  const totals = useSavingsTotals(results);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label={uiT("ui.4ff945e7135d")}
        value={usd(totals.total)}
        hint={isLoading ? uiT("ui.47d2a515ef2f") : uiT("ui.19502480a9d5")}
        info={uiT("ui.6aa38b319887")}
      />
      <SummaryCard
        label={uiT("ui.9062d2dd4b11")}
        value={usd(totals.compression)}
        hint={uiT("supplement.compressedTokens", { count: formatNumberWithCommas(totals.savedTokens) })}
        info={uiT("ui.5868614490fb")}
      />
      <SummaryCard
        label={uiT("ui.a02a1393968f")}
        value={usd(totals.gatewayAttributedCaching)}
        hint={uiT("ui.7108cae9c538")}
        secondary={{ label: uiT("ui.c9b3c38247f7"), value: usd(totals.caching) }}
        info={uiT("ui.3a9883db00ee")}
      />
      <SummaryCard
        label={uiT("ui.2adbb3c2d08d")}
        value={usd(totals.autorouter)}
        hint={uiT("ui.25c915733656")}
        info={uiT("ui.d00d9f7859ac")}
      />
    </div>
  );
};

export default SavingsTiles;
