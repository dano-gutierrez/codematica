import { expect, test } from "@playwright/test";

test("@regression standalone code review applies a fix and offers another review", async ({ page }) => {
  await page.goto("/code-reviews?exercise=programming/user-profile-boundary-review");

  await expect(page.getByTestId("code-reviews-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "User Profile Boundary Review" })).toBeVisible();
  await expect(page.getByTestId("code-review-file-src-api-userprofile-ts")).toContainText("src/api/userProfile.ts");
  expect(
    await page.getByTestId("code-review-scroll-src-api-userprofile-ts").evaluate((element) => {
      const firstSegment = element.querySelector<HTMLElement>('[data-testid="code-review-token-src-api-userprofile-ts-14-0"]');
      const findingSegment = element.querySelector<HTMLElement>('[data-testid="code-review-finding-unchecked-network-json"]');

      return {
        canScrollHorizontally: element.scrollWidth > element.clientWidth,
        splitSegmentsStayInline: Boolean(firstSegment && findingSegment && firstSegment.offsetTop === findingSegment.offsetTop),
      };
    }),
  ).toEqual({
    canScrollHorizontally: true,
    splitSegmentsStayInline: true,
  });

  await page.getByTestId("code-review-healthy-schema-import").click();
  await expect(page.getByTestId("code-review-attempts")).toContainText("Attempts 1");
  await expect(page.getByTestId("code-review-healthy-feedback")).toContainText("Using Zod here is healthy");

  await page.getByTestId("code-review-finding-unchecked-network-json").click();
  await expect(page.getByTestId("code-review-attempts")).toContainText("Attempts 2");
  await expect(page.getByRole("dialog")).toContainText("Casting the network payload to UserProfile bypasses the schema");
  await expect(page.getByTestId("code-review-token-src-api-userprofile-ts-14-0")).toContainText("return userSchema.parse(data);");
  await expect(page.getByTestId("code-review-complete")).toContainText("Review complete");

  await page.getByRole("button", { name: "Close finding explanation" }).click();
  await expect(page.getByRole("button", { name: /Review another/i })).toBeVisible();
});

test("@regression path-linked code review exposes the next path node after completion", async ({ page }) => {
  await page.goto("/paths/backend-engineer-readiness");

  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-exercise-software-engineering-checkout-observability-review")).toContainText("Code review");

  await page.getByTestId("path-node-exercise-software-engineering-checkout-observability-review").click();
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page).toHaveURL(/\/practice\/software-engineering\/checkout-observability-review\?path=backend-engineer-readiness/);

  await page.getByTestId("code-review-finding-payload-as-logging-args").click();
  await expect(page.getByRole("dialog")).toContainText("Passing the payload as a positional logging argument");
  await expect(page.getByTestId("code-review-token-services-checkout-events-py-13-0")).toContainText(
    "logger.info(\"checkout completed\", extra={\"checkout\": payload})",
  );
  await expect(page.getByTestId("code-review-complete")).toContainText("Review complete");

  await page.getByRole("button", { name: "Close finding explanation" }).click();
  await expect(page.getByRole("link", { name: /Next node/i })).toHaveAttribute(
    "href",
    "/docs/programming/typescript-boundaries?path=backend-engineer-readiness",
  );
});
