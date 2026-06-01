import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-12">
      <p className="text-sm font-extrabold uppercase text-[#007c78]">Not found</p>
      <h1 className="mt-3 text-4xl font-extrabold text-[#263238]">This node is outside the map.</h1>
      <p className="mt-4 text-base font-semibold leading-7 text-[#68737d]">
        The path, article, diagram, or practice prompt you opened is not part of the current Codematica content index.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit items-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white"
      >
        Back to paths
      </Link>
    </main>
  );
}
