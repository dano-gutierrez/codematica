import { getContentIndex, type QuestionnaireExercise } from "@codematica/core";
import { JapanesePracticeModeScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../../src/lib/adapters";

export default function JapaneseWritingRoute() {
  const exercises = getContentIndex().exercises.filter((exercise): exercise is QuestionnaireExercise => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "open-answer"));
  return <JapanesePracticeModeScreen title="Japanese open-answer writing" description="Type romaji and choose a Japanese conversion, type Japanese directly, or use Apple Pencil Scribble in the blank on iPad." exercises={exercises} adapters={useCodematicaAdapters()} />;
}
