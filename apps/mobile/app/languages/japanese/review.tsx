import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyReviewRating, getContentIndex, mergeSkillProgressLists, type ReviewRating, type SkillProgress } from "@codematica/core";
import { JapaneseReviewScreen } from "@codematica/ui";
import { useEffect, useMemo, useState } from "react";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { createNativeSupabaseClient } from "../../../src/lib/supabase";
import { loadNativeSkillProgress, syncNativeSkillProgress } from "../../../src/lib/skill-progress";

const storageKey = "codematica:japanese-skill-progress:v1";

export default function JapaneseReviewRoute() {
  const adapters = useCodematicaAdapters();
  const supabase = useMemo(() => createNativeSupabaseClient(), []);
  const index = getContentIndex();
  const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations");
  const [progress, setProgress] = useState<SkillProgress[]>([]);

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(storageKey), loadNativeSkillProgress(supabase)]).then(([stored, remote]) => {
      let local: SkillProgress[] = [];
      try {
        const value = JSON.parse(stored ?? "[]");
        if (Array.isArray(value)) local = value;
      } catch {
        // A malformed local cache must not block the always-available review screen.
      }
      const merged = mergeSkillProgressLists(local, remote);
      setProgress(merged);
      void AsyncStorage.setItem(storageKey, JSON.stringify(merged));
      void syncNativeSkillProgress(supabase, merged);
    });
  }, [supabase]);

  if (!learningPath) return null;

  function onRate(skillId: string, rating: ReviewRating) {
    const current = progress.find((row) => row.pathSlug === learningPath!.slug && row.skillId === skillId);
    const next = applyReviewRating(current, {
      pathSlug: learningPath!.slug,
      skillId,
      rating,
      score: rating === "again" ? 0.4 : rating === "hard" ? 0.65 : rating === "good" ? 0.85 : 1,
      now: new Date(),
    });
    const rows = [...progress.filter((row) => !(row.pathSlug === learningPath!.slug && row.skillId === skillId)), next];
    setProgress(rows);
    void AsyncStorage.setItem(storageKey, JSON.stringify(rows));
    void syncNativeSkillProgress(supabase, rows);
  }

  const approvedAudio = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const hasListening = index.exercises.some((exercise) => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "listening-choice" && approvedAudio.has(question.audioId)));
  return <JapaneseReviewScreen learningPath={learningPath} progress={progress} onRate={onRate} adapters={adapters} hasListening={hasListening} />;
}
