import { describe, expect, it } from "vitest";
import config from "../../apps/web/e2e/playwright.config";

describe("merged release browser coverage", () => {
  for (const name of ["desktop-chromium", "mobile-webkit"]) {
    const project = config.projects?.find(project => project.name === name);
    it.each(["@smoke", "@playground", "@notebook-catalog", "@interview-admin", "@map-art"])(
      `${name} retains %s journeys`, tag => {
        expect(project).toBeDefined();
        expect(project?.grep).toBeInstanceOf(RegExp);
        expect((project?.grep as RegExp).test(`${tag} representative journey`)).toBe(true);
      },
    );
    it(`${name} keeps feature-specific regressions bounded`, () => {
      expect((project?.grep as RegExp).test("@regression unrelated journey")).toBe(false);
    });
  }
  it("mobile Chromium retains the complete release suite", () => {
    const project = config.projects?.find(project => project.name === "mobile-chromium");
    expect(project).toBeDefined();
    expect(project?.grep).toBeUndefined();
    expect(project?.grepInvert).toBeUndefined();
  });
});
