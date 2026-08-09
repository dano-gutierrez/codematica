"use client";

import { convertJapaneseInput } from "@codematica/core/japanese-ime";
import { useMemo, useState } from "react";

export function JapaneseAnswerInput({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const conversion = useMemo(() => convertJapaneseInput(draft), [draft]);

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
        <span className="text-sm font-extrabold text-[#53616c]">Write in romaji or Japanese</span>
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
          aria-describedby="japanese-answer-help"
          className="min-h-14 rounded-xl border-2 border-b-4 border-[#b9cbd3] bg-white px-4 text-xl font-extrabold text-[#263238] outline-none focus:border-[#007c78] disabled:opacity-70"
          data-testid="questionnaire-open-answer-input"
        />
      </label>
      <p id="japanese-answer-help" className="text-sm font-semibold leading-6 text-[#53616c]">
        Choose a conversion below. On iPad, you can write directly in this blank with Apple Pencil Scribble.
      </p>
      {/[a-z]/i.test(draft) && conversion.candidates.length ? (
        <div className="flex flex-wrap gap-2" aria-label="Japanese conversion candidates" data-testid="japanese-ime-candidates">
          {conversion.candidates.map((candidate, index) => (
            <button
              key={candidate}
              type="button"
              disabled={disabled}
              onClick={() => commit(candidate)}
              className="min-h-11 rounded-lg border-2 border-b-4 border-[#9cc7ff] bg-[#f5f9ff] px-4 text-lg font-extrabold text-[#1d4e9e]"
              data-testid={`japanese-ime-candidate-${index}`}
            >
              {candidate}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
