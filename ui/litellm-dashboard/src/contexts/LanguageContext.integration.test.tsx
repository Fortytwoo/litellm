import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "./LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DataTablePagination } from "@/components/shared/DataTable/DataTablePagination";
import { DateCell } from "@/components/shared/table_cells/date_cell";

const conversation = 'Success / Input / Output / {"role":"user","model":"deepseek-flash"}';

function AuditFixture() {
  return (
    <LanguageProvider>
      <LanguageSwitcher />
      <DataTablePagination
        page={0}
        pageSize={25}
        rowCount={100}
        onPageChange={() => undefined}
        onPageSizeChange={() => undefined}
      />
      <input aria-label="fixture note" defaultValue="keep this draft" />
      <DateCell value="2026-10-19T07:00:00Z" />
      <pre>{conversation}</pre>
    </LanguageProvider>
  );
}

describe("language switching", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("switches the table and date while preserving conversation data and input state", () => {
    render(<AuditFixture />);
    expect(screen.getByText("每页行数")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("显示 1–25 / 100");
    fireEvent.change(screen.getByRole("textbox", { name: "fixture note" }), { target: { value: "unsaved draft" } });
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("Rows per page")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-25 of 100");
    expect(screen.getByRole("textbox", { name: "fixture note" })).toHaveValue("unsaved draft");
    expect(screen.getByText(conversation)).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(screen.getByText(/Oct 19/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(screen.getByText("每页行数")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "zh-CN");
    expect(screen.getByText(conversation)).toBeInTheDocument();
  });

  it("restores the language on a fresh mount", () => {
    const first = render(<AuditFixture />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    first.unmount();
    render(<AuditFixture />);
    expect(screen.getByText("Rows per page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toBeInTheDocument();
  });
});
