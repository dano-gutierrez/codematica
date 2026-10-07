"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Brain, BriefcaseBusiness, ChevronDown, Code2, Home, Languages, Linkedin, LogOut, Map, MoreHorizontal, Network, UserRound, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAccountSession } from "@/lib/supabase/use-account-session";
import { useAdminAccess } from "@/lib/supabase/use-admin-access";
import { Button } from "./Button";

function BrandLink() {
  return <Link href="/" className="app-brand" aria-label="Codematica home">
    <img src="/brand/patch-mark.png" width={40} height={40} alt="" className="app-brand-mark" data-testid="brand-mark" />
    <img src="/brand/wordmark.png" width={128} height={31} alt="" className="app-brand-wordmark" data-testid="brand-wordmark" />
  </Link>;
}

const destinations = [
  { href: "/", label: "Play", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/paths", label: "Paths", icon: Map },
  { href: "/browse", label: "Lessons", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Brain },
  { href: "/interviews", label: "Interviews", icon: Code2 },
  { href: "/languages", label: "Languages", icon: Languages },
];

const adminLinks = [
  { id: "linkedin", href: "/admin/linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "knowledge", href: "/admin/knowledge", label: "Knowledge", icon: Network },
  { id: "interview-preparation", href: "/admin/interview-preparation", label: "Interview preparation", icon: BriefcaseBusiness },
];

export function AppNavigation() {
  const admin = useAdminAccess();
  const { user, isLoading } = useAccountSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const menu = useRef<HTMLDialogElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const active = pathname.startsWith("/play/") ? "/" : pathname.startsWith("/practice/languages/japanese") ? "/languages" : pathname.startsWith("/docs/") || pathname.startsWith("/diagrams/") ? "/browse" : `/${pathname.split("/")[1]}`;
  const [languagesOpen, setLanguagesOpen] = useState(active === "/languages");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();
  const compactDestinations = destinations.filter(({ href }) => !["/browse", "/languages", "/interviews"].includes(href));
  const showAdmin = admin && !!user;
  const adminActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
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
        <BrandLink />
        <div className="sidebar-navigation">
          <span className="sidebar-label">YOUR LEARNING SPACE</span>
          <nav aria-label="Primary navigation" className="sidebar-links">
            {destinations.map(({ href, label, icon: Icon }) => href === "/languages" ? <div key={href}>
              <div className="app-language-branch"><Link href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid="app-nav-languages"><Icon size={20} aria-hidden="true" />{label}</Link><button type="button" aria-label="Show supported languages" aria-expanded={languagesOpen} onClick={() => setLanguagesOpen(value => !value)} data-testid="app-nav-languages-expand"><ChevronDown size={18} aria-hidden="true" /></button></div>
              {languagesOpen ? <nav className="app-language-submenu" aria-label="Supported languages"><Link href="/languages/japanese" data-testid="app-nav-japanese">Japanese <span lang="ja">日本語</span></Link><Link href="/languages/japanese/notebooks" aria-current={pathname.includes("/notebooks") ? "page" : undefined} data-testid="app-nav-notebooks">Notebook practice</Link></nav> : null}
            </div> : <Link key={href} href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid={`app-nav-${label.toLowerCase()}`}><Icon size={20} aria-hidden="true" />{label}</Link>)}
          </nav>
          {showAdmin ? <nav aria-label="Admin navigation" className="sidebar-admin" data-testid="app-admin-navigation"><span className="sidebar-label">Admin</span>{adminLinks.map(({ id, href, label, icon: Icon }) => <Link key={id} href={href} className="app-nav-link" aria-current={adminActive(href) ? "page" : undefined} data-testid={`app-nav-${id}`}><Icon size={20} aria-hidden="true" data-testid={`app-admin-${id}-icon`} />{label}</Link>)}</nav> : null}
        </div>
        <div className="sidebar-bottom">{accountControl("sidebar")}</div>
      </aside>
      <header className="app-mobile-header"><BrandLink />{accountControl("header")}</header>
      <nav className="app-bottom-nav" aria-label="Mobile navigation" data-testid="app-bottom-navigation">
        {compactDestinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={21} aria-hidden="true" /><span>{label}</span></Link>)}
        <button ref={moreButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog" className={["/browse", "/languages", "/interviews", "/login", "/admin"].includes(active) ? "is-active" : undefined} data-testid="mobile-nav-more"><MoreHorizontal size={22} aria-hidden="true" /><span>More</span></button>
      </nav>
      <dialog ref={menu} onClose={() => moreButton.current?.focus({ preventScroll: true })} className="app-more-sheet" aria-labelledby="more-title" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <div className="sheet-heading"><h2 id="more-title">Explore Codematica</h2><button type="button" onClick={() => menu.current?.close()} aria-label="Close menu"><X size={20} aria-hidden="true" /></button></div>
        {destinations.filter(({ href }) => ["/browse", "/languages", "/interviews"].includes(href)).map(({ href, label, icon: Icon }) => <div key={href}><Link href={href} className="sheet-link" onClick={() => menu.current?.close()}><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>{href === "/languages" ? <nav className="app-language-submenu" aria-label="Supported languages in menu"><Link href="/languages/japanese" onClick={() => menu.current?.close()} data-testid="mobile-menu-japanese">Japanese <span lang="ja">日本語</span></Link><Link href="/languages/japanese/notebooks" onClick={() => menu.current?.close()} data-testid="mobile-menu-notebooks">Notebook practice</Link></nav> : null}</div>)}
        {showAdmin ? <nav aria-label="Admin navigation in menu" className="sheet-admin"><span className="sheet-section-label">Admin</span>{adminLinks.map(({ id, href, label, icon: Icon }) => <Link key={id} href={href} className="sheet-link" aria-current={adminActive(href) ? "page" : undefined} onClick={() => menu.current?.close()} data-testid={`mobile-menu-${id}`}><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}</nav> : null}
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
