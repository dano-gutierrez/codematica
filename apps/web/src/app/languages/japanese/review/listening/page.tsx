import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getContentIndex } from "@/lib/content";

export default function JapaneseListeningReviewPage() {
  const index = getContentIndex(); const approved = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const exercises = index.exercises.filter((exercise) => exercise.type === "questionnaire" && exercise.questions.some((question) => question.kind === "listening-choice" && approved.has(question.audioId)));
  return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese listening" /><section className="mx-auto w-full max-w-4xl px-4 py-8"><p className="text-sm font-extrabold uppercase text-[#7a5200]">Approval-gated listening</p><h1 className="mt-2 text-4xl font-extrabold text-[#263238]">Hear short N5 exchanges.</h1>{exercises.length ? <div className="mt-8 grid gap-3">{exercises.map((exercise) => <Link key={exercise.slug} href={exercise.route} className="rounded-xl border-2 border-b-4 border-[#9cc7ff] bg-[#f5f9ff] p-5 font-extrabold text-[#1d4e9e]">{exercise.title}</Link>)}</div> : <div className="mt-8 rounded-xl border-2 border-b-4 border-[#d2bd76] bg-[#fffaf0] p-6"><p className="text-xl font-extrabold text-[#263238]">Audio review is in progress.</p><p className="mt-2 font-semibold leading-7 text-[#53616c]">The N5 listening prompts and AI-generated draft clips are prepared, but they stay unavailable until a Japanese speaker approves pronunciation and transcript alignment.</p></div>}</section></main>;
}
