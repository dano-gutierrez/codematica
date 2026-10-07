"use client";

import { convertJapaneseInput } from "@codematica/core/japanese-ime";
import { useId, useMemo, useState } from "react";
import { Button } from "./Button";

export function JapaneseAnswerInput({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const conversion = useMemo(() => convertJapaneseInput(draft), [draft]);
  const helpId = useId();

  function update(nextValue: string) {
    setDraft(nextValue);
    if (/[^\p{ASCII}]/u.test(nextValue)) onChange(nextValue);
  }

  function commit(candidate: string) {
    setDraft(candidate);
    onChange(candidate);
  }

  return (
    <div className="grid gap-3" data-testid="japanese-answer-input">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#53616c]">Write in romaji or Japanese</span>
        <input
          lang="ja"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          value={draft}
          disabled={disabled}
          onChange={(event) => update(event.target.value)}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && conversion.candidates[0] && /[a-z]/i.test(draft)) {
              event.preventDefault();
              commit(conversion.candidates[0]);
            }
          }}
          aria-describedby={helpId}
          className="ui-input"
          data-testid="questionnaire-open-answer-input"
        />
      </label>
      <p id={helpId} className="ui-field-hint">
        Choose a conversion below, or press Enter. iPad Scribble works in this field.
      </p>
      {/[a-z]/i.test(draft) && conversion.candidates.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Japanese conversion candidates" data-testid="japanese-ime-candidates">
          {conversion.candidates.map((candidate, index) => (
            <Button label={candidate} tone="info"
              key={candidate}
              type="button"
              disabled={disabled}
              onClick={() => commit(candidate)}
              data-testid={`japanese-ime-candidate-${index}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
