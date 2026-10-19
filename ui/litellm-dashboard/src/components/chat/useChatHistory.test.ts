import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useChatHistory } from "./useChatHistory";
import { setActiveLocale } from "@/i18n";

describe("useChatHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps stored titles, model identifiers and user content independent of the UI language", () => {
    setActiveLocale("zh");
    const { result } = renderHook(() => useChatHistory(null, "alice"));
    let id = "";
    act(() => {
      id = result.current.createConversation("deepseek-flash");
    });
    expect(result.current.conversations[0].title).toBe("New conversation");
    act(() => {
      result.current.renameConversation(id, "New conversation");
    });
    act(() => {
      result.current.appendMessage(id, { role: "user", content: "Success / Input / Output" });
    });
    const expected = {
      title: "New conversation",
      customTitle: true,
      model: "deepseek-flash",
      messages: [{ role: "user", content: "Success / Input / Output" }],
    };
    expect(result.current.conversations[0]).toMatchObject(expected);
    setActiveLocale("en");
    expect(result.current.conversations[0].title).toBe("New conversation");
  });

  it("does not leak conversations between different users on the same browser", () => {
    const { result: alice } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "alice" },
    });
    act(() => {
      alice.current.createConversation("gpt-4");
    });
    expect(alice.current.conversations).toHaveLength(1);

    const { result: bob } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "bob" },
    });
    expect(bob.current.conversations).toHaveLength(0);
  });

  it("reloads conversations scoped to the new user when userId changes", () => {
    const { result, rerender } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "alice" },
    });
    act(() => {
      result.current.createConversation("gpt-4");
    });
    expect(result.current.conversations).toHaveLength(1);

    rerender({ userId: "bob" });
    expect(result.current.conversations).toHaveLength(0);

    rerender({ userId: "alice" });
    expect(result.current.conversations).toHaveLength(1);
  });
});
