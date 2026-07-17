"use client";

import { useRouter } from "next/navigation";
import { Chrome, Lock, Mail, UserPlus } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { clearAnonymousProgressItems, getAnonymousProgressItems } from "@/lib/progress/anonymous";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
  isAuthConfigured: boolean;
  isAppleEnabled: boolean;
  shouldSync: boolean;
};

export function LoginForm({ nextPath, isAuthConfigured, isAppleEnabled, shouldSync }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!shouldSync || !isAuthConfigured) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted || !data.user) {
        return;
      }

      syncAnonymousProgress().finally(() => {
        router.replace(nextPath);
        router.refresh();
      });
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthConfigured, nextPath, router, shouldSync]);

  async function signInWithProvider(provider: "google" | "apple") {
    if (!isAuthConfigured) {
      setError("Auth is not configured for this environment.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError("Auth is not configured for this environment.");
      return;
    }

    setError(undefined);
    setStatus(undefined);
    setIsBusy(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setIsBusy(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthConfigured) {
      setError("Auth is not configured for this environment.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setError("Auth is not configured for this environment.");
      return;
    }

    setError(undefined);
    setStatus(undefined);
    setIsBusy(true);

    const authResult =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
          });

    if (authResult.error) {
      setError(authResult.error.message);
      setIsBusy(false);
      return;
    }

    if (mode === "sign-up" && !authResult.data.session) {
      setStatus("Check your email to confirm your account.");
      setIsBusy(false);
      return;
    }

    await syncAnonymousProgress();
    router.replace(nextPath);
    router.refresh();
  }

  const disabled = isBusy || !isAuthConfigured;

  return (
    <section className="mx-auto w-full max-w-md rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7" data-testid="login-form">
      <div>
        <p className="text-sm font-extrabold uppercase text-[#007c78]">Save your path</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-[#263238]">Sign in to keep reading.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#68737d]">Sync your latest documents, practice, and interview progress across devices.</p>
      </div>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void signInWithProvider("google")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238] disabled:opacity-60"
        >
          <Chrome className="h-4 w-4 text-[#245fba]" aria-hidden="true" />
          Continue with Google
        </button>

        {isAppleEnabled ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void signInWithProvider("apple")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#263238] bg-[#263238] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
          >
            Continue with Apple
          </button>
        ) : null}
      </div>

      <div className="my-6 h-0.5 bg-[#e4edf1]" />

      <form className="grid gap-3" onSubmit={(event) => void handleEmailSubmit(event)}>
        <label className="grid gap-1 text-xs font-extrabold uppercase text-[#68737d]">
          Email
          <span className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
            <input
              type="email"
              required
              disabled={disabled}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white pl-10 pr-3 text-sm font-bold normal-case text-[#263238] outline-none focus:border-[#007c78] disabled:opacity-60"
            />
          </span>
        </label>

        <label className="grid gap-1 text-xs font-extrabold uppercase text-[#68737d]">
          Password
          <span className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
            <input
              type="password"
              required
              minLength={6}
              disabled={disabled}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white pl-10 pr-3 text-sm font-bold normal-case text-[#263238] outline-none focus:border-[#007c78] disabled:opacity-60"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
        >
          {mode === "sign-in" ? <Mail className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          {mode === "sign-in" ? "Sign in with email" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm font-extrabold text-[#245fba]"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "Create an account" : "Use an existing account"}
      </button>

      {!isAuthConfigured ? <p className="mt-4 rounded-lg bg-[#fff5d6] p-3 text-sm font-bold text-[#7a5200]">Auth is not configured for this environment.</p> : null}
      {status ? <p className="mt-4 rounded-lg bg-[#e8f8f6] p-3 text-sm font-bold text-[#007c78]">{status}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-[#ffe8ed] p-3 text-sm font-bold text-[#a01632]">{error}</p> : null}
    </section>
  );
}

async function syncAnonymousProgress() {
  const items = getAnonymousProgressItems();

  if (items.length === 0) {
    return;
  }

  const response = await fetch("/api/progress/sync-anonymous", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ items: items.map((item) => item.input) }),
  });

  if (response.ok) {
    clearAnonymousProgressItems();
  }
}
