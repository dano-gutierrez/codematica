import { getContentIndex, type ReviewRating, type SkillProgress } from "@codematica/core";
import { JapaneseReviewScreen } from "@codematica/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { createNativeSupabaseClient } from "../../../src/lib/supabase";
import { loadNativeSkillProgress, syncNativeSkillProgress } from "../../../src/lib/skill-progress";
import { createNativeReviewSave, mergeNativeReviewProgress } from "../../../src/lib/review-persistence";

export default function JapaneseReviewRoute() {
  const adapters = useCodematicaAdapters();
  const supabase = useMemo(() => createNativeSupabaseClient(), []);
  const index = getContentIndex();
  const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations");
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const mounted = useRef(true);
  const loadVersion = useRef(0);
  const saves = useRef(new Map<string, ReturnType<typeof createNativeReviewSave>>());

  const load = useCallback(() => {
    const version = ++loadVersion.current;
    const current = () => mounted.current && loadVersion.current === version;
    void (async () => {
      try {
        const local = await mergeNativeReviewProgress();
        if (!current()) return;
        setProgress(local);
        setLoadError(false);
        setLoading(false);
        // Remote availability does not delay local practice. Merge against fresh
        // device data after the request, so intervening recalls remain intact.
        const remote = await loadNativeSkillProgress(supabase).catch(() => []);
        if (!current()) return;
        const rows = await mergeNativeReviewProgress(remote);
        if (!current()) return;
        setProgress(rows);
        void syncNativeSkillProgress(supabase, rows).catch(() => false);
      } catch {
        if (current()) { setLoadError(true); setLoading(false); }
      }
    })();
  }, [supabase]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  function reload() {
    saves.current.clear();
    setLoading(true);
    setLoadError(false);
    load();
  }

  async function onRate(skillId: string, rating: ReviewRating) {
    if (!learningPath) return;
    let save = saves.current.get(skillId);
    if (!save) {
      save = createNativeReviewSave(learningPath.slug, skillId, rating);
      saves.current.set(skillId, save);
    }
    const rows = await save();
    saves.current.delete(skillId);
    if (mounted.current) setProgress(rows);
    // "Saved" acknowledges local storage; rejected optional sync keeps that copy.
    void syncNativeSkillProgress(supabase, rows).catch(() => false);
  }

  if (!learningPath) return null;
  const approvedAudio = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const hasListening = index.exercises.some((exercise) => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "listening-choice" && approvedAudio.has(question.audioId)));
  return <JapaneseReviewScreen learningPath={learningPath} progress={progress} onRate={onRate} adapters={adapters} hasListening={hasListening} loading={loading} loadError={loadError} onReload={reload} />;
}
