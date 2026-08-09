import { getContentIndex, type QuestionnaireExercise } from "@codematica/core";
import { JapanesePracticeModeScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../../src/lib/adapters";

export default function JapaneseListeningRoute() {
  const index = getContentIndex(); const approved = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const exercises = index.exercises.filter((exercise): exercise is QuestionnaireExercise => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "listening-choice" && approved.has(question.audioId)));
  return <JapanesePracticeModeScreen title="Japanese listening" description="Hear short N5-aligned exchanges with replay and slow-speed controls." exercises={exercises} adapters={useCodematicaAdapters()} />;
}
