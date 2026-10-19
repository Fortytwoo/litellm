import { describe, expect, it } from "vitest";
import { t, translations, type TranslationMap } from "./index";

const keys = (map: TranslationMap, prefix = ""): string[] =>
  Object.entries(map).flatMap(([key, value]) =>
    typeof value === "string" ? [prefix + key] : keys(value, prefix + key + "."),
  );

describe("dashboard translations", () => {
  it("provides the same keys for both languages", () => {
    expect(keys(translations.zh).sort()).toEqual(keys(translations.en).sort());
  });

  it("translates labels and interpolates zero without losing it", () => {
    expect(t("logs.title", "zh")).not.toBe(t("logs.title", "en"));
    expect(t("table.range", "zh", { start: 0, end: 0, total: 0 })).toBe("显示 0–0 / 0");
    expect(t("table.range", "en", { start: 1, end: 5, total: 9 })).toBe("Showing 1-5 of 9");
  });

  it("keeps an unknown key and an unbound placeholder inspectable", () => {
    expect(t("missing.key", "zh")).toBe("missing.key");
    expect(t("table.page", "zh", { page: 1 })).toBe("第 1 / {{total}} 页");
  });
});
