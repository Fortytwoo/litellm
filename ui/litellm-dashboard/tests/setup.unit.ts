import { beforeEach, vi } from "vitest";
import { setActiveLocale } from "@/i18n";
import { z } from "zod";

beforeEach(() => {
  setActiveLocale("en");
  z.config(z.locales.en());
});

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    dismiss: vi.fn(),
  },
}));
