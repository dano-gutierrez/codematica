"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Dropdown({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Choose an option",
  className,
  triggerClassName,
  testId,
  icon,
  disabled = false,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  testId?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <Select.Trigger
          aria-label={label}
          className={cn(
            "group flex h-14 min-w-0 w-full items-center justify-between gap-3 rounded-xl border border-[#7d8b94] bg-white px-4 text-left outline-none transition hover:border-[#6dd8cf] focus:border-[#007c78] focus-visible:ring-4 focus-visible:ring-[#6dd8cf]/35 disabled:cursor-default disabled:opacity-60 data-[state=open]:translate-y-0.5 data-[state=open]:border-[#007c78] data-[state=open]:border-b-2",
            triggerClassName,
          )}
          data-testid={testId}
        >
          <span className="flex min-w-0 items-center gap-3">
            {icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#b9dce7] bg-[#f6fbfc] text-[#007c78]">{icon}</span>
            ) : null}
            <span className="min-w-0">
              <span className="block text-[0.68rem] font-semibold uppercase leading-none text-[#68737d]">{label}</span>
              <span className="mt-1 block truncate text-sm font-semibold text-[#263238]">
                <Select.Value placeholder={placeholder} />
              </span>
            </span>
          </span>
          <Select.Icon asChild>
            <ChevronDown className="h-5 w-5 shrink-0 text-[#007c78] transition group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 max-w-[calc(100vw-1.5rem)] max-h-[min(var(--radix-select-content-available-height),20rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#d5e2e8] bg-white p-1 shadow-xl"
          >
            <Select.Viewport className="grid gap-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex min-h-12 cursor-pointer select-none items-center rounded-md px-10 py-2 text-sm font-semibold text-[#263238] outline-none transition data-[disabled]:pointer-events-none data-[highlighted]:bg-[#eaf7f4] data-[state=checked]:bg-[#e8f8f6] data-[disabled]:opacity-45"
                >
                  <Select.ItemIndicator className="absolute left-3 flex h-5 w-5 items-center justify-center text-[#007c78]">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Select.ItemIndicator>
                  <span className="min-w-0">
                    <Select.ItemText>{option.label}</Select.ItemText>
                    {option.description ? <span className="mt-0.5 block truncate text-xs font-medium text-[#68737d]">{option.description}</span> : null}
                  </span>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
