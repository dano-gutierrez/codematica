import { expect, test } from "@playwright/test";
import { evidenceAnswers } from "../../../../packages/core/src/test/evidence-review-fixture";

const groups = {
  "engineering-evidence-review": [
    [
      "ai-engineering/local-decision-contracts",
      "Name the decision and its evidence",
      "https://github.com/abhishekgahlot2/openjev-server/blob/032a2c5791f3d8856cc26fdb6876c106fac8dbf8/openjev_server/readout.py",
    ],
    [
      "software-engineering/credential-containment",
      "Separate the observation from the suspected cause",
      "https://docs.cloud.google.com/docs/security/compromised-credentials",
    ],
    [
      "programming/java-state-and-proxy-contracts",
      "Make key identity stable",
      "https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/util/Map.html",
    ],
    [
      "software-engineering/domain-and-deployment-boundaries",
      "Define the business words in one context",
      "https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf",
    ],
    [
      "system-design/cloud-responsibility-and-runtime",
      "Assign a responsible owner",
      "https://cloud.google.com/learn/paas-vs-iaas-vs-saas",
    ],
    [
      "system-design/federation-and-delegation",
      "Draw two application sessions",
      "https://openid.net/specs/openid-connect-core-1_0.html",
    ],
    [
      "system-design/card-payment-state-evidence",
      "Name the participants before drawing the arrows",
      "https://docs.stripe.com/payments/place-a-hold-on-a-payment-method",
    ],
  ],
  "creative-computing-review": [
    [
      "creative-computing/authoritative-motion-and-prediction",
      "Separate visible motion from accepted state",
      "https://github.com/Unity-Technologies/com.unity.multiplayer.docs/blob/c25748c7e67375d3bd4657f389ec5b3bf6aff382/docs/advanced-topics/client-anticipation.md",
    ],
    [
      "creative-computing/sampled-surfaces-and-time",
      "Define a surface on paper",
      "https://docs.blender.org/manual/en/5.2/modeling/geometry_nodes/input/scene/scene_time.html",
    ],
    [
      "creative-computing/blockout-and-trigger-state",
      "Make the blockout answer one question",
      "https://dev.epicgames.com/documentation/en-us/unreal-engine/trigger-volume-actors-in-unreal-engine",
    ],
  ],
  "ownership-and-funding-review": [
    [
      "business/ownership-and-funding-models",
      "Begin with a fictional capitalization table",
      "https://www.ycombinator.com/safe",
    ],
  ],
};

for (const [path, cases] of Object.entries(groups)) {
  for (const [index, [slug, heading, source]] of cases.entries()) {
    test(`@regression completes selected evidence ${slug}`, async ({
      page,
    }) => {
      await page.goto(`/paths/${path}`);
      await page
        .getByTestId(`path-node-document-${slug.replaceAll("/", "-")}`)
        .click();
      await expect(page).toHaveURL(`/docs/${slug}?path=${path}`);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await page.getByTestId("source-references-toggle").click();
      const urls = await page
        .getByTestId("source-references")
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      expect(urls).toContain(source);
      await expect(page.getByTestId("document-next-node")).toHaveAttribute(
        "href",
        `/practice/${slug}-checkpoint?path=${path}`,
      );
      await page.getByTestId("document-next-node").click();
      await expect(page.getByTestId("questionnaire-session")).toHaveAttribute(
        "data-ready",
        "true",
      );
      const answers = evidenceAnswers[slug];
      const choice = answers
        .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
        .reduce((a, b) => a.or(b));
      for (let question = 0; question < 5; question++) {
        await expect(
          page.getByText(`Question ${question + 1} of 5`, { exact: true }),
        ).toBeVisible();
        await expect(choice).toHaveCount(1);
        await choice.check();
        await page
          .getByRole("button", { name: "Check answer", exact: true })
          .click();
        await expect(
          page
            .getByTestId("questionnaire-feedback")
            .getByText("Correct", { exact: true }),
        ).toBeVisible();
        await page
          .getByRole("button", {
            name: question === 4 ? "Finish" : "Next",
            exact: true,
          })
          .click();
      }
      await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
      const next = page.getByRole("link", {
        name: "Next activity",
        exact: true,
      });
      if (index === cases.length - 1) await expect(next).toHaveCount(0);
      else
        await expect(next).toHaveAttribute(
          "href",
          `/docs/${cases[index + 1][0]}?path=${path}`,
        );
    });
  }
}
