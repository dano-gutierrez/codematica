import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { LinkedInPostText } from "./LinkedInPostText";

it("formats the selected text, restores its selection and supports clearing styles", () => {
  function Editor() { const [value, setValue] = useState("Hello world"); return <LinkedInPostText value={value} onChange={setValue} />; }
  render(<Editor />);
  const field = screen.getByRole("textbox") as HTMLTextAreaElement;
  field.setSelectionRange(0, 5);
  fireEvent.mouseDown(screen.getByRole("button", { name: "Bold" }));
  fireEvent.click(screen.getByRole("button", { name: "Bold" }));
  expect(field).toHaveValue("𝗛𝗲𝗹𝗹𝗼 world"); expect(field.selectionEnd).toBe(10);
  fireEvent.click(screen.getByRole("button", { name: "Italic" })); expect(field).toHaveValue("𝘏𝘦𝘭𝘭𝘰 world");
  fireEvent.click(screen.getByRole("button", { name: "Plain text" })); expect(field).toHaveValue("Hello world");
  fireEvent.change(field, { target: { value: "New line" } });
  fireEvent.click(screen.getByRole("button", { name: "Bullets" })); expect(field).toHaveValue("• New line");
});

it("does not restore a stale selection on the next keystroke after a no-op style", () => {
  function Editor() { const [value, setValue] = useState("Hello"); return <LinkedInPostText value={value} onChange={setValue} />; }
  render(<Editor />);
  const field = screen.getByRole("textbox") as HTMLTextAreaElement;
  field.setSelectionRange(5, 5);
  fireEvent.click(screen.getByRole("button", { name: "Bold" }));
  fireEvent.change(field, { target: { value: "Hello!" } });
  expect(field.selectionStart).toBe(6);
  field.setSelectionRange(0, 6);
  fireEvent.click(screen.getByRole("button", { name: "Plain text" }));
  field.setSelectionRange(6, 6);
  fireEvent.change(field, { target: { value: "Hello!!" } });
  expect(field.selectionStart).toBe(7);
});
