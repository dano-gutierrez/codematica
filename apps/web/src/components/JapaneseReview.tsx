"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { applyReviewRating, mergeSkillProgressLists, orderDueReviews, skillProgressSchema, type ContentIndex, type LearningPath, type ReviewRating, type SkillProgress } from "@codematica/core";
import { AppHeader } from "@/components/AppHeader";

const storageKey = "codematica:japanese-skill-progress:v1";

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

export function JapaneseReview({ index, learningPath }: { index: ContentIndex; learningPath: LearningPath }) {
  const skills = learningPath.progression?.skills ?? [];
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id ?? "");

  useEffect(() => {
    const stored = readStoredProgress();
    queueMicrotask(() => setProgress(stored));
    void loadRemoteProgress()
      .then(async (remote) => {
        const merged = mergeSkillProgressLists(stored, remote);
        if (!merged.length) return;
        setProgress(merged);
        window.localStorage.setItem(storageKey, JSON.stringify(merged));
        await syncStoredProgress(merged);
      })
      .catch(() => false);
  }, []);

  const due = useMemo(() => orderDueReviews(progress), [progress]);
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];
  const selectedProgress = progress.find((row) => row.pathSlug === learningPath.slug && row.skillId === selectedSkill?.id);
  const flashcards = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === learningPath.slug && feed.status === "published");

  function rate(rating: ReviewRating) {
    if (!selectedSkill) return;
    const next = applyReviewRating(selectedProgress, {
      pathSlug: learningPath.slug,
      skillId: selectedSkill.id,
      rating,
      score: rating === "again" ? 0.4 : rating === "hard" ? 0.65 : rating === "good" ? 0.85 : 1,
      now: new Date(),
    });
    const rows = [...progress.filter((row) => !(row.pathSlug === learningPath.slug && row.skillId === selectedSkill.id)), next];
    setProgress(rows);
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
    void syncStoredProgress(rows).catch(() => false);
  }

  return (
    <main className="min-h-screen pb-12" data-testid="japanese-review-browser">
      <AppHeader subtitle="Japanese review" />
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <p className="text-sm font-extrabold uppercase text-[#7a5200]">Always open</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight text-[#263238] sm:text-6xl">Review what is ready.</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#53616c]">
          The due queue recommends practice; it never hides lessons, handwriting, the dictionary, or flashcards. Ratings are saved on this device immediately.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {flashcards ? (
            <Link href={flashcards.route} className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-base font-extrabold text-white">
              Browse all flashcards
            </Link>
          ) : null}
          <Link href="/languages/japanese" className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#b9cbd3] bg-white px-4 py-2 text-base font-extrabold text-[#263238]">Open dictionary</Link>
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
              <p className="text-sm font-extrabold uppercase text-[#7a5200]">{selectedSkill.skill} practice</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#263238]">{selectedSkill.label}</h2>
              <p className="mt-3 text-base font-semibold leading-7 text-[#53616c]">{selectedSkill.description}</p>
              <div className="mt-6 rounded-lg border-2 border-dashed border-[#d2bd76] bg-white p-5">
                <p className="text-lg font-extrabold text-[#263238]">Recall before you reveal</p>
                <p className="mt-2 text-base font-semibold leading-7 text-[#53616c]">Name one example you can recognize or use for this skill. Then rate how independently you recalled it.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Review rating">
                {(["again", "hard", "good", "easy"] as const).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    aria-label={rating.charAt(0).toUpperCase() + rating.slice(1)}
                    onClick={() => rate(rating)}
                    className="min-h-12 rounded-lg border-2 border-b-4 border-[#b9cbd3] bg-white px-3 py-2 text-base font-extrabold capitalize text-[#263238] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]"
                  >
                    {rating}
                  </button>
                ))}
              </div>
              {selectedProgress ? <p className="mt-4 text-sm font-bold text-[#53616c]">Best {Math.round(selectedProgress.bestScore * 100)}% · box {selectedProgress.reviewBox} · next {new Date(selectedProgress.nextReviewAt).toLocaleString()}</p> : null}
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
