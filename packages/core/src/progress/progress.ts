import { z } from "zod";
import type { ContentIndex } from "../content/schema";

export const progressSurfaceSchema = z.enum(["document", "diagram", "practice", "passive-feed", "interview"]);
export const progressStatusSchema = z.enum(["started", "completed"]);

const slugSchema = z
  .string()
  .min(3)
  .regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, "Use lowercase slugs with / or - separators.");

const progressPositionSchema = z.record(z.string(), z.unknown()).default({});

export const progressInputSchema = z.object({
  surface: progressSurfaceSchema,
  slug: slugSchema,
  pathSlug: z.union([slugSchema, z.literal("")]).optional().default(""),
  status: progressStatusSchema,
  position: progressPositionSchema,
});

export const progressInputArraySchema = z.preprocess(
  (value) => (Array.isArray(value) ? value.slice(0, 20) : value),
  z.array(progressInputSchema).max(20),
);

export const progressRowSchema = z.object({
  surface: progressSurfaceSchema,
  slug: slugSchema,
  path_slug: z.string().default(""),
  status: progressStatusSchema,
  position: progressPositionSchema,
  last_seen_at: z.string(),
  completed_at: z.string().nullable().default(null),
});

export type ProgressSurface = z.infer<typeof progressSurfaceSchema>;
export type ProgressStatus = z.infer<typeof progressStatusSchema>;
export type ProgressInput = z.infer<typeof progressInputSchema>;

export type StoredProgressRow = {
  surface: ProgressSurface;
  slug: string;
  pathSlug: string;
  status: ProgressStatus;
  position: Record<string, unknown>;
  lastSeenAt: string;
  completedAt: string | null;
};

export type ProgressDisplayItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  eyebrow: string;
  status: ProgressStatus;
  lastSeenAt: string;
};

export function normalizeProgressInput(input: unknown, index?: ContentIndex): ProgressInput {
  const parsed = progressInputSchema.parse(input);

  if (index) {
    assertProgressContentExists(parsed, index);
  }

  return parsed;
}

export function normalizeProgressRow(row: unknown): StoredProgressRow {
  const parsed = progressRowSchema.parse(row);

  return {
    surface: parsed.surface,
    slug: parsed.slug,
    pathSlug: parsed.path_slug,
    status: parsed.status,
    position: parsed.position,
    lastSeenAt: parsed.last_seen_at,
    completedAt: parsed.completed_at,
  };
}

export function createProgressDisplayItem(row: StoredProgressRow, index: ContentIndex): ProgressDisplayItem | undefined {
  const pathSearch = row.pathSlug ? `?path=${encodeURIComponent(row.pathSlug)}` : "";
  const base = {
    id: `${row.surface}-${row.slug}-${row.pathSlug}`,
    status: row.status,
    lastSeenAt: row.lastSeenAt,
  };

  if (row.surface === "document") {
    const document = index.documents.find((item) => item.slug === row.slug);

    return document
      ? {
          ...base,
          title: document.title,
          summary: document.summary,
          href: `${document.route}${pathSearch}`,
          eyebrow: "Document",
        }
      : undefined;
  }

  if (row.surface === "diagram") {
    const diagram = index.diagrams.find((item) => item.slug === row.slug);

    return diagram
      ? {
          ...base,
          title: diagram.title,
          summary: `Mermaid diagram stored in ${diagram.sourcePath}.`,
          href: `${diagram.route}${pathSearch}`,
          eyebrow: "Diagram",
        }
      : undefined;
  }

  if (row.surface === "practice") {
    const exercise = index.exercises.find((item) => item.slug === row.slug);

    return exercise
      ? {
          ...base,
          title: exercise.title,
          summary: `${exercise.concept} practice`,
          href: `${exercise.route}${pathSearch}`,
          eyebrow: "Practice",
        }
      : undefined;
  }

  if (row.surface === "passive-feed") {
    const feed = index.passiveFlashcardFeeds.find((item) => item.pathSlug === row.slug || item.slug === row.slug);

    return feed
      ? {
          ...base,
          title: feed.title,
          summary: feed.summary,
          href: feed.route,
          eyebrow: "Flashcards",
        }
      : undefined;
  }

  const [companySlug, questionSlug] = row.slug.split("/");
  const company = index.interviewCompanies.find((item) => item.slug === companySlug);
  const question = company?.questions.find((item) => item.slug === questionSlug);

  return question
    ? {
        ...base,
        title: question.title,
        summary: question.summary,
        href: question.route,
        eyebrow: `${question.companyName} interview`,
      }
    : undefined;
}

export function createProgressDisplayItems(rows: StoredProgressRow[], index: ContentIndex) {
  return rows.flatMap((row) => {
    const item = createProgressDisplayItem(row, index);
    return item ? [item] : [];
  });
}

export function createStoredProgressRow(input: ProgressInput, now = new Date()): StoredProgressRow {
  const timestamp = now.toISOString();

  return {
    surface: input.surface,
    slug: input.slug,
    pathSlug: input.pathSlug,
    status: input.status,
    position: input.position,
    lastSeenAt: timestamp,
    completedAt: input.status === "completed" ? timestamp : null,
  };
}

export function createProgressUpsertRow(userId: string, input: ProgressInput, now = new Date()) {
  const timestamp = now.toISOString();
  const row: Record<string, unknown> = {
    user_id: userId,
    surface: input.surface,
    slug: input.slug,
    path_slug: input.pathSlug,
    status: input.status,
    position: input.position,
    last_seen_at: timestamp,
    updated_at: timestamp,
  };

  if (input.status === "completed") {
    row.completed_at = timestamp;
  }

  return row;
}

function assertProgressContentExists(input: ProgressInput, index: ContentIndex) {
  if (input.pathSlug && !index.learningPaths.some((path) => path.slug === input.pathSlug)) {
    throw new Error(`Unknown learning path progress reference: ${input.pathSlug}`);
  }

  if (input.surface === "document" && !index.documents.some((document) => document.slug === input.slug)) {
    throw new Error(`Unknown document progress reference: ${input.slug}`);
  }

  if (input.surface === "diagram" && !index.diagrams.some((diagram) => diagram.slug === input.slug)) {
    throw new Error(`Unknown diagram progress reference: ${input.slug}`);
  }

  if (input.surface === "practice" && !index.exercises.some((exercise) => exercise.slug === input.slug)) {
    throw new Error(`Unknown practice progress reference: ${input.slug}`);
  }

  if (
    input.surface === "passive-feed" &&
    !index.passiveFlashcardFeeds.some((feed) => feed.pathSlug === input.slug || feed.slug === input.slug)
  ) {
    throw new Error(`Unknown passive feed progress reference: ${input.slug}`);
  }

  if (input.surface === "interview") {
    const [companySlug, questionSlug] = input.slug.split("/");
    const company = index.interviewCompanies.find((item) => item.slug === companySlug);

    if (!company?.questions.some((question) => question.slug === questionSlug)) {
      throw new Error(`Unknown interview progress reference: ${input.slug}`);
    }
  }
}
