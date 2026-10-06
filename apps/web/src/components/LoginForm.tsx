"use client";

import { useRouter } from "next/navigation";
import { Apple, Chrome, Lock, Mail, RefreshCw, UserPlus } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { syncBufferedAnonymousProgress } from "@/lib/progress/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "./Button";

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
  const [syncPending, setSyncPending] = useState(false);
  const requestPending = useRef(false);

  useEffect(() => {
    if (!shouldSync || !isAuthConfigured) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getUser().then(async ({ data }) => {
      if (!isMounted || !data.user) return;
      try {
        if (!await syncBufferedAnonymousProgress()) throw new Error("Progress sync failed");
        if (isMounted) { router.replace(nextPath); router.refresh(); }
      } catch {
        if (isMounted) { setSyncPending(true); setError("You're signed in, but your local progress hasn't synced. Try again or continue; your progress stays on this device."); }
      }
    }).catch(() => { if (isMounted) setError("Couldn't check your account. Please try signing in again."); });

    return () => {
      isMounted = false;
    };
  }, [isAuthConfigured, nextPath, router, shouldSync]);

  async function finishSignIn() {
    try {
      if (!await syncBufferedAnonymousProgress()) throw new Error("Progress sync failed");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setSyncPending(true);
      setError("You're signed in, but your local progress hasn't synced. Try again or continue; your progress stays on this device.");
    }
  }

  async function signInWithProvider(provider: "google" | "apple") {
    if (requestPending.current) return;
    const supabase = isAuthConfigured ? createBrowserSupabaseClient() : undefined;
    if (!supabase) { setError("Sign-in is not set up here."); return; }
    setError(undefined);
    setStatus(undefined);
    setIsBusy(true);
    requestPending.current = true;
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
      if (authError) { setError(authError.message); setIsBusy(false); requestPending.current = false; }
    } catch {
      setError("Couldn't open sign-in. Please try again.");
      setIsBusy(false);
      requestPending.current = false;
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestPending.current) return;
    const supabase = isAuthConfigured ? createBrowserSupabaseClient() : undefined;
    if (!supabase) { setError("Sign-in is not set up here."); return; }
    setError(undefined);
    setStatus(undefined);
    setIsBusy(true);
    requestPending.current = true;
    try {
      const authResult = mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` } });
      if (authResult.error) { setError(authResult.error.message); return; }
      if (mode === "sign-up" && !authResult.data.session) { setStatus("Check your email to confirm your account."); return; }
      await finishSignIn();
    } catch { setError("Couldn't complete sign-in. Please try again."); }
    finally { requestPending.current = false; setIsBusy(false); }
  }

  async function retrySync() {
    if (requestPending.current) return;
    requestPending.current = true;
    setIsBusy(true);
    setError(undefined);
    try { await finishSignIn(); }
    finally { requestPending.current = false; setIsBusy(false); }
  }

  const disabled = isBusy || !isAuthConfigured;

  return <section className="ui-auth-panel" data-testid="login-form" aria-labelledby="login-title">
    <header className="ui-page-heading">
      <h1 id="login-title">{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
      <p>Keep your learning progress across devices.</p>
    </header>
    {!syncPending ? <>
      <div className="ui-auth-providers">
        <Button label="Continue with Google" icon={Chrome} disabled={disabled} onClick={() => void signInWithProvider("google")} data-testid="login-google" />
        {isAppleEnabled ? <Button label="Continue with Apple" icon={Apple} disabled={disabled} onClick={() => void signInWithProvider("apple")} data-testid="login-apple" /> : null}
      </div>
      <div className="ui-auth-divider"><span>or use email</span></div>
      <form className="ui-form" onSubmit={(event) => void handleEmailSubmit(event)} aria-busy={isBusy}>
        <label className="ui-field">Email<span className="ui-field-icon"><Mail size={18} aria-hidden="true" /><input type="email" required autoComplete="email" inputMode="email" disabled={disabled} value={email} onChange={(event) => setEmail(event.target.value)} className="ui-input" data-testid="login-email" /></span></label>
        <label className="ui-field">Password<span className="ui-field-icon"><Lock size={18} aria-hidden="true" /><input type="password" required minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} aria-describedby={mode === "sign-up" ? "password-hint" : undefined} disabled={disabled} value={password} onChange={(event) => setPassword(event.target.value)} className="ui-input" data-testid="login-password" /></span></label>
        {mode === "sign-up" ? <p className="ui-field-hint" id="password-hint">Use at least 6 characters.</p> : null}
        <Button type="submit" label={mode === "sign-in" ? "Sign in with email" : "Create account"} icon={mode === "sign-in" ? Mail : UserPlus} tone="success" variant="primary" disabled={disabled} data-testid="login-submit" />
      </form>
      <Button label={mode === "sign-in" ? "Create an account" : "Use an existing account"} tone="info" variant="quiet" disabled={isBusy} onClick={() => { setMode(value => value === "sign-in" ? "sign-up" : "sign-in"); setError(undefined); setStatus(undefined); }} data-testid="login-mode" />
    </> : <div className="ui-actions">
      <Button label="Retry sync" icon={RefreshCw} tone="warning" disabled={isBusy} onClick={() => void retrySync()} data-testid="login-retry-sync" />
      <Button label="Continue" tone="success" variant="primary" disabled={isBusy} onClick={() => { router.replace(nextPath); router.refresh(); }} data-testid="login-continue" />
    </div>}
    {!isAuthConfigured ? <p className="ui-notice ui-notice-warning">Sign-in is not set up here. You can keep learning on this device.</p> : null}
    {status ? <p className="ui-notice ui-notice-success" role="status">{status}</p> : null}
    {error ? <p className="ui-notice ui-notice-danger" role="alert">{error}</p> : null}
  </section>;

}
