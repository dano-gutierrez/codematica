import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getContentIndex } from "@/lib/content";

export default function JapaneseWritingReviewPage() {
  const exercises = getContentIndex().exercises.filter((exercise) => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "open-answer"));
  return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese writing" /><section className="mx-auto w-full max-w-4xl px-4 py-8"><p className="text-sm font-extrabold uppercase text-[#7a5200]">Supplemental writing practice</p><h1 className="mt-2 text-4xl font-extrabold text-[#263238]">Write progressively harder answers.</h1><p className="mt-4 text-base font-semibold leading-7 text-[#53616c]">Type romaji and commit a Japanese conversion, type Japanese directly, or use Apple Pencil Scribble in the answer blank on iPad.</p><div className="mt-8 grid gap-3">{exercises.map((exercise, index) => <Link key={exercise.slug} href={exercise.route} className="rounded-xl border-2 border-b-4 border-[#b9cbd3] bg-white p-5"><span className="text-xs font-extrabold uppercase text-[#007c78]">Unit {index + 1}</span><span className="mt-1 block text-xl font-extrabold text-[#263238]">{exercise.title}</span><span className="mt-1 block font-semibold text-[#53616c]">{exercise.type === "questionnaire" ? exercise.questions.length : 0} open answers</span></Link>)}</div></section></main>;
}
