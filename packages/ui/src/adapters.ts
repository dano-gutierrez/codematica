import type { ProgressStatus, ProgressSurface } from "@codematica/core/progress";

export type NavigationAdapter = {
  navigate: (href: string) => void;
  replace?: (href: string) => void;
  goBack?: () => void;
  openExternalUrl?: (href: string) => void;
};

export type ProgressTarget = {
  surface: ProgressSurface;
  slug: string;
  title: string;
  summary: string;
  href: string;
  eyebrow: string;
  pathSlug?: string;
};

export type ProgressAdapter = {
  record: (target: ProgressTarget, status: ProgressStatus, position?: Record<string, unknown>) => Promise<void> | void;
};

export type AuthAdapter = {
  isConfigured: boolean;
  signInWithPassword?: (email: string, password: string) => Promise<void>;
  signUpWithPassword?: (email: string, password: string) => Promise<void>;
  signInWithOAuth?: (provider: "google" | "apple") => Promise<void>;
  syncAnonymousProgress?: () => Promise<void>;
};

export type AudioAdapter = {
  play: (audioId: string, playbackRate?: number) => Promise<boolean> | boolean;
};

export type CodematicaAdapters = {
  navigation: NavigationAdapter;
  progress?: ProgressAdapter;
  auth?: AuthAdapter;
  audio?: AudioAdapter;
  mermaidScript?: string;
};
