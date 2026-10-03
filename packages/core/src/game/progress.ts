import { z } from "zod";
import type { GameCampaign } from "./schema";

const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Unknown IANA timezone");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
  );
export const gameProgressSchema = z.object({
  version: z.literal(1),
  timezone: timezoneSchema,
  awards: z.record(
    z.string(),
    z.object({
      earnedAt: z.iso.datetime(),
      mode: z.enum(["standard", "assisted"]),
    }),
  ),
  activityDays: z.array(dateSchema),
  cosmetic: z.enum(["none", "antenna", "toolbelt", "beacon"]),
  updatedAt: z.iso.datetime(),
});
export type GameProgress = z.infer<typeof gameProgressSchema>;
export const GAME_STORAGE_KEY = "codematica.game.v1";
export function emptyGameProgress(timezone = "UTC"): GameProgress {
  return {
    version: 1,
    timezone,
    awards: {},
    activityDays: [],
    cosmetic: "none",
    updatedAt: new Date(0).toISOString(),
  };
}
export function awardKey(campaign: string, level: string, scenario: string) {
  return `${campaign}/${level}/${scenario}`;
}
export function localDay(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function isLevelUnlocked(
  campaign: GameCampaign,
  levelId: string,
  progress: GameProgress,
) {
  const index = campaign.levels.findIndex((l) => l.id === levelId);
  return (
    index >= 0 &&
    campaign.levels
      .slice(0, index)
      .every((l) =>
        Boolean(progress.awards[awardKey(campaign.id, l.id, "main")]),
      )
  );
}
export function levelStars(p: GameProgress, campaign: string, level: string) {
  return ["main", "mastery-1", "mastery-2"].filter(
    (s) => p.awards[awardKey(campaign, level, s)],
  ).length;
}
export function gameTotals(p: GameProgress) {
  const keys = Object.keys(p.awards);
  const stars = keys.length;
  return {
    stars,
    xp: keys.reduce((n, k) => n + (k.endsWith("/main") ? 100 : 25), 0),
    cosmetics: [
      "none",
      ...(stars >= 6 ? ["antenna"] : []),
      ...(stars >= 18 ? ["toolbelt"] : []),
      ...(stars >= 30 ? ["beacon"] : []),
    ],
  };
}
export function awardScenario(
  p: GameProgress,
  c: GameCampaign,
  level: string,
  scenario: string,
  mode: "standard" | "assisted",
  now = new Date(),
): GameProgress {
  const l = c.levels.find((x) => x.id === level);
  if (
    !l ||
    !isLevelUnlocked(c, level, p) ||
    !l.scenarios.some((s) => s.id === scenario) ||
    (scenario !== "main" && !p.awards[awardKey(c.id, level, "main")])
  )
    throw new Error("Complete the preceding main scenario first.");
  const key = awardKey(c.id, level, scenario),
    earnedAt = now.toISOString();
  return {
    ...p,
    awards: { ...p.awards, [key]: p.awards[key] ?? { earnedAt, mode } },
    activityDays: [
      ...new Set([...p.activityDays, localDay(p.timezone, now)]),
    ].sort(),
    updatedAt: earnedAt,
  };
}
export function mergeGameProgress(
  local: GameProgress,
  remote: GameProgress,
): GameProgress {
  const awards = { ...local.awards };
  for (const [key, value] of Object.entries(remote.awards))
    if (!awards[key] || value.earnedAt < awards[key].earnedAt)
      awards[key] = value;
  const newest = local.updatedAt >= remote.updatedAt ? local : remote;
  return {
    ...newest,
    timezone: remote.timezone,
    awards,
    activityDays: [
      ...new Set([...local.activityDays, ...remote.activityDays]),
    ].sort(),
  };
}
export function getStreak(p: GameProgress, now = new Date()) {
  const days = new Set(p.activityDays);
  let cursor = new Date(localDay(p.timezone, now) + "T12:00:00Z");
  const key = () => cursor.toISOString().slice(0, 10);
  if (!days.has(key())) cursor = new Date(cursor.getTime() - 86400000);
  let count = 0;
  while (days.has(key())) {
    count++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return count;
}
export function validateGameProgress(
  value: unknown,
  campaign: GameCampaign,
): GameProgress {
  const p = gameProgressSchema.parse(value);
  const valid = new Set(
    campaign.levels.flatMap((l) =>
      l.scenarios.map((s) => awardKey(campaign.id, l.id, s.id)),
    ),
  );
  if (Object.keys(p.awards).some((k) => !valid.has(k)))
    throw new Error("Unknown game objective");
  for (const l of campaign.levels)
    if (
      levelStars(p, campaign.id, l.id) > 0 &&
      (!isLevelUnlocked(campaign, l.id, p) ||
        !p.awards[awardKey(campaign.id, l.id, "main")])
    )
      throw new Error("Missing preceding completion");
  if (!gameTotals(p).cosmetics.includes(p.cosmetic))
    throw new Error("Cosmetic has not been earned");
  return p;
}
