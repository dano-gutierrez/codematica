import { fireEvent, render, screen } from "@testing-library/react";
import { RefreshCw } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";

it("allows a longer accessible name containing the visible action label", () => {
  render(<Button label="Dismiss" aria-label="Dismiss save progress prompt" />);
  expect(screen.getByRole("button", { name: "Dismiss save progress prompt" })).toHaveTextContent("Dismiss");
});

describe("design system button", () => {
  it("uses a real link for navigation and preserves path scope", () => {
    render(<ButtonLink href="/practice/cache?path=systems" label="Next activity" icon={RefreshCw} tone="success" variant="primary" />);
    expect(screen.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "/practice/cache?path=systems");
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("supports a plain labeled action without an icon", () => {
    render(<Button label="Continue" type="submit" />);
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("type", "submit");
  });
  it("names icon actions and retains standard button behavior", () => {
    const click = vi.fn();
    render(<Button label="Retry analysis" icon={RefreshCw} iconOnly tone="warning" onClick={click} />);
    const button = screen.getByRole("button", { name: "Retry analysis" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-icon-only", "true");
    expect(button).toHaveAttribute("data-tone", "warning");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });
  it("keeps disabled controls inert and primary actions explicit", () => {
    const click = vi.fn();
    render(<Button label="Approve & queue" icon={RefreshCw} variant="primary" tone="success" disabled onClick={click} />);
    const button = screen.getByRole("button", { name: "Approve & queue" });
    expect(button).toHaveTextContent("Approve & queue");
    fireEvent.click(button);
    expect(click).not.toHaveBeenCalled();
  });
  it("provides an inline touch label and dismisses the desktop tooltip without losing focus", () => {
    render(<Button label="Refine post" icon={RefreshCw} iconOnly />);
    const button = screen.getByRole("button", { name: "Refine post" });
    expect(button.querySelector(".ui-button-label")).toHaveTextContent("Refine post");
    fireEvent.pointerEnter(button);
    expect(button).toHaveAttribute("data-tooltip-open", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("data-tooltip-open", "false");
    fireEvent.pointerLeave(button);
    fireEvent.focus(button);
    expect(button).toHaveAttribute("data-tooltip-open", "true");
    fireEvent.blur(button);
    expect(button).toHaveAttribute("data-tooltip-open", "false");
  });
  it("preserves caller focus and pointer handlers while keeping tooltip dismissal independent", () => {
    const enter = vi.fn(), leave = vi.fn(), focus = vi.fn(), blur = vi.fn();
    render(<Button label="Retry" iconOnly icon={RefreshCw} onPointerEnter={enter} onPointerLeave={leave} onFocus={focus} onBlur={blur} />);
    const button = screen.getByRole("button", { name: "Retry" });
    fireEvent.pointerEnter(button); fireEvent.focus(button);
    fireEvent.keyDown(document, { key: "Enter" });
    expect(button).toHaveAttribute("data-tooltip-open", "true");
    fireEvent.pointerLeave(button); fireEvent.blur(button);
    expect(enter).toHaveBeenCalledOnce(); expect(leave).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce(); expect(blur).toHaveBeenCalledOnce();
  });
});

it("marks a pending action busy and disables it while keeping its visible name", () => {
  const press = vi.fn();
  render(<Button label="Create notebook" busy onClick={press} />);
  const button = screen.getByRole("button", { name: "Create notebook" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toHaveTextContent("Create notebook");
  fireEvent.click(button);
  expect(press).not.toHaveBeenCalled();
});
