import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getNextPathNodeRoute, getSourceById } from ".";

const commit = "6b6a66bae11c9e001c3576bcc3de55cc0dc5e449";
const sources = ["token-jwt-owasp", "token-rest-owasp", "rfc-7009-revocation", "rfc-9700-refresh"];
const base = `https://github.com/OWASP/CheatSheetSeries/blob/${commit}/`;

describe("token revocation review", () => {
  it.each([
    [sources[0], "OWASP", `${base}cheatsheets/JSON_Web_Token_Cheat_Sheet.md`, "JWT denylist"],
    [sources[1], "OWASP", `${base}cheatsheets/REST_Security_Cheat_Sheet.md`, "JWT"],
    [sources[2], "IETF", "https://www.rfc-editor.org/rfc/rfc7009.html", "August 2013"],
    [sources[3], "IETF", "https://www.rfc-editor.org/rfc/rfc9700.html", "January 2025"],
  ])("pins primary scope and destination for %s", (id, provider, url, scope) => {
    const source = getSourceById(id);
    expect(source).toMatchObject({ provider, url, lastVerifiedAt: "2026-10-04" });
    expect(source?.attribution).toContain(scope);
    if (provider === "OWASP") {
      expect(source?.upstream).toMatchObject({ commit, maturity: "published" });
      expect(source?.license).toEqual({ name: "CC-BY-SA-4.0", url: `${base}LICENSE.md` });
    } else expect(source?.license).toBeUndefined();
    expect(getDocumentBySlug("system-design/cors-csrf-and-authorization")?.markdown).toContain(`](${url})`);
  });

  it("separates token proof, revocation propagation and current permission", () => {
    const lesson = getDocumentBySlug("system-design/cors-csrf-and-authorization");
    expect(lesson?.sourceRefs).toEqual(["web-cors-mdn", "web-fetch-standard", "web-csrf-owasp", ...sources]);
    expect(lesson?.headings.map(h => h.id)).toEqual([
      "ask-three-questions-about-the-request", "trace-a-concrete-failure", "place-each-protection-at-its-boundary", "run-a-review-exercise",
      "separate-token-validity-from-current-session-state", "trace-revocation-to-every-consumer", "review-the-revocation-window",
    ]);
    for (const boundary of ["a valid signature does not prove current permission", "raw-token hashes can miss equivalent valid representations", "new signing keys alone do not reject tokens under an old trusted key", "revoking refresh access does not by itself prove every issued access token unusable", "never convert unavailable status into permission", "no token parser, authorization server or revocation endpoint is implemented"]) expect(lesson?.markdown).toContain(boundary);
  });

  it("preserves the four browser-boundary questions and adds independent revocation answers", () => {
    const quiz = getExerciseBySlug("system-design/api-boundary-checkpoint");
    if (quiz?.type !== "questionnaire") throw new Error("API review needs a questionnaire");
    expect(quiz.documentSlug).toBe("system-design/cors-csrf-and-authorization");
    expect(quiz.sourceRefs).toEqual(["web-cors-mdn", "web-fetch-standard", "web-csrf-owasp", ...sources]);
    expect(quiz.questions.map(q => q.id)).toEqual(["blocked-response", "preflight", "object-access", "cookies", "stale-revocation", "revocation-key", "refresh-access", "signing-key"]);
    expect(quiz.questions.map(q => q.kind === "choice" ? q.options.filter(o => o.isCorrect).map(o => o.label) : [])).toEqual([
      ["The server may already have changed state; inspect server evidence."],
      ["It does not send that guarded operation after this failed preflight."],
      ["Check authorization for that actor, object and operation."],
      ["Whether the browser’s actual cookie and request policies permit the credentials to be sent."],
      ["Refuse the sensitive operation until current status is established; record the propagation gap."],
      ["Use a unique server-issued identifier in the verified issuer/application scope; raw-token hashes may be bypassed."],
      ["Check the server’s cascade policy and consumer enforcement; revoking refresh access alone is not proof about issued access tokens."],
      ["The verifier still trusts the old key; issuing a new key alone does not revoke that token."],
    ]);
    expect(getNextPathNodeRoute("system-design-fundamentals", { kind: "exercise", slug: quiz.slug })).toBe("/docs/system-design/client-compatibility-contracts?path=system-design-fundamentals");
  });
});
