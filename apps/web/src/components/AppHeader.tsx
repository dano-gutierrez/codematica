"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Brain, ChevronDown, Code2, Home, Languages, Linkedin, LogOut, Map, MoreHorizontal, Network, UserRound, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAccountSession } from "@/lib/supabase/use-account-session";
import { useAdminAccess } from "@/lib/supabase/use-admin-access";
import { Button } from "./Button";

const destinations = [
  { href: "/", label: "Home", icon: Home },
  { href: "/paths", label: "Paths", icon: Map },
  { href: "/browse", label: "Lessons", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Brain },
  { href: "/interviews", label: "Interviews", icon: Code2 },
  { href: "/languages", label: "Languages", icon: Languages },
];

export function AppNavigation() {
  const admin = useAdminAccess();
  const { user, isLoading } = useAccountSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const menu = useRef<HTMLDialogElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const active = pathname.startsWith("/docs/") || pathname.startsWith("/diagrams/") ? "/browse" : `/${pathname.split("/")[1]}`;
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();
  const compactDestinations = destinations.filter(({ href }) => !["/browse", "/languages"].includes(href));
  const showAdmin = admin && !!user;
  const linkedInActive = pathname === "/admin/linkedin" || pathname.startsWith("/admin/linkedin/");
  const accountName = [user?.user_metadata.full_name, user?.user_metadata.name]
    .find((value): value is string => typeof value === "string" && !!value.trim())?.trim() || user?.email?.split("@")[0] || "Account";

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(undefined);
    try {
      const client = createBrowserSupabaseClient();
      if (!client) throw new Error("Auth unavailable");
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      menu.current?.close();
      router.replace("/");
      router.refresh();
    } catch {
      setSignOutError("Couldn't sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  function accountControl(placement: "sidebar" | "header" | "sheet") {
    if (isLoading) return <span className={placement === "header" ? "account-link" : "account-loading"} aria-label="Checking account" role="status"><UserRound size={20} aria-hidden="true" />{placement === "header" ? null : "Checking account…"}</span>;
    if (!user) return <Link href="/login" className={placement === "header" ? "account-link" : placement === "sheet" ? "sheet-link" : "app-nav-link"} aria-label="Sign in" data-testid={`${placement}-sign-in`} onClick={() => menu.current?.close()}><UserRound size={20} aria-hidden="true" />{placement === "header" ? null : <><span>Sign in</span><ArrowUpRight size={16} className="ml-auto" aria-hidden="true" /></>}</Link>;
    return <AccountMenu placement={placement} name={accountName} email={user.email} signingOut={signingOut} error={signOutError} onSignOut={() => void signOut()} />;
  }

  return (
    <>
      <a href="#app-content" className="skip-link">Skip to content</a>
      <aside className="app-sidebar">
        <Link href="/" className="app-brand" aria-label="Codematica home"><span className="app-brand-mark"><Network size={22} aria-hidden="true" /></span>Codematica<span className="brand-dot">.</span></Link>
        <div className="sidebar-navigation">
          <span className="sidebar-label">YOUR LEARNING SPACE</span>
          <nav aria-label="Primary navigation" className="sidebar-links">
            {destinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid={`app-nav-${label.toLowerCase()}`}><Icon size={20} aria-hidden="true" />{label}</Link>)}
          </nav>
          {showAdmin ? <nav aria-label="Admin navigation" className="sidebar-admin" data-testid="app-admin-navigation"><span className="sidebar-label">Admin</span><Link href="/admin/linkedin" className="app-nav-link" aria-current={linkedInActive ? "page" : undefined} data-testid="app-nav-linkedin"><Linkedin size={20} aria-hidden="true" data-testid="app-admin-linkedin-icon" />LinkedIn</Link></nav> : null}
        </div>
        <div className="sidebar-bottom">{accountControl("sidebar")}</div>
      </aside>
      <header className="app-mobile-header"><Link href="/" className="app-brand" aria-label="Codematica home"><span className="app-brand-mark"><Network size={19} aria-hidden="true" /></span>Codematica<span className="brand-dot">.</span></Link>{accountControl("header")}</header>
      <nav className="app-bottom-nav" aria-label="Mobile navigation" data-testid="app-bottom-navigation">
        {compactDestinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={21} aria-hidden="true" /><span>{label}</span></Link>)}
        <button ref={moreButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog" className={["/browse", "/languages", "/login", "/admin"].includes(active) ? "is-active" : undefined} data-testid="mobile-nav-more"><MoreHorizontal size={22} aria-hidden="true" /><span>More</span></button>
      </nav>
      <dialog ref={menu} onClose={() => moreButton.current?.focus({ preventScroll: true })} className="app-more-sheet" aria-labelledby="more-title" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <div className="sheet-heading"><h2 id="more-title">Explore Codematica</h2><button type="button" onClick={() => menu.current?.close()} aria-label="Close menu"><X size={20} aria-hidden="true" /></button></div>
        {[destinations[2], destinations[5]].map(({ href, label, icon: Icon }) => <Link href={href} key={href} className="sheet-link" onClick={() => menu.current?.close()}><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}
        {showAdmin ? <nav aria-label="Admin navigation in menu" className="sheet-admin"><span className="sheet-section-label">Admin</span><Link href="/admin/linkedin" className="sheet-link" aria-current={linkedInActive ? "page" : undefined} onClick={() => menu.current?.close()} data-testid="mobile-menu-linkedin"><Linkedin size={22} aria-hidden="true" /><span>LinkedIn</span><ArrowUpRight size={18} aria-hidden="true" /></Link></nav> : null}
        {accountControl("sheet")}
      </dialog>
    </>
  );
}

/** Shared account disclosure for the sidebar, phone header and More sheet. */
function AccountMenu({ placement, name, email, signingOut, error, onSignOut }: {
  placement: "sidebar" | "header" | "sheet";
  name: string;
  email?: string;
  signingOut: boolean;
  error?: string;
  onSignOut: () => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={disclosure} className={`account-menu account-menu-${placement}`} data-testid={`${placement}-account-menu`} onKeyDown={(event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (disclosure.current) {
          disclosure.current.open = false;
          disclosure.current.querySelector("summary")?.focus();
        }
      }
    }}>
      <summary aria-label={`Account: ${name}`} data-testid={`${placement}-account-trigger`}>
        <UserRound size={20} aria-hidden="true" />
        <span className="account-identity"><span className="account-name">{name}</span>{email ? <span className="account-email">{email}</span> : null}</span>
        <ChevronDown className="account-chevron" size={16} aria-hidden="true" />
      </summary>
      <div className="account-actions">
        <Button label={signingOut ? "Signing out…" : "Sign out"} icon={LogOut} tone="danger" variant="quiet" onClick={onSignOut} disabled={signingOut} data-testid={`${placement}-sign-out`} />
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </details>
  );
}

/** Context label reused by existing catalog and study headers. Navigation lives in the root layout. */
export function AppHeader({ subtitle = "Overview" }: { subtitle?: string }) {
  return <div className="app-context">{subtitle}</div>;
}
