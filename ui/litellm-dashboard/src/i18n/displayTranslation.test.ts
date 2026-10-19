import { describe, expect, it } from "vitest";
import { setActiveLocale, t, translateText, translations } from "./index";
import inflections from "./templateInflections.json";

const messages = translations.en.ui as Readonly<Record<string, string>>;
const keyFor = (message: string) => "ui." + Object.keys(messages).find((id) => messages[id] === message);

describe("display-only translation", () => {
  it("preserves unknown values, user text, identifiers and whitespace", () => {
    expect(translateText("Success / Request Logs / user-authored text", "zh")).toBe("Success / Request Logs / user-authored text");
    expect(translateText("deepseek-flash", "zh")).toBe("deepseek-flash");
    expect(translateText("  Cancel  ", "zh")).toBe("  " + t(keyFor("Cancel"), "zh") + "  ");
  });

  it("translates stored dynamic messages without interpreting captured text as a pattern", () => {
    const template = Object.entries(messages).find(([, message]) => message.includes("{{v0}}") && message.startsWith("Failed to ") && !message.includes("{{v1}}"));
    expect(template).toBeDefined();
    const [id, source] = template!;
    const payload = "account.[1]+(literal)? $value";
    expect(translateText(source.replaceAll("{{v0}}", payload), "zh")).toBe(t("ui." + id, "zh", { v0: payload }));
    expect(translateText(t("ui." + id, "zh", { v0: payload }), "en")).toBe(source.replaceAll("{{v0}}", payload));
  });

  it("removes English plural inflections from stored validation messages", () => {
    for (const [key, suffixes] of Object.entries(inflections)) {
      const english = t(key, "en");
      const values = Object.fromEntries([...english.matchAll(/\{\{(\w+)\}\}/g)].map((match) => [match[1], suffixes.includes(match[1]) ? "s" : "2"]));
      expect(translateText(t(key, "en", values), "zh")).toBe(t(key, "zh", { ...values, ...Object.fromEntries(suffixes.map((name) => [name, ""])) }));
    }
  });

  it("resolves notifications using the language at dispatch time", () => {
    setActiveLocale("en");
    const notify = () => translateText("Cancel");
    expect(notify()).toBe("Cancel");
    setActiveLocale("zh");
    expect(notify()).toBe(t(keyFor("Cancel"), "zh"));
  });
});
