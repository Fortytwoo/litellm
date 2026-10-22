import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { FormField } from "./form/FormField";
import { Input } from "@/components/ui/input";
import { CnyInput } from "./CnyInput";

it.each(["number", "text"])("keeps decimal typing intact for %s monetary form fields", async (type) => {
  function Harness() {
    const form = useForm({ defaultValues: { input_cost: "" } });
    return (
      <>
        <FormField control={form.control} name="input_cost" label="Price (CNY)">
          {(field) => <Input {...field} type={type} step={0.01} />}
        </FormField>
        <output>{form.watch("input_cost")}</output>
      </>
    );
  }
  render(<Harness />);
  const user = userEvent.setup();
  const input = screen.getByLabelText("Price (CNY)");
  await user.type(input, "20.4");
  expect(input).toHaveValue(type === "number" ? 20.4 : "20.4");
  expect(input).toBeValid();
  expect(screen.getByRole("status")).toHaveTextContent("3");
});

it("keeps partial yuan input while editing and exposes dollar amounts to its parent", () => {
  function Harness() {
    const [value, setValue] = useState<number | null>(100);
    return (
      <>
        <CnyInput aria-label="Amount (CNY)" usdValue={value} onUsdChange={setValue} />
        <output>{value}</output>
      </>
    );
  }
  render(<Harness />);
  const input = screen.getByRole("textbox", { name: "Amount (CNY)" });
  expect(input).toHaveValue("680");
  fireEvent.change(input, { target: { value: "0." } });
  expect(input).toHaveValue("0.");
  fireEvent.change(input, { target: { value: "0.0068" } });
  expect(screen.getByRole("status")).toHaveTextContent("0.001");
  fireEvent.blur(input);
  expect(input).toHaveValue("0.0068");
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.blur(input);
  expect(input).toHaveValue("");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});
