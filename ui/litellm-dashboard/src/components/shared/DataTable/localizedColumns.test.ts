import { describe, expect, it } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { localizedColumns } from "./localizedColumns";

describe("column display language", () => {
  it("changes cached headers in either direction while preserving data access", () => {
    const accessor = (row: { model: string }) => row.model;
    const columns: ColumnDef<{ model: string }>[] = [{ id: "model", header: "Model", accessorFn: accessor }];
    const chinese = localizedColumns(columns, "zh");
    expect(chinese[0].header).toBe("模型");
    expect(chinese[0].id).toBe("model");
    expect("accessorFn" in chinese[0] && chinese[0].accessorFn).toBe(accessor);
    expect(columns[0].header).toBe("Model");
    expect(localizedColumns(chinese, "en")[0].header).toBe("Model");
    expect(accessor({ model: "Success" })).toBe("Success");
  });
});
