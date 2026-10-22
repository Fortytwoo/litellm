import { describe, expect, it, vi } from "vitest";
import { cnyToUsd, currencyControl, formatMoney, usdToCny } from "./currency";

describe("CNY amounts", () => {
  it("converts before rounding and retains sub-cent prices", () => {
    expect(formatMoney(1)).toBe("¥6.80");
    expect(formatMoney(0.001, 4)).toBe("¥0.0068");
    expect(formatMoney(98.854)).toBe("¥672.21");
    expect(formatMoney(1000, 1, true)).toBe("¥6.8K");
    expect(formatMoney(-1)).toBe("¥-6.80");
  });

  it("preserves missing amounts and distinguishes them from zero", () => {
    expect(formatMoney(null)).toBe("-");
    expect(formatMoney(undefined)).toBe("-");
    expect(formatMoney(NaN)).toBe("-");
    expect(formatMoney(Infinity)).toBe("-");
    expect(formatMoney(0)).toBe("¥0.00");
  });

  it.each([0, 100, 0.01, 0.0000001, -0.5, 123456.789])("round-trips USD %s without cents rounding", (value) => {
    expect(cnyToUsd(usdToCny(value))).toBeCloseTo(value, 12);
  });

  it("displays stored dollars in yuan and saves yuan input as dollars", () => {
    const onChange = vi.fn();
    const field = currencyControl({ name: "max_budget", value: 100, onChange });
    expect(field.value).toBe(680);
    field.onChange(68);
    expect(onChange).toHaveBeenLastCalledWith(10);
    field.onChange({ target: { value: "0.01" } });
    expect(Number(onChange.mock.lastCall?.[0])).toBeCloseTo(0.01 / 6.8, 14);
    field.onChange(null);
    expect(onChange).toHaveBeenLastCalledWith(null);
    field.onChange("");
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it.each(["teams.0.max_budget_in_team", "cache_write_cost"])("converts nested and pricing field %s", (name) => {
    const onChange = vi.fn();
    const field = currencyControl({ name, value: "0.001", onChange });
    expect(field.value).toBe("0.0068");
    field.onChange("0.0068");
    expect(onChange).toHaveBeenCalledWith("0.001");
  });

  it.each([
    "rpm_limit",
    "ptu_count",
    "similarity_threshold",
    "budget_duration",
    "team_member_max_budget_alert_emails.0.threshold",
  ])("keeps non-monetary field %s unchanged", (name) => {
    const field = { name, value: 100, onChange: vi.fn() };
    const display = currencyControl(field);
    expect(display.value).toBe(100);
    display.onChange("100");
    expect(field.onChange).toHaveBeenCalledWith("100");
  });
});
