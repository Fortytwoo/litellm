import { describe, expect, it } from "vitest";
import { auditTime, record } from "./managedGateway";

describe("gateway wire data", () => {
  it("formats UTC audit timestamps in Beijing without timezone-dependent output", () => {
    expect(auditTime("2026-10-19T01:02:03Z")).toBe("2026-10-19 09:02:03");
    expect(auditTime("2026-10-19 01:02:03")).toBe("2026-10-19 09:02:03");
  });
  it("rejects non-JSON data rather than treating it as an empty catalog", () => {
    expect(record.safeParse({ models: undefined }).success).toBe(false);
    expect(record.safeParse({ models: [{ id: "assigned", enabled: true }] }).success).toBe(true);
  });
});
