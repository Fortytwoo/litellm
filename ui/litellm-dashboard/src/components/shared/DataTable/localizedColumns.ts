import type { ColumnDef } from "@tanstack/react-table";
import { translateText, type Locale } from "@/i18n";

export function localizedColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  locale: Locale,
): ColumnDef<TData, TValue>[] {
  return columns.map(
    (column) =>
      ({
        ...column,
        header: typeof column.header === "string" ? translateText(column.header, locale) : column.header,
        meta: column.meta
          ? {
              ...column.meta,
              title: column.meta.title ? translateText(column.meta.title, locale) : column.meta.title,
            }
          : undefined,
        ...("columns" in column && column.columns ? { columns: localizedColumns(column.columns, locale) } : {}),
      }) as ColumnDef<TData, TValue>,
  );
}
