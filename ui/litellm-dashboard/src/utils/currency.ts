import Decimal from "decimal.js";

export const USD_TO_CNY_RATE = 6.8;
export const CURRENCY_SYMBOL = "¥";

export const usdToCny = (value: number): number => new Decimal(value).mul(USD_TO_CNY_RATE).toNumber();
export const cnyToUsd = (value: number): number => new Decimal(value).div(USD_TO_CNY_RATE).toNumber();

const moneyScale = (magnitude: number, abbreviate: boolean): readonly [number, string] => {
  if (!abbreviate) return [1, ""];
  if (magnitude >= 1_000_000_000) return [1_000_000_000, "B"];
  if (magnitude >= 1_000_000) return [1_000_000, "M"];
  if (magnitude >= 1_000) return [1_000, "K"];
  return [1, ""];
};

export const formatMoney = (
  value: number | null | undefined,
  digits: number | null = 2,
  abbreviate = false,
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  const amount = usdToCny(value);
  const magnitude = Math.abs(amount);
  const [divisor, suffix] = moneyScale(magnitude, abbreviate);
  return `${CURRENCY_SYMBOL}${(amount / divisor).toLocaleString("en-US", {
    minimumFractionDigits: digits ?? 0,
    maximumFractionDigits: digits ?? 15,
  })}${suffix}`;
};

const MONEY_FIELDS: ReadonlySet<string> = new Set([
  "max_budget",
  "soft_budget",
  "max_budget_in_team",
  "team_member_budget",
  "temp_budget_increase",
  "budget_limit",
  "cache_read_cost",
  "cache_write_cost",
  "cost_per_request",
  "input_cost",
  "output_cost",
  "input_cost_per_token",
  "output_cost_per_token",
  "cache_read_input_token_cost",
  "cache_creation_input_token_cost",
  "input_cost_per_second",
  "output_cost_per_second",
  "fixed_amount",
  "cost_per_query",
  "cost_per_ptu_per_hour",
  "ptu_cost_per_hour",
  "ui_session_budget",
  "daily_budget",
  "monthly_budget",
  "min_spend",
]);

export const isMoneyField = (name: string): boolean => MONEY_FIELDS.has(name.split(".").at(-1) ?? "");

const convertInputValue = (value: unknown, convert: (amount: number) => number): unknown => {
  if (typeof value === "number" && Number.isFinite(value)) return convert(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return String(convert(Number(value)));
  }
  return value;
};

interface CurrencyControl {
  readonly name: string;
  readonly value: unknown;
  readonly onChange: (...events: unknown[]) => void;
}

const inputEventValue = (event: unknown): unknown => {
  if (event !== null && typeof event === "object" && "target" in event) {
    const target = event.target;
    if (target !== null && typeof target === "object" && "value" in target) return target.value;
  }
  return event;
};

export const currencyControl = <T extends CurrencyControl>(field: T): T => {
  if (!isMoneyField(field.name)) return field;
  return {
    ...field,
    value: convertInputValue(field.value, usdToCny),
    onChange: (event: unknown) => field.onChange(convertInputValue(inputEventValue(event), cnyToUsd)),
  };
};
