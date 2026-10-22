import { formatMoney } from "@/utils/currency";
import { t as translateUi } from "@/i18n";

export interface SummaryTile {
  title: string;
  value: string;
  className?: string;
  tooltip?: string;
  expandable?: boolean;
}

interface SpendSummaryMetadata {
  total_spend: number;
  total_flat_cost?: number;
  total_api_requests: number;
  total_successful_requests: number;
  total_failed_requests: number;
  total_tokens: number;
}

export const TOTAL_COST_TOOLTIP =
  "Request cost plus flat cost for reserved capacity. Select this tile to see the breakdown.";

export const REQUEST_COST_TOOLTIP =
  "Usage-based cost of the requests this entity sent during the selected period, priced per token.";

export const FLAT_COST_TOOLTIP =
  "Reserved provisioned throughput, billed per hour whether or not requests are sent. Reported here only; it does not count toward team, key, user, or organization budgets.";

export const hasFlatCost = (metadata: SpendSummaryMetadata): boolean => (metadata.total_flat_cost ?? 0) > 0;

export const buildSummaryTiles = (metadata: SpendSummaryMetadata, showFlatCost: boolean): SummaryTile[] => {
  const flatCost = metadata.total_flat_cost ?? 0;
  return [
    showFlatCost
      ? {
          get title() {
            return translateUi("ui.dfa5cc738da2");
          },
          value: formatMoney(metadata.total_spend + flatCost, 2),
          tooltip: TOTAL_COST_TOOLTIP,
          expandable: true,
        }
      : {
          get title() {
            return translateUi("ui.00c71c737b6c");
          },
          value: formatMoney(metadata.total_spend, 2),
        },
    {
      get title() {
        return translateUi("ui.37e751d178cb");
      },
      value: metadata.total_api_requests.toLocaleString(),
    },
    {
      get title() {
        return translateUi("ui.bcc7bb078ec3");
      },
      value: metadata.total_successful_requests.toLocaleString(),
      className: "text-success",
    },
    {
      get title() {
        return translateUi("ui.e2886352d535");
      },
      value: metadata.total_failed_requests.toLocaleString(),
      className: "text-destructive",
    },
    {
      get title() {
        return translateUi("ui.cd41bf0d3e9a");
      },
      value: metadata.total_tokens.toLocaleString(),
    },
  ];
};

export const buildCostBreakdownTiles = (metadata: SpendSummaryMetadata): SummaryTile[] => [
  {
    get title() {
      return translateUi("ui.9e579bd69d156ee0");
    },
    value: formatMoney(metadata.total_spend, 2),
    className: "text-info",
    tooltip: REQUEST_COST_TOOLTIP,
  },
  {
    get title() {
      return translateUi("ui.b5a82c86b929e176");
    },
    value: formatMoney(metadata.total_flat_cost ?? 0, 2),
    className: "text-violet-600",
    tooltip: FLAT_COST_TOOLTIP,
  },
];
