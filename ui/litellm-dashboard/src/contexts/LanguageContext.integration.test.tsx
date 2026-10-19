import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "./LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DataTablePagination } from "@/components/shared/DataTable/DataTablePagination";
import { DateCell } from "@/components/shared/table_cells/date_cell";
import { useState } from "react";
import { DurationInput } from "@/components/shared/DurationInput";
import { SimpleMessageBlock } from "@/components/logs/detail/SimpleMessageBlock";
import { CollapsibleMessage } from "@/components/logs/detail/CollapsibleMessage";
import { TimeRangeControls } from "@/components/shared/timeRange/TimeRangeControls";
import AdvancedDatePicker from "@/components/shared/advanced_date_picker";

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

function DetailFixture() {
  const [duration, setDuration] = useState(90);
  return (
    <LanguageProvider>
      <LanguageSwitcher />
      <DurationInput label="TTL" value={duration} onChange={setDuration} base="minutes" />
      <output aria-label="stored minutes">{duration}</output>
      <SimpleMessageBlock label="USER" content={conversation} />
      <CollapsibleMessage label="SYSTEM" content="test" />
      <TimeRangeControls
        range={{ hours: 6, anchorMs: null }}
        zoom={null}
        onHoursChange={() => undefined}
        onLiveChange={() => undefined}
      />
      <AdvancedDatePicker value={{}} onValueChange={() => undefined} />
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

  it("switches message labels, duration units and time presets without changing form values or content", () => {
    render(<DetailFixture />);
    expect(screen.getByText("用户", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("系统", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("（4 个字符）")).toBeInTheDocument();
    expect(screen.getByTestId("time-range-trigger")).toHaveTextContent("最近 6 小时");
    expect(screen.getByRole("button", { name: "选择日期范围" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "TTL" }), { target: { value: "120" } });
    expect(screen.getByRole("combobox", { name: "TTL单位" })).toHaveValue("1");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByText("USER", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("(4 chars)")).toBeInTheDocument();
    expect(screen.getByTestId("time-range-trigger")).toHaveTextContent("Last 6 hours");
    expect(screen.getByRole("button", { name: "Select date range" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "TTL unit" })).toHaveValue("1");
    expect(screen.getByRole("spinbutton", { name: "TTL" })).toHaveValue(120);
    expect(screen.getByLabelText("stored minutes")).toHaveTextContent("120");
    expect(screen.getByText(conversation)).toBeInTheDocument();
  });
});
