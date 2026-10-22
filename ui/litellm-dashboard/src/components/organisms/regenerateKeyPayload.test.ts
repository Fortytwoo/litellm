import { describe, expect, it } from "vitest";
import { buildRegenerateKeyPayload, type RegenerateKeyFormValues } from "./regenerateKeyPayload";

const values = (overrides: Partial<RegenerateKeyFormValues> = {}): RegenerateKeyFormValues => ({
  key_alias: "my-test-key",
  max_budget: 100,
  tpm_limit: 5000,
  rpm_limit: 500,
  duration: "30d",
  grace_period: "",
  ...overrides,
});

describe("buildRegenerateKeyPayload", () => {
  it("preserves converted budget precision and every other field", () => {
    expect(buildRegenerateKeyPayload(values({ max_budget: 42.567, tpm_limit: 12.7, rpm_limit: 9.99 }))).toStrictEqual({
      key_alias: "my-test-key",
      max_budget: 42.567,
      tpm_limit: 12.7,
      rpm_limit: 9.99,
      duration: "30d",
      grace_period: "",
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("passes a %s max_budget through without coercing it to a number", (_label, budget) => {
    expect(buildRegenerateKeyPayload(values({ max_budget: budget })).max_budget).toBe(budget);
  });

  it("keeps unset fields as undefined so the request body omits them", () => {
    const payload = buildRegenerateKeyPayload(
      values({ key_alias: undefined, max_budget: undefined, tpm_limit: undefined, rpm_limit: undefined }),
    );

    expect(payload).toStrictEqual({
      key_alias: undefined,
      max_budget: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      duration: "30d",
      grace_period: "",
    });
    expect(JSON.stringify(payload)).toBe('{"duration":"30d","grace_period":""}');
  });

  it("preserves the field order the proxy request body is serialised in", () => {
    expect(Object.keys(buildRegenerateKeyPayload(values({ max_budget: 1.239 })))).toStrictEqual([
      "key_alias",
      "max_budget",
      "tpm_limit",
      "rpm_limit",
      "duration",
      "grace_period",
    ]);
  });

  it("does not mutate the values it is handed", () => {
    const original = values({ max_budget: 42.567 });

    buildRegenerateKeyPayload(original);

    expect(original.max_budget).toBe(42.567);
  });
});
