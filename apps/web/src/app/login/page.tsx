import { ButtonLink } from "@/components/ButtonLink";
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
    <main className="ui-page min-h-screen" data-testid="login-page">
      <div className="mx-auto w-full max-w-5xl">
        <ButtonLink href="/" label="Home" icon={ArrowLeft} variant="quiet" />

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
