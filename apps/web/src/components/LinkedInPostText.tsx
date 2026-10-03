"use client";

import { useLayoutEffect, useRef } from "react";
import { Bold, Italic, List, RemoveFormatting } from "lucide-react";
import { formatPostSelection, type PostFormat } from "@codematica/core/linkedin-formatting";
import { Button } from "./Button";

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
  return <div className="editorial-composer">
    <div className="editorial-formatbar">
      <label htmlFor={id}>Post text</label>
      <div role="group" aria-label="Post formatting" className="ui-actions">
        {([{ style: "bold", label: "Bold", Icon: Bold }, { style: "italic", label: "Italic", Icon: Italic }, { style: "bullet", label: "Bullets", Icon: List }, { style: "plain", label: "Plain text", Icon: RemoveFormatting }] as const).map(({ style, label, Icon }) => <Button key={style} label={label} icon={Icon} iconOnly variant="quiet" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => format(style)} />)}
      </div>
    </div>
    <textarea ref={textarea} id={id} data-testid={id} className="editorial-post-text" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-describedby={id + "-help"} />
    <details className="editorial-format-help"><summary>Formatting tips</summary><p id={id + "-help"}>Select text, then choose a style. Bold and italic use Unicode characters and can be harder to read with assistive tools. Links, hashtags, emoji and line breaks stay as text; @names do not tag people.</p></details>
  </div>;
}
