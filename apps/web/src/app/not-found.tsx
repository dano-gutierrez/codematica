import { Home, Search } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";

export default function NotFound() {
  return <main className="ui-page min-h-screen" data-testid="not-found-page">
    <div className="ui-empty-page">
      <header className="ui-page-heading"><h1>This page is unavailable.</h1><p>Try the lesson library or return home.</p></header>
      <div className="ui-actions"><ButtonLink href="/" label="Back to home" icon={Home} tone="success" variant="primary" /><ButtonLink href="/browse" label="Find a lesson" icon={Search} /></div>
    </div>
  </main>;
}
