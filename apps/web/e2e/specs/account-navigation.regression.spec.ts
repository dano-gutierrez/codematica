import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { editorialFixture } from "../../../../packages/core/src/test/linkedin-fixture";

test.skip(process.env.EDITORIAL_E2E !== "1", "Uses the isolated Supabase URL and intercepted auth/RPC requests");

for (const [layout, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["phone", { width: 390, height: 844 }],
] as const) {
  test(`@regression ${layout} account signs in, opens Admin and signs out`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const user = {
      id: "10000000-0000-4000-8000-000000000099",
      aud: "authenticated",
      role: "authenticated",
      email: "editor@example.test",
      email_confirmed_at: "2026-10-02T00:00:00Z",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { full_name: "Editorial User" },
      created_at: "2026-10-02T00:00:00Z",
    };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    // Synthetic, unsigned test token. It is used only against the fake Supabase host.
    const token = [
      { alg: "HS256", typ: "JWT" },
      { sub: user.id, aud: user.aud, role: user.role, exp: expiresAt, iat: expiresAt - 3600 },
    ].map(value => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test-signature";
    let signedOut = false;
    let signOutCalls = 0;
    await page.route("https://editorial.supabase.test/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/auth/v1/token") return route.fulfill({ json: {
        access_token: token, refresh_token: "synthetic-refresh-token", expires_in: 3600,
        expires_at: expiresAt, token_type: "bearer", user,
      } });
      if (url.pathname === "/auth/v1/user") return route.fulfill({ json: user });
      if (url.pathname === "/auth/v1/logout") {
        expect(url.searchParams.get("scope")).toBe("local");
        signOutCalls++;
        signedOut = true;
        return route.fulfill({ status: 204 });
      }
      if (url.pathname === "/rest/v1/rpc/linkedin_is_admin") return route.fulfill({ json: !signedOut && !!route.request().headers().authorization?.includes(token) });
      if (url.pathname === "/rest/v1/rpc/linkedin_snapshot") return route.fulfill({ json: editorialFixture });
      throw new Error(`Unexpected mock request ${url.pathname}`);
    });

    await test.step("sign in and replace the sign-in control with the account", async () => {
      await page.goto("/login?next=%2Fadmin%2Flinkedin");
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
      await page.getByRole("button", { name: "Sign in with email" }).click();
      await expect(page).toHaveURL(/\/admin\/linkedin$/);
      await expect(page.getByTestId("linkedin-post-list")).toBeVisible();
      const placement = layout === "desktop" ? "sidebar" : "header";
      await expect(page.getByTestId(`${placement}-account-trigger`)).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
      await page.getByTestId(`linkedin-post-${editorialFixture.posts[0].id}`).click();
    });

    await test.step("find LinkedIn under Admin and open the account disclosure", async () => {
      const placement = layout === "desktop" ? "sidebar" : "sheet";
      if (layout === "phone") await page.getByTestId("mobile-nav-more").click();
      const admin = page.getByRole("navigation", { name: layout === "desktop" ? "Admin navigation" : "Admin navigation in menu", exact: true });
      await expect(admin.getByText("Admin", { exact: true })).toBeVisible();
      await expect(admin.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("navigation", { name: "Primary navigation", exact: true }).getByRole("link", { name: "LinkedIn" })).toHaveCount(0);
      await page.getByTestId(`${placement}-account-trigger`).click();
      await expect(page.getByTestId(`${placement}-sign-out`)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId(`${placement}-account-menu`)).not.toHaveAttribute("open");
      await expect(page.getByTestId(`${placement}-account-trigger`)).toBeFocused();
      await page.getByTestId(`${placement}-account-trigger`).press("Enter");
      await expect(page.getByTestId(`${placement}-sign-out`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: test.info().outputPath(`account-${layout}.png`), fullPage: true });
    });

    await test.step("sign out and restore anonymous navigation", async () => {
      const placement = layout === "desktop" ? "sidebar" : "sheet";
      await page.getByTestId(`${placement}-sign-out`).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByTestId(layout === "desktop" ? "sidebar-sign-in" : "header-sign-in")).toBeVisible();
      await expect(page.getByTestId("app-admin-navigation")).toHaveCount(0);
      await expect(page.getByTestId("linkedin-post-list")).toHaveCount(0);
      expect(signOutCalls).toBe(1);
      expect((await page.context().cookies()).filter(cookie => cookie.name.startsWith("sb-editorial-auth-token"))).toHaveLength(0);
    });
  });
}
