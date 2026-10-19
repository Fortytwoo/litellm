import { renderWithProviders, screen } from "../../../tests/test-utils";
import ExportSummary from "./ExportSummary";
import { fireEvent, render } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

describe("ExportSummary", () => {
  it("switches date and filter labels without changing the supplied filter identifiers", () => {
    localStorage.clear();
    const dateRange = { from: new Date(2024, 0, 1), to: new Date(2024, 0, 31) };
    const filters = ["team-a", "team-b"];
    const { container } = render(
      <LanguageProvider>
        <LanguageSwitcher />
        <ExportSummary dateRange={dateRange} selectedFilters={filters} />
      </LanguageProvider>,
    );
    expect(container).toHaveTextContent("2024/1/1 - 2024/1/31 · 2 个筛选条件");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(container).toHaveTextContent("1/1/2024 - 1/31/2024 · 2 filters");
    expect(filters).toEqual(["team-a", "team-b"]);
    expect(dateRange.from).toEqual(new Date(2024, 0, 1));
  });
  it("should render", () => {
    const dateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    };
    const { container } = renderWithProviders(<ExportSummary dateRange={dateRange} selectedFilters={[]} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it("should display the date range", () => {
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 0, 31);
    const dateRange = { from, to };
    renderWithProviders(<ExportSummary dateRange={dateRange} selectedFilters={[]} />);
    expect(screen.getByText(new RegExp(from.toLocaleDateString("en-US")))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(to.toLocaleDateString("en-US")))).toBeInTheDocument();
  });

  it("should show filter count when filters are selected", () => {
    const dateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    };
    renderWithProviders(<ExportSummary dateRange={dateRange} selectedFilters={["team-a", "team-b", "team-c"]} />);
    expect(screen.getByText(/3 filters/)).toBeInTheDocument();
  });

  it("should show singular 'filter' for one filter", () => {
    const dateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    };
    renderWithProviders(<ExportSummary dateRange={dateRange} selectedFilters={["team-a"]} />);
    expect(screen.getByText(/1 filter$/)).toBeInTheDocument();
  });

  it("should not show filter count when no filters selected", () => {
    const dateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
    };
    renderWithProviders(<ExportSummary dateRange={dateRange} selectedFilters={[]} />);
    expect(screen.queryByText(/filter/)).not.toBeInTheDocument();
  });
});
