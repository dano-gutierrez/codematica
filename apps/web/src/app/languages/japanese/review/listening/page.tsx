import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getContentIndex } from "@/lib/content";

export default function JapaneseListeningReviewPage() {
  const index = getContentIndex(); const approved = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const exercises = index.exercises.filter((exercise) => exercise.type === "questionnaire" && exercise.questions.some((question) => question.kind === "listening-choice" && approved.has(question.audioId)));
  return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese listening" /><section className="ui-page max-w-4xl"><ButtonLink href="/languages/japanese/review" label="Japanese review" icon={ArrowLeft} variant="quiet" /><p className="mt-5 text-sm font-semibold text-[#7a5200]">Listening practice</p><h1 className="mt-2 text-3xl font-semibold text-[#263238]">Japanese listening</h1>{exercises.length ? <div className="mt-8 grid gap-3">{exercises.map((exercise) => <Link key={exercise.slug} href={exercise.route} className="ui-result-row">{exercise.title}</Link>)}</div> : <div className="ui-notice mt-8"><p className="text-xl font-semibold text-[#263238]">Audio review is in progress.</p><p className="mt-2 font-normal leading-7 text-[#53616c]">Listening opens after pronunciation and transcripts have been reviewed by a Japanese speaker.</p></div>}</section></main>;
}
