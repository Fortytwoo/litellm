import { describe, expect, it } from "vitest";
import { averageResponseTimeMs, formatResponseTime, valueFormatter, valueFormatterSpend } from "./value_formatters";

describe("averageResponseTimeMs", () => {
  it("divides the summed duration by the number of timed requests", () => {
    expect(averageResponseTimeMs(6000, 4)).toBe(1500);
    expect(averageResponseTimeMs(0, 3)).toBe(0);
  });

  it("returns null instead of dividing by zero when nothing was timed", () => {
    expect(averageResponseTimeMs(0, 0)).toBeNull();
    expect(averageResponseTimeMs(1200, 0)).toBeNull();
  });
});

describe("formatResponseTime", () => {
  it("shows sub-second durations in whole milliseconds", () => {
    expect(formatResponseTime(0)).toBe("0ms");
    expect(formatResponseTime(412.6)).toBe("413ms");
    expect(formatResponseTime(999)).toBe("999ms");
  });

  it("shows durations of a second or more in seconds with two decimals", () => {
    expect(formatResponseTime(1000)).toBe("1.00s");
    expect(formatResponseTime(1500)).toBe("1.50s");
    expect(formatResponseTime(12345)).toBe("12.35s");
  });

  it("shows a dash when there is no average to display", () => {
    expect(formatResponseTime(null)).toBe("-");
    expect(formatResponseTime(undefined)).toBe("-");
  });
});

describe("valueFormatter", () => {
  it("should format numbers >= 1,000,000 as millions with 2 decimal places", () => {
    expect(valueFormatter(1_000_000)).toBe("1.00M");
    expect(valueFormatter(1_500_000)).toBe("1.50M");
    expect(valueFormatter(2_750_000)).toBe("2.75M");
    expect(valueFormatter(10_000_000)).toBe("10.00M");
  });

  it("should format numbers in the thousands range as 'k' suffix", () => {
    expect(valueFormatter(1_000)).toBe("1k");
    expect(valueFormatter(5_500)).toBe("5.5k");
    expect(valueFormatter(999_999)).toBe("999.999k");
  });

  it("should return the plain string for numbers below 1,000", () => {
    expect(valueFormatter(0)).toBe("0");
    expect(valueFormatter(1)).toBe("1");
    expect(valueFormatter(999)).toBe("999");
    expect(valueFormatter(42)).toBe("42");
  });

  it("should treat exactly 1,000,000 as the millions boundary", () => {
    expect(valueFormatter(1_000_000)).toBe("1.00M");
  });

  it("should treat exactly 1,000 as the thousands boundary", () => {
    expect(valueFormatter(1_000)).toBe("1k");
  });
});

describe("valueFormatterSpend", () => {
  it.each([
    [0, "¥0.00"],
    [1, "¥6.80"],
    [99.99, "¥679.93"],
    [999, "¥6.79K"],
    [1000, "¥6.80K"],
    [5500, "¥37.40K"],
    [999999, "¥6.80M"],
    [1000000, "¥6.80M"],
    [2500000, "¥17.00M"],
    [1000000000, "¥6.80B"],
  ])("formats USD %s as %s after applying the CNY compact threshold", (value, expected) => {
    expect(valueFormatterSpend(value)).toBe(expected);
  });
});
