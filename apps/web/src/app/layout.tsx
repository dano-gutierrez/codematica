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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
