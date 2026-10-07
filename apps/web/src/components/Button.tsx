"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type Ref } from "react";
import { LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  icon?: LucideIcon;
  iconOnly?: boolean;
  busy?: boolean;
  tone?: "neutral" | "info" | "assist" | "success" | "warning" | "danger";
  variant?: "secondary" | "primary" | "quiet";
};

/** Named, keyboard-accessible actions; keep consequential primary actions labeled. */
export function Button({ label, icon: Icon, iconOnly = false, busy = false, tone = "neutral", variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tooltipOpen = iconOnly && !dismissed && (hovered || focused);
  useEffect(() => {
    if (!tooltipOpen) return;
    const dismiss = (event: KeyboardEvent) => { if (event.key === "Escape") setDismissed(true); };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [tooltipOpen]);
  return <button {...props} disabled={props.disabled || busy} aria-busy={busy || props["aria-busy"]} type={type} aria-label={props["aria-label"] ?? label} data-tone={tone} data-icon-only={iconOnly} data-tooltip-open={tooltipOpen}
    onPointerEnter={(event) => { setHovered(true); setDismissed(false); props.onPointerEnter?.(event); }}
    onPointerLeave={(event) => { setHovered(false); props.onPointerLeave?.(event); }}
    onFocus={(event) => { setFocused(true); setDismissed(false); props.onFocus?.(event); }}
    onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
    className={cn("ui-button", "ui-button-" + tone, "ui-button-" + variant, iconOnly && "ui-button-icon", className)}>
    {busy ? <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin" /> : Icon ? <Icon size={18} aria-hidden="true" /> : null}
    <span className="ui-button-label" data-testid="ui-button-label">{label}</span>
    {iconOnly ? <span className="ui-button-tooltip" data-testid="ui-button-tooltip" aria-hidden="true">{label}</span> : null}
  </button>;
}
