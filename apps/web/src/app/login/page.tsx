import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { hasSupabasePublicEnv, isAppleAuthEnabled } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    sync?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, sync } = await searchParams;
  const nextPath = sanitizeNextPath(Array.isArray(next) ? next[0] : next);
  const shouldSync = (Array.isArray(sync) ? sync[0] : sync) === "1";

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="login-page">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Paths
        </Link>

        <div className="mt-8">
          <LoginForm nextPath={nextPath} isAuthConfigured={hasSupabasePublicEnv()} isAppleEnabled={isAppleAuthEnabled()} shouldSync={shouldSync} />
        </div>
      </div>
    </main>
  );
}

function sanitizeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}
