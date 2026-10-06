"use client";

import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { Check, BookOpen, Layers, Pencil, Volume2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyReviewRating, mergeSkillProgressLists, orderDueReviews, skillProgressSchema, type LearningPath, type ReviewRating, type SkillProgress } from "@codematica/core";
import { AppHeader } from "@/components/AppHeader";

const storageKey = "codematica:japanese-skill-progress:v1";

const ratingOptions: Array<{ rating: ReviewRating; label: string; hint: string; tone: "danger" | "warning" | "success" | "info" }> = [
  { rating: "again", label: "Again", hint: "Reset · 10 min", tone: "danger" },
  { rating: "hard", label: "Hard", hint: "Step back · 1 day", tone: "warning" },
  { rating: "good", label: "Good", hint: "Step forward", tone: "success" },
  { rating: "easy", label: "Easy", hint: "Jump ahead", tone: "info" },
];

function readStoredProgress(): SkillProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function syncStoredProgress(rows: SkillProgress[]) {
  for (let offset = 0; offset < rows.length; offset += 20) {
    const response = await fetch("/api/progress/skills", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: rows.slice(offset, offset + 20) }) });
    if (!response.ok) return false;
  }
  return true;
}

async function loadRemoteProgress() {
  const response = await fetch("/api/progress/skills");
  if (!response.ok) return [];
  const payload = await response.json();
  if (!payload?.isSignedIn || !Array.isArray(payload.items)) return [];
  return payload.items.flatMap((item: unknown) => {
    const parsed = skillProgressSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function JapaneseReview({ learningPath, hasListening = false }: { learningPath: LearningPath; hasListening?: boolean }) {
  const skills = learningPath.progression?.skills ?? [];
  const [storageFailed, setStorageFailed] = useState(false);
  const persist = useCallback((rows: SkillProgress[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(rows));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, []);
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id ?? "");
  const [sessionRatings, setSessionRatings] = useState<Partial<Record<string, ReviewRating>>>({});
  const progressRef = useRef<SkillProgress[]>([]);
  const ratedSkillsRef = useRef(new Set<string>());

  useEffect(() => {
    const stored = readStoredProgress();
    progressRef.current = stored;
    queueMicrotask(() => setProgress(stored));
    void loadRemoteProgress()
      .then(async (remote) => {
        const merged = mergeSkillProgressLists(progressRef.current, remote);
        if (!merged.length) return;
        progressRef.current = merged;
        setProgress(merged);
        persist(merged);
        await syncStoredProgress(merged);
      })
      .catch(() => false);
  }, [persist]);

  const due = useMemo(() => orderDueReviews(progress), [progress]);
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];
  const selectedProgress = progress.find((row) => row.pathSlug === learningPath.slug && row.skillId === selectedSkill?.id);
  const selectedRating = selectedSkill ? sessionRatings[selectedSkill.id] : undefined;

  function rate(rating: ReviewRating) {
    if (!selectedSkill) return;
    if (ratedSkillsRef.current.has(selectedSkill.id)) return;
    ratedSkillsRef.current.add(selectedSkill.id);
    const current = progressRef.current.find((row) => row.pathSlug === learningPath.slug && row.skillId === selectedSkill.id);
    const next = applyReviewRating(current, {
      pathSlug: learningPath.slug,
      skillId: selectedSkill.id,
      rating,
      score: rating === "again" ? 0.4 : rating === "hard" ? 0.65 : rating === "good" ? 0.85 : 1,
      now: new Date(),
    });
    const rows = [...progressRef.current.filter((row) => !(row.pathSlug === learningPath.slug && row.skillId === selectedSkill.id)), next];
    progressRef.current = rows;
    setProgress(rows);
    setSessionRatings((currentRatings) => ({ ...currentRatings, [selectedSkill.id]: rating }));
    persist(rows);
    void syncStoredProgress(rows).catch(() => false);
  }

  function resetRating() {
    if (!selectedSkill) return;
    ratedSkillsRef.current.delete(selectedSkill.id);
    setSessionRatings((currentRatings) => {
      const nextRatings = { ...currentRatings };
      delete nextRatings[selectedSkill.id];
      return nextRatings;
    });
  }

  return (
    <main className="min-h-screen pb-12" data-testid="japanese-review-browser">
      <AppHeader subtitle="Japanese review" />
      <section className="ui-page">
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#263238] sm:text-4xl">Ready to review</h1>
        <p className="mt-4 max-w-3xl text-base font-normal leading-7 text-[#53616c]">
          Recall an example, then rate how much help you needed. Ratings save on this device.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/languages/japanese" label="Open dictionary" icon={BookOpen} />
          <ButtonLink href="/languages/japanese/review/flashcards" label="N5 flashcards" icon={Layers} tone="info" />
          <ButtonLink href="/languages/japanese/review/writing" label="Open-answer writing" icon={Pencil} tone="info" />
          {hasListening ? <ButtonLink href="/languages/japanese/review/listening" label="Listening practice" icon={Volume2} tone="info" /> : null}
        </div>

        {storageFailed && !selectedRating ? <div role="status" className="ui-notice mt-4"><p>Couldn't save on this device. Keep this page open and retry.</p><Button label="Retry saving" icon={RotateCcw} tone="warning" onClick={() => persist(progressRef.current)} /></div> : null}
        <div className="ui-columns mt-8 gap-6">
          <section aria-labelledby="review-skills-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#53616c]">{due.length} due now</p>
                <h2 id="review-skills-title" className="text-2xl font-semibold text-[#263238]">All skill cards</h2>
              </div>
              <RotateCcw className="h-6 w-6 text-[#007c78]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {skills.map((skill) => {
                const row = progress.find((item) => item.skillId === skill.id && item.pathSlug === learningPath.slug);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkillId(skill.id)}
                    aria-pressed={selectedSkill?.id === skill.id}
                    className="min-h-14 rounded-xl border border-[#b9cbd3] bg-white p-4 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78] aria-pressed:border-[#007c78] aria-pressed:bg-[#e8f8f6]"
                  >
                    <span className="block text-base font-semibold text-[#263238]">{skill.label}</span>
                    <span className="mt-1 block text-sm font-normal leading-6 text-[#53616c]">{row ? `Box ${row.reviewBox} · ${row.masteryState}` : "New · available now"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedSkill ? (
            <section className="min-w-0 self-start border-t border-[#d5e2e8] pt-5" aria-live="polite">
              <p className="text-sm font-semibold uppercase text-[#7a5200]">{selectedSkill.category} practice</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#263238]">{selectedSkill.label}</h2>
              <p className="mt-3 text-base font-normal leading-7 text-[#53616c]">{selectedSkill.description}</p>
              <div className="mt-6 border-l-2 border-[#7d8b94] pl-4">
                <p className="text-lg font-semibold text-[#263238]">Recall before you reveal</p>
                <p className="mt-2 text-base font-normal leading-7 text-[#53616c]">Recall one example you can recognize or use for this skill. Then rate how much help you needed.</p>
              </div>
              <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3" aria-label="Review rating">
                {ratingOptions.map((option) => {
                  const isSelected = selectedRating === option.rating;
                  return (
                    <div key={option.rating} className="grid min-w-0 gap-2">
                      <Button label={option.label} icon={isSelected ? Check : undefined} tone={option.tone} aria-pressed={isSelected} disabled={Boolean(selectedRating)}
                        data-testid={`japanese-review-rating-${option.rating}`} onClick={() => rate(option.rating)} />
                      <span className="text-center text-sm text-[#52616c]">{isSelected ? "Selected" : option.hint}</span>
                    </div>
                  );
                })}
              </div>
              {selectedRating ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#87cfc9] bg-[#e8f8f6] p-3" role="status">
                  <p className="text-sm font-semibold text-[#005f5c]">
                    {ratingOptions.find((option) => option.rating === selectedRating)?.label} {storageFailed ? "recorded. Couldn't save on this device. Keep this page open and retry." : "saved. This recall counts as one attempt."}
                  </p>
                  {storageFailed ? <Button label="Retry saving" icon={RotateCcw} tone="warning" onClick={() => persist(progressRef.current)} /> : null}
                  <Button label="Practice again" icon={RotateCcw} tone="warning" onClick={resetRating} />
                </div>
              ) : null}
              {selectedProgress ? <p className="mt-4 text-sm font-medium text-[#53616c]">Best {Math.round(selectedProgress.bestScore * 100)}% · box {selectedProgress.reviewBox} · next {new Date(selectedProgress.nextReviewAt).toLocaleString()}</p> : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
