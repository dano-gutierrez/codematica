import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "./AppHeader";

const route = vi.hoisted(() => ({ pathname: "/", replace: vi.fn(), refresh: vi.fn() }));
const auth = vi.hoisted(() => ({ admin: false, user: null as null | { email?: string; user_metadata: Record<string, unknown> }, isLoading: false, signOut: vi.fn(), configured: true }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => route }));
vi.mock("@/lib/supabase/use-admin-access", () => ({ useAdminAccess: () => auth.admin }));
vi.mock("@/lib/supabase/use-account-session", () => ({ useAccountSession: () => ({ user: auth.user, isLoading: auth.isLoading }) }));
vi.mock("@/lib/supabase/client", () => ({ createBrowserSupabaseClient: () => auth.configured ? ({ auth: { signOut: auth.signOut } }) : null }));

beforeEach(() => {
  route.pathname = "/";
  route.replace.mockReset();
  route.refresh.mockReset();
  auth.admin = false;
  auth.user = null;
  auth.isLoading = false;
  auth.configured = true;
  auth.signOut.mockReset().mockResolvedValue({ error: null });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

describe("persistent app navigation", () => {
  it("exposes every existing catalog and marks nested routes", () => {
    route.pathname = "/practice/system-design/cache-product-contract";
    render(<AppNavigation />);
    const desktop = within(screen.getByRole("navigation", { name: "Primary navigation" }));
    for (const [name, href] of [["Play", "/"], ["Learn", "/learn"], ["Paths", "/paths"], ["Lessons", "/browse"], ["Practice", "/practice"], ["Interviews", "/interviews"], ["Languages", "/languages"]]) {
      expect(desktop.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(desktop.getByRole("link", { name: "Practice" })).toHaveAttribute("aria-current", "page");
    expect(desktop.getByRole("link", { name: "Play" })).not.toHaveAttribute("aria-current");
  });

  it("keeps lessons, languages and sign in reachable from the compact navigation", () => {
    route.pathname = "/docs/system-design/cache-invalidation";
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
    render(<AppNavigation />);
    expect(within(screen.getByRole("navigation", { name: "Primary navigation" })).getByRole("link", { name: "Lessons" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const dialog = screen.getByRole("dialog", { name: "Explore Codematica" });
    expect(within(dialog).getByRole("link", { name: /Lessons/ })).toHaveAttribute("href", "/browse");
    expect(within(dialog).getByRole("link", { name: /Languages/ })).toHaveAttribute("href", "/languages");
    expect(within(dialog).getByRole("link", { name: /Sign in/ })).toHaveAttribute("href", "/login");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close menu" }));
    expect(dialog).not.toHaveAttribute("open");
  });
});

describe("account and admin navigation", () => {
  it.each([
    ["Knowledge", "/admin/knowledge"],
    ["Interview preparation", "/admin/interview-preparation"],
  ])("preserves %s in both admin menus", (label, href) => {
    auth.admin = true;
    auth.user = { email: "editor@example.test", user_metadata: {} };
    route.pathname = `${href}/detail`;
    render(<AppNavigation />);
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    for (const name of ["Admin navigation", "Admin navigation in menu"]) {
      const link = within(screen.getByRole("navigation", { name })).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("aria-current", "page");
    }
    fireEvent.click(within(screen.getByRole("navigation", { name: "Admin navigation in menu" })).getByRole("link", { name: label }));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it.each([
    [{ full_name: "  Learning User  ", name: "Ignored" }, "Learning User"],
    [{ full_name: null, name: "  Preferred Name  " }, "Preferred Name"],
    [{ full_name: "", name: "" }, "learner"],
    [{ full_name: "  ", name: undefined }, "learner"],
    [{ full_name: 42, name: null }, "learner"],
  ])("normalizes account identity for %j", (metadata, name) => {
    auth.user = { email: "learner@example.test", user_metadata: metadata };
    render(<AppNavigation />);
    expect(screen.getByTestId("sidebar-account-trigger")).toHaveAttribute("aria-label", `Account: ${name}`);
  });
  it("groups the LinkedIn destination under Admin and marks its active route", () => {
    auth.admin = true;
    auth.user = { email: "editor@example.test", user_metadata: { full_name: "Editorial User" } };
    route.pathname = "/admin/linkedin";
    render(<AppNavigation />);
    const admin = within(screen.getByRole("navigation", { name: "Admin navigation" }));
    expect(admin.getByText("Admin")).toBeVisible();
    expect(screen.getByTestId("app-admin-linkedin-icon")).toHaveAttribute("aria-hidden", "true");
    expect(admin.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "/admin/linkedin");
    expect(admin.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("aria-current", "page");
    expect(within(screen.getByRole("navigation", { name: "Primary navigation" })).queryByRole("link", { name: "LinkedIn" })).toBeNull();
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    expect(within(screen.getByRole("navigation", { name: "Admin navigation in menu" })).getByRole("link", { name: "LinkedIn" })).toHaveAttribute("aria-current", "page");
  });

  it("hides Admin for ordinary users and after the account signs out", () => {
    auth.user = { email: "learner@example.test", user_metadata: {} };
    const { rerender } = render(<AppNavigation />);
    expect(screen.queryByTestId("app-admin-navigation")).toBeNull();
    auth.admin = true;
    rerender(<AppNavigation />);
    expect(screen.getByTestId("app-admin-navigation")).toBeVisible();
    auth.user = null;
    rerender(<AppNavigation />);
    expect(screen.queryByTestId("app-admin-navigation")).toBeNull();
  });

  it("replaces sign-in links with the account and signs out through the browser session", async () => {
    auth.user = { email: "learner@example.test", user_metadata: { full_name: "Learning User" } };
    render(<AppNavigation />);
    expect(screen.queryByRole("link", { name: /Sign in/ })).toBeNull();
    const sidebar = screen.getByTestId("sidebar-account-menu");
    expect(within(sidebar).getByText("Learning User")).toBeVisible();
    expect(within(sidebar).getByText("learner@example.test")).toBeVisible();
    fireEvent.click(screen.getByTestId("sidebar-account-trigger"));
    fireEvent.click(within(sidebar).getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" }));
    expect(route.replace).toHaveBeenCalledWith("/");
    expect(route.refresh).toHaveBeenCalledOnce();
  });

  it("shows loading without a misleading sign-in link and falls back to email/account labels", () => {
    auth.isLoading = true;
    const { rerender } = render(<AppNavigation />);
    expect(screen.queryByRole("link", { name: /Sign in/ })).toBeNull();
    auth.isLoading = false;
    auth.user = { email: "learner@example.test", user_metadata: { full_name: 42, name: " " } };
    rerender(<AppNavigation />);
    expect(within(screen.getByTestId("sidebar-account-menu")).getByText("learner")).toBeVisible();
    auth.user = { user_metadata: {} };
    rerender(<AppNavigation />);
    expect(within(screen.getByTestId("sidebar-account-menu")).getByText("Account")).toBeVisible();
  });

  it("keeps the account visible and allows retry when sign-out fails", async () => {
    auth.user = { email: "learner@example.test", user_metadata: {} };
    auth.signOut.mockResolvedValueOnce({ error: { message: "offline" } });
    render(<AppNavigation />);
    const sidebar = screen.getByTestId("sidebar-account-menu");
    fireEvent.click(screen.getByTestId("sidebar-account-trigger"));
    fireEvent.click(within(sidebar).getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(within(sidebar).getByRole("alert")).toHaveTextContent("Couldn't sign out. Please try again."));
    expect(route.replace).not.toHaveBeenCalled();
    expect(within(sidebar).getByRole("button", { name: "Sign out" })).toBeEnabled();
    fireEvent.click(within(sidebar).getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(route.replace).toHaveBeenCalledWith("/"));
  });

  it("offers the same account controls in the phone header and More menu", async () => {
    auth.user = { email: "learner@example.test", user_metadata: { name: "Learning User" } };
    render(<AppNavigation />);
    expect(screen.getByTestId("header-account-trigger")).toHaveAttribute("aria-label", "Account: Learning User");
    fireEvent.click(screen.getByTestId("mobile-nav-more"));
    const sheet = screen.getByTestId("sheet-account-menu");
    fireEvent.click(screen.getByTestId("sheet-account-trigger"));
    fireEvent.click(within(sheet).getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(route.replace).toHaveBeenCalledWith("/"));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it("dismisses an account disclosure with Escape and restores focus", () => {
    auth.user = { email: "learner@example.test", user_metadata: {} };
    render(<AppNavigation />);
    const trigger = screen.getByTestId("sidebar-account-trigger");
    fireEvent.click(trigger);
    expect(screen.getByTestId("sidebar-account-menu")).toHaveAttribute("open");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByTestId("sidebar-account-menu")).toHaveAttribute("open");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.getByTestId("sidebar-account-menu")).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
  });

  it("prevents another sign-out request while one is pending", async () => {
    auth.user = { email: "learner@example.test", user_metadata: {} };
    let finish!: (value: unknown) => void;
    auth.signOut.mockReturnValue(new Promise(done => { finish = done; }));
    render(<AppNavigation />);
    fireEvent.click(screen.getByTestId("sidebar-account-trigger"));
    fireEvent.click(screen.getByTestId("sidebar-sign-out"));
    expect(screen.getByTestId("sidebar-sign-out")).toBeDisabled();
    fireEvent.click(screen.getByTestId("sidebar-sign-out"));
    expect(auth.signOut).toHaveBeenCalledOnce();
    finish({ error: null });
    await waitFor(() => expect(route.replace).toHaveBeenCalledWith("/"));
  });

  it.each(["exception", "unconfigured"])("retains the account when logout is %s", async (failure) => {
    auth.user = { email: "learner@example.test", user_metadata: {} };
    if (failure === "exception") auth.signOut.mockRejectedValue(new Error("offline"));
    else auth.configured = false;
    render(<AppNavigation />);
    fireEvent.click(screen.getByTestId("header-account-trigger"));
    fireEvent.click(screen.getByTestId("header-sign-out"));
    await waitFor(() => expect(within(screen.getByTestId("header-account-menu")).getByRole("alert")).toBeVisible());
    expect(route.replace).not.toHaveBeenCalled();
  });

  it("closes the phone menu when following language/admin links or clicking its backdrop", () => {
    auth.user = { email: "editor@example.test", user_metadata: {} };
    auth.admin = true;
    render(<AppNavigation />);
    const more = screen.getByTestId("mobile-nav-more");
    for (const testId of ["mobile-menu-linkedin", "mobile-menu-japanese", "mobile-menu-notebooks"]) {
      fireEvent.click(more);
      fireEvent.click(screen.getByTestId(testId));
      expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
    }
    fireEvent.click(more);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("heading"));
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute("open");
    fireEvent(dialog, new Event("close"));
    expect(more).toHaveFocus();
  });
});

it("names Japanese and notebook practice under Languages on tablet and phone",()=>{
 route.pathname="/languages/japanese/notebooks";render(<AppNavigation/>);
 const desktop=within(screen.getByRole("navigation",{name:"Primary navigation"}));
 expect(desktop.getByRole("link",{name:"Languages"})).toHaveAttribute("aria-current","page");
 expect(desktop.getByRole("link",{name:/Japanese/})).toHaveAttribute("href","/languages/japanese");
 expect(desktop.getByRole("link",{name:"Notebook practice"})).toHaveAttribute("href","/languages/japanese/notebooks");
 fireEvent.click(screen.getByRole("button",{name:"More"}));
 expect(within(screen.getByRole("dialog")).getByRole("link",{name:"Notebook practice"})).toHaveAttribute("href","/languages/japanese/notebooks");
});
