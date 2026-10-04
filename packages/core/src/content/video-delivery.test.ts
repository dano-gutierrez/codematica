import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getSourceById } from ".";

const slug = "system-design/video-delivery-boundaries";
const sources = ["video-hls-rfc8216", "video-eme-2017", "video-android-drm", "video-android-secure-window", "video-netflix-browser-requirements"];

describe("video delivery review", () => {
  it.each([
    [sources[0], "IETF", "https://www.rfc-editor.org/rfc/rfc8216.html", "August 2017"],
    [sources[1], "W3C", "https://www.w3.org/TR/2017/REC-encrypted-media-20170918/", "September 18, 2017"],
    [sources[2], "Android Developers", "https://developer.android.com/reference/android/media/MediaDrm", "API level 28"],
    [sources[3], "Android Developers", "https://developer.android.com/security/fraud-prevention/activities", "FLAG_SECURE"],
    [sources[4], "Netflix Help Center", "https://help.netflix.com/en/node/30081", "2026-10-04"],
  ])("keeps primary scope and destination for %s", (id, provider, url, scope) => {
    const source = getSourceById(id);
    expect(source).toMatchObject({ provider, url, lastVerifiedAt: "2026-10-04" });
    expect(source?.attribution).toContain(scope);
    expect(source?.license).toBeUndefined();
    expect(getDocumentBySlug(slug)?.markdown).toContain(`](${url})`);
  });

  it("separates transfer deadlines, protection observations and durable resume", () => {
    const lesson = getDocumentBySlug(slug);
    expect(lesson?.sourceRefs).toEqual(sources);
    expect(lesson?.prerequisites).toEqual(["system-design/cache-invalidation", "software-engineering/product-interview-durable-generation-architecture"]);
    expect(lesson?.headings.map(h => h.id)).toEqual(["separate-the-delivery-contracts", "calculate-a-segment-deadline", "observe-protection-at-its-own-boundary", "preserve-playback-state-deliberately", "write-a-delivery-review-receipt"]);
    for (const boundary of ["8 megabits takes 4 seconds", "a CDN cache hit does not prove uninterrupted playback", "a blank screenshot does not prove hardware-only decoding", "EME is an API, not a particular DRM system", "downscaling is optional", "a cache acknowledgement is not a durable resume contract", "seek backward can be intentional", "no streaming service, DRM bypass or failure injection was run"]) expect(lesson?.markdown).toContain(boundary);
    for (const match of (lesson?.markdown ?? "").matchAll(/\]\(\/docs\/([^)?#]+)(?:[?#][^)]*)?\)/g)) expect(getDocumentBySlug(match[1]), match[1]).toBeDefined();
  });

  it("scores five independently keyed review cases", () => {
    const quiz = getExerciseBySlug("system-design/video-delivery-checkpoint");
    if (quiz?.type !== "questionnaire") throw new Error("Video review needs a questionnaire");
    expect(quiz.documentSlug).toBe(slug);
    expect(quiz.sourceRefs).toEqual(sources);
    expect(quiz.questions.map(q => q.id)).toEqual(["segment-deadline", "screenshot-evidence", "output-policy", "resume-receipt", "browser-requirements"]);
    expect(quiz.questions.map(q => q.kind === "choice" ? q.options.filter(o => o.isCorrect).map(o => o.label) : [])).toEqual([
      ["Four seconds to transfer; the half-second buffer cannot bridge that wait under these assumptions."],
      ["Capture policy is observed; identify the DRM security level separately before claiming hardware-only decoding."],
      ["Inspect the key status and output policy; downscaling is optional and cannot be assumed."],
      ["Define persistence, scoped ordering and recovery, then test the last accepted revision after failure."],
      ["Check the dated platform/browser requirements and actual device configuration; the maximum is conditional."],
    ]);
  });

  it("appends one unit and preserves prior continuation", () => {
    const path = getLearningPathBySlug("system-design-fundamentals")!;
    expect(path.units.map(u => u.slug)).toEqual(["caching-contracts", "capacity-decisions", "routing-decisions", "api-security-boundaries", "client-compatibility", "traffic-rate", "webhook-authenticity", "reservation-boundaries", "distributed-readings", "video-delivery"]);
    expect(path.units.at(-1)?.nodes).toEqual([{ kind: "document", slug }, { kind: "exercise", slug: "system-design/video-delivery-checkpoint" }]);
    expect(getNextPathNodeRoute(path.slug, {kind:"exercise",slug:"system-design/distributed-reading-checkpoint"})).toBe(`/docs/${slug}?path=${path.slug}`);
    expect(getNextPathNodeRoute(path.slug, {kind:"document",slug})).toBe(`/practice/system-design/video-delivery-checkpoint?path=${path.slug}`);
    expect(getNextPathNodeRoute(path.slug, {kind:"exercise",slug:"system-design/video-delivery-checkpoint"})).toBeUndefined();
    expect(getLearningPathBySlug("backend-engineer-readiness")?.units.flatMap(u=>u.nodes).some(n=>n.slug===slug)).toBe(false);
  });
});
