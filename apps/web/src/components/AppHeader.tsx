"use client";

import Link from "next/link";
import { useAdminAccess } from "@/lib/supabase/use-admin-access";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Brain, ChevronDown, Code2, Home, Languages, Map, MoreHorizontal, UserRound, X } from "lucide-react";

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

export function AppNavigation() {
  const admin = useAdminAccess();
  const adminLink = { href: "/admin/linkedin", label: "LinkedIn", icon: Code2 };
  const pathname = usePathname() ?? "/";
  const menu = useRef<HTMLDialogElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const active = pathname.startsWith("/play/") ? "/" : pathname.startsWith("/practice/languages/japanese") ? "/languages" : pathname.startsWith("/docs/") || pathname.startsWith("/diagrams/") ? "/browse" : `/${pathname.split("/")[1]}`;
  const compactDestinations = destinations.filter(({ href }) => !["/browse", "/languages", "/interviews"].includes(href));
  const [languagesOpen, setLanguagesOpen] = useState(active === "/languages");

  return (
    <>
      <a href="#app-content" className="skip-link">Skip to content</a>
      <aside className="app-sidebar">
        <BrandLink />
        <span className="sidebar-label">YOUR LEARNING SPACE</span>
        <nav aria-label="Primary navigation" className="sidebar-links">
          {[...destinations, ...(admin ? [adminLink] : [])].map(({ href, label, icon: Icon }) => href === "/languages" ? <div key={href}><div className="app-language-branch"><Link href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid="app-nav-languages"><Icon size={20} aria-hidden="true"/>{label}</Link><button type="button" aria-label="Show supported languages" aria-expanded={languagesOpen} onClick={()=>setLanguagesOpen(value=>!value)} data-testid="app-nav-languages-expand"><ChevronDown size={18} aria-hidden="true"/></button></div>{languagesOpen ? <nav className="app-language-submenu" aria-label="Supported languages"><Link href="/languages/japanese" data-testid="app-nav-japanese">Japanese <span lang="ja">日本語</span></Link><Link href="/languages/japanese/notebooks" aria-current={pathname.includes("/notebooks") ? "page" : undefined} data-testid="app-nav-notebooks">Notebook practice</Link></nav> : null}</div> : <Link key={href} href={href} className="app-nav-link" aria-current={active === href ? "page" : undefined} data-testid={`app-nav-${label.toLowerCase()}`}><Icon size={20} aria-hidden="true" />{label}</Link>)}
        </nav>
        <div className="sidebar-bottom"><Link href="/login" className="app-nav-link"><UserRound size={20} aria-hidden="true" />Sign in<ArrowUpRight size={16} className="ml-auto" aria-hidden="true" /></Link></div>
      </aside>
      <header className="app-mobile-header"><BrandLink /><Link href="/login" className="account-link" aria-label="Sign in"><UserRound size={20} aria-hidden="true" /></Link></header>
      <nav className="app-bottom-nav" aria-label="Mobile navigation" data-testid="app-bottom-navigation">
        {compactDestinations.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} data-testid={`mobile-nav-${label.toLowerCase()}`}><Icon size={21} aria-hidden="true" /><span>{label}</span></Link>)}
        <button ref={moreButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog" className={["/browse", "/languages", "/interviews", "/login"].includes(active) ? "is-active" : undefined} data-testid="mobile-nav-more"><MoreHorizontal size={22} aria-hidden="true" /><span>More</span></button>
      </nav>
      <dialog ref={menu} onClose={() => moreButton.current?.focus({ preventScroll: true })} className="app-more-sheet" aria-labelledby="more-title" onClick={(event) => { if (event.target === event.currentTarget) menu.current?.close(); }}>
        <div className="sheet-heading"><h2 id="more-title">Explore Codematica</h2><button type="button" onClick={() => menu.current?.close()} aria-label="Close menu"><X size={20} aria-hidden="true" /></button></div>
        {[...destinations.filter(({ href }) => ["/browse", "/languages", "/interviews"].includes(href)), ...(admin ? [adminLink] : []), { href: "/login", label: "Sign in", icon: UserRound }].map(({ href, label, icon: Icon }) => <div key={href}><Link href={href} className="sheet-link" onClick={() => menu.current?.close()}><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>{href === "/languages" ? <nav className="app-language-submenu" aria-label="Supported languages in menu"><Link href="/languages/japanese" onClick={()=>menu.current?.close()} data-testid="mobile-menu-japanese">Japanese <span lang="ja">日本語</span></Link><Link href="/languages/japanese/notebooks" onClick={()=>menu.current?.close()} data-testid="mobile-menu-notebooks">Notebook practice</Link></nav> : null}</div>)}
      </dialog>
    </>
  );
}

/** Context label reused by existing catalog and study headers. Navigation lives in the root layout. */
export function AppHeader({ subtitle = "Overview" }: { subtitle?: string }) {
  return <div className="app-context">{subtitle}</div>;
}
