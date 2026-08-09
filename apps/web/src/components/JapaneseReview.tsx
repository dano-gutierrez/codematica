"use client";

import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyReviewRating, mergeSkillProgressLists, orderDueReviews, skillProgressSchema, type LearningPath, type ReviewRating, type SkillProgress } from "@codematica/core";
import { AppHeader } from "@/components/AppHeader";

const storageKey = "codematica:japanese-skill-progress:v1";

const ratingOptions: Array<{
  rating: ReviewRating;
  label: string;
  hint: string;
  idleClassName: string;
  selectedClassName: string;
}> = [
  { rating: "again", label: "Again", hint: "Reset · 10 min", idleClassName: "border-[#e4a7a7] bg-[#fff8f8]", selectedClassName: "border-[#a62f2f] bg-[#ffe1e1] text-[#702020]" },
  { rating: "hard", label: "Hard", hint: "Step back · 1 day", idleClassName: "border-[#d2bd76] bg-[#fffaf0]", selectedClassName: "border-[#8a5c00] bg-[#ffedb8] text-[#624100]" },
  { rating: "good", label: "Good", hint: "Step forward", idleClassName: "border-[#87cfc9] bg-[#f2fffd]", selectedClassName: "border-[#007c78] bg-[#d5f5f1] text-[#005f5c]" },
  { rating: "easy", label: "Easy", hint: "Jump ahead", idleClassName: "border-[#9cc7ff] bg-[#f5f9ff]", selectedClassName: "border-[#245fba] bg-[#deebff] text-[#1d4e9e]" },
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
        window.localStorage.setItem(storageKey, JSON.stringify(merged));
        await syncStoredProgress(merged);
      })
      .catch(() => false);
  }, []);

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
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
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
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <p className="text-sm font-extrabold uppercase text-[#7a5200]">Always open</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-[#263238] sm:text-6xl">Review what is ready.</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#53616c]">
          The due queue is for focused skill recall. Lessons, handwriting, the dictionary, and other practice modes stay available from their own study screens. Ratings are saved on this device immediately.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/languages/japanese" className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#b9cbd3] bg-white px-4 py-2 text-base font-extrabold text-[#263238]">Open dictionary</Link>
          <Link href="/languages/japanese/review/flashcards" className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#9cc7ff] bg-[#f5f9ff] px-4 py-2 text-base font-extrabold text-[#1d4e9e]">N5 flashcards</Link>
          <Link href="/languages/japanese/review/writing" className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#87cfc9] bg-[#e8f8f6] px-4 py-2 text-base font-extrabold text-[#005f5c]">Open-answer writing</Link>
          {hasListening ? <Link href="/languages/japanese/review/listening" className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#d2bd76] bg-[#fffaf0] px-4 py-2 text-base font-extrabold text-[#7a5200]">Listening practice</Link> : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1.15fr)]">
          <section aria-labelledby="review-skills-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#53616c]">{due.length} due now</p>
                <h2 id="review-skills-title" className="text-2xl font-extrabold text-[#263238]">All skill cards</h2>
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
                    className="min-h-14 rounded-lg border-2 border-b-4 border-[#b9cbd3] bg-white p-4 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78] aria-pressed:border-[#007c78] aria-pressed:bg-[#e8f8f6]"
                  >
                    <span className="block text-base font-extrabold text-[#263238]">{skill.label}</span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-[#53616c]">{row ? `Box ${row.reviewBox} · ${row.masteryState}` : "New · available now"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedSkill ? (
            <section className="self-start rounded-xl border-2 border-b-4 border-[#d2bd76] bg-[#fffaf0] p-5 sm:p-7" aria-live="polite">
              <p className="text-sm font-extrabold uppercase text-[#7a5200]">{selectedSkill.category} practice</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#263238]">{selectedSkill.label}</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-[#53616c]">{selectedSkill.description}</p>
              <div className="mt-6 rounded-lg border-2 border-dashed border-[#d2bd76] bg-white p-5">
                <p className="text-lg font-extrabold text-[#263238]">Recall before you reveal</p>
                <p className="mt-2 text-base font-semibold leading-7 text-[#53616c]">Name one example you can recognize or use for this skill. Then rate how independently you recalled it.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Review rating">
                {ratingOptions.map((option) => {
                  const isSelected = selectedRating === option.rating;
                  return (
                    <button
                      key={option.rating}
                      type="button"
                      aria-label={option.label}
                      aria-pressed={isSelected}
                      disabled={Boolean(selectedRating)}
                      data-testid={`japanese-review-rating-${option.rating}`}
                      onClick={() => rate(option.rating)}
                      className={`min-h-16 rounded-lg border-2 border-b-4 px-3 py-2 text-left text-[#263238] transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78] ${isSelected ? `${option.selectedClassName} translate-y-0.5 border-b-2 shadow-inner` : option.idleClassName} ${selectedRating && !isSelected ? "cursor-not-allowed opacity-45" : "hover:-translate-y-0.5 hover:border-b-[5px]"}`}
                    >
                      <span className="flex items-center gap-1.5 text-base font-extrabold">
                        {isSelected ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs font-bold opacity-80">{isSelected ? "Selected" : option.hint}</span>
                    </button>
                  );
                })}
              </div>
              {selectedRating ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-[#87cfc9] bg-[#e8f8f6] p-3" role="status">
                  <p className="text-sm font-extrabold text-[#005f5c]">
                    {ratingOptions.find((option) => option.rating === selectedRating)?.label} saved. This recall counts as one attempt.
                  </p>
                  <button type="button" onClick={resetRating} className="min-h-11 rounded-lg border-2 border-[#007c78] bg-white px-3 py-2 text-sm font-extrabold text-[#005f5c] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]">
                    Practice again
                  </button>
                </div>
              ) : null}
              {selectedProgress ? <p className="mt-4 text-sm font-bold text-[#53616c]">Best {Math.round(selectedProgress.bestScore * 100)}% · box {selectedProgress.reviewBox} · next {new Date(selectedProgress.nextReviewAt).toLocaleString()}</p> : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
