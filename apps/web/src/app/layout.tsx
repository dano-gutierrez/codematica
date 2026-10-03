import { AppNavigation } from "@/components/AppHeader";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SaveProgressPrompt } from "@/components/SaveProgressPrompt";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import "./globals.css";
import "./game.css";
import { GameLessonReturn } from "@/components/game/GameLessonReturn";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Codematica",
  description: "A gamified software engineering knowledge base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppNavigation />
        <Suspense fallback={null}><GameLessonReturn /></Suspense>
        <div id="app-content" className="app-content" tabIndex={-1}>{children}</div>
        <Suspense fallback={null}>
          <SaveProgressPrompt isAuthConfigured={hasSupabasePublicEnv()} />
        </Suspense>
      </body>
    </html>
  );
}
