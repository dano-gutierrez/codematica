import Link from "next/link";
import { BookOpen, Code2, Languages, Map, Network } from "lucide-react";

export function AppHeader({ subtitle = "Learning home" }: { subtitle?: string }) {
  return (
    <header className="border-b-2 border-[#d5e2e8] bg-white px-4 py-3">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Codematica home">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78]">
            <Network className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-extrabold text-[#007c78]">Codematica</span>
            <span className="block truncate text-xs font-extrabold uppercase text-[#68737d]">{subtitle}</span>
          </span>
        </Link>

        <nav className="flex max-w-full flex-wrap items-center gap-2 pb-1 sm:pb-0" aria-label="Primary navigation">
          <NavLink href="/paths" label="Paths" color="text-[#00645f]" icon={<Map className="h-4 w-4" aria-hidden="true" />} />
          <NavLink href="/browse" label="Lessons" color="text-[#1d4e9e]" icon={<BookOpen className="h-4 w-4" aria-hidden="true" />} />
          <NavLink href="/interviews" label="Interviews" color="text-[#4b369e]" icon={<Code2 className="h-4 w-4" aria-hidden="true" />} />
          <NavLink href="/languages" label="Languages" color="text-[#7a5200]" icon={<Languages className="h-4 w-4" aria-hidden="true" />} />
          <Link href="/login" className="inline-flex min-h-10 shrink-0 items-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label, color, icon }: { href: string; label: string; color: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]">
      <span className={color}>{icon}</span>
      {label}
    </Link>
  );
}
