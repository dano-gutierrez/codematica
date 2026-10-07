import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Server-compatible navigation with the shared action geometry and colors. */
export function ButtonLink({ label, icon: Icon, tone = "neutral", variant = "secondary", className, ...props }: Omit<ComponentProps<typeof Link>, "children"> & {
  label: string;
  icon?: LucideIcon;
  tone?: "neutral" | "info" | "assist" | "success" | "warning" | "danger";
  variant?: "secondary" | "primary" | "quiet";
}) {
  return <Link {...props} className={cn("ui-button", "ui-button-" + tone, "ui-button-" + variant, className)}>
    {Icon ? <Icon size={18} aria-hidden="true" /> : null}<span className="ui-button-label">{label}</span>
  </Link>;
}
