import { describe, expect, it } from "vitest";
import { userDisplayLabel, userSelectionLabel } from "./userDisplay";

describe("user identity labels", () => {
  it("prefers trimmed names over email and keeps duplicate names distinguishable", () => {
    const first = { user_id: "member-1", user_alias: " Reviewer ", user_email: "first@example.test" };
    expect(userDisplayLabel(first)).toBe("Reviewer");
    expect(userSelectionLabel(first)).toBe("Reviewer (member-1)");
    expect(userSelectionLabel({ ...first, user_id: "member-2" })).toBe("Reviewer (member-2)");
  });
  it("falls back to email then exact IDs without inventing names", () => {
    expect(userDisplayLabel({ user_id: "external-subject", user_alias: " ", user_email: " user@example.test " })).toBe(
      "user@example.test",
    );
    expect(userSelectionLabel({ user_id: "external-subject", user_alias: null })).toBe("external-subject");
  });
});
