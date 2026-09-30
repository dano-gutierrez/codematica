"use client";

import Link from "next/link";
import { useAdminAccess } from "@/lib/supabase/use-admin-access";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ArrowUpRight, BookOpen, Brain, Code2, Home, Languages, Map, MoreHorizontal, Network, UserRound, X } from "lucide-react";

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
  const adminLink = { href: "/admin/linkedin", label: "LinkedIn", icon: Code2 };
  const pathname = usePathname() ?? "/";
  const menu = useRef<HTMLDialogElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const active = pathname.startsWith("/docs/") || pathname.startsWith("/diagrams/") ? "/browse" : `/${pathname.split("/")[1]}`;
  const compactDestinations = destinations.filter(({ href }) => !["/browse", "/languages"].includes(href));

  return (
    <>
      <a href="#app-content" className="skip-link">Skip to content</a>
      <aside className="app-sidebar">
        <Link href="/" className="app-brand" aria-label="Codematica home"><span className="app-brand-mark"><Network size={22} aria-hidden="true" /></span>Codematica<span className="brand-dot">.</span></Link>
        <span className="sidebar-label">YOUR LEARNING SPACE</span>
        <nav aria-label="Primary navigation" className="sidebar-links">
          {[...destinations, ...(admin ? [adminLink] : [])].map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid={`app-nav-${label.toLowerCase()}`}><Icon size={20} aria-hidden="true" />{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/login" className="app-nav-link"><UserRound size={20} aria-hidden="true" />Sign in<ArrowUpRight size={16} className="ml-auto" aria-hidden="true" /></Link></div>
      </aside>
      <header className="app-mobile-header"><Link href="/" className="app-brand" aria-label="Codematica home"><span className="app-brand-mark"><Network size={19} aria-hidden="true" /></span>Codematica<span className="brand-dot">.</span></Link><Link href="/login" className="account-link" aria-label="Sign in"><UserRound size={20} aria-hidden="true" /></Link></header>
      <nav className="app-bottom-nav" aria-label="Mobile navigation" data-testid="app-bottom-navigation">
        {compactDestinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={21} aria-hidden="true" /><span>{label}</span></Link>)}
        <button ref={moreButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog" className={["/browse", "/languages", "/login"].includes(active) ? "is-active" : undefined} data-testid="mobile-nav-more"><MoreHorizontal size={22} aria-hidden="true" /><span>More</span></button>
      </nav>
      <dialog ref={menu} onClose={() => moreButton.current?.focus({ preventScroll: true })} className="app-more-sheet" aria-labelledby="more-title" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <div className="sheet-heading"><h2 id="more-title">Explore Codematica</h2><button type="button" onClick={() => menu.current?.close()} aria-label="Close menu"><X size={20} aria-hidden="true" /></button></div>
        {[destinations[2], destinations[5], ...(admin ? [adminLink] : []), { href: "/login", label: "Sign in", icon: UserRound }].map(({ href, label, icon: Icon }) => <Link href={href} key={href} className="sheet-link" onClick={() => menu.current?.close()}><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>)}
      </dialog>
    </>
  );
}

/** Context label reused by existing catalog and study headers. Navigation lives in the root layout. */
export function AppHeader({ subtitle = "Overview" }: { subtitle?: string }) {
  return <div className="app-context">{subtitle}</div>;
}
