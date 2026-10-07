import { fireEvent, render, screen } from "@testing-library/react";
import { RefreshCw } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("design system button", () => {
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
