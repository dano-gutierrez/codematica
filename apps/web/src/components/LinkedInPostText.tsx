"use client";

import { useLayoutEffect, useRef } from "react";
import { Bold, Italic, List, RemoveFormatting } from "lucide-react";
import { formatPostSelection, type PostFormat } from "@codematica/core/linkedin-formatting";

export function LinkedInPostText({ value, onChange, disabled, id = "linkedin-body" }: { value: string; onChange: (value: string) => void; disabled?: boolean; id?: string }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  useLayoutEffect(() => {
    if (selection.current && textarea.current) {
      textarea.current.focus();
      textarea.current.setSelectionRange(selection.current.start, selection.current.end);
      selection.current = null;
    }
  }, [value]);
  function format(style: PostFormat) {
    const field = textarea.current!;
    const result = formatPostSelection(value, field.selectionStart, field.selectionEnd, style);
    selection.current = result.text === value ? null : result;
    onChange(result.text);
    field.focus();
  }
  return <div>
    <label htmlFor={id} className="block text-sm font-semibold">Post text</label>
    <div role="group" aria-label="Post formatting" className="my-2 flex flex-wrap gap-2">
      {([{ style: "bold", label: "Bold", Icon: Bold }, { style: "italic", label: "Italic", Icon: Italic }, { style: "bullet", label: "Bullets", Icon: List }, { style: "plain", label: "Plain text", Icon: RemoveFormatting }] as const).map(({ style, label, Icon }) => <button type="button" key={style} disabled={disabled} aria-label={label} title={label} onMouseDown={(e) => e.preventDefault()} onClick={() => format(style)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#7d8b94] bg-white px-3 text-sm text-[#263238] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#007c78]"><Icon size={16} />{label}</button>)}
    </div>
    <textarea ref={textarea} id={id} data-testid={id} className="min-h-80 w-full rounded-lg border border-[#7d8b94] bg-white p-3 leading-7 text-[#263238] focus-visible:outline-2 focus-visible:outline-[#007c78]" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-describedby={`${id}-help`} />
    <p id={`${id}-help`} className="mt-2 text-xs text-[#46535d]">Select text to style it. Bold and italic use Unicode letters, which count as two characters and may be harder for screen readers. Links, hashtags, emoji and line breaks stay as text; @names do not tag people.</p>
  </div>;
}
