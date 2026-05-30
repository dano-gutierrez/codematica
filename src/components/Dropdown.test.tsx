import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

const options = [
  { value: "all", label: "All tracks", description: "Everything" },
  { value: "system-design", label: "System Design", description: "Architecture choices" },
  { value: "programming", label: "Programming", description: "Language patterns" },
];

function DropdownHarness() {
  const [value, setValue] = useState("all");

  return (
    <>
      <Dropdown label="Track" value={value} options={options} onValueChange={setValue} testId="track-filter" />
      <output data-testid="selected-track">{value}</output>
    </>
  );
}

describe("Dropdown", () => {
  it("renders the selected value and updates through the reusable menu", async () => {
    render(<DropdownHarness />);

    const trigger = screen.getByTestId("track-filter");
    expect(trigger).toHaveTextContent("Track");
    expect(trigger).toHaveTextContent("All tracks");

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
    fireEvent.click(await screen.findByRole("option", { name: "System Design" }));

    expect(screen.getByTestId("selected-track")).toHaveTextContent("system-design");
    expect(trigger).toHaveTextContent("System Design");
  });
});
