import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNavigation } from "./AppHeader";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("persistent app navigation", () => {
  it("exposes every existing catalog and marks nested routes", () => {
    route.pathname = "/practice/system-design/cache-product-contract";
    render(<AppNavigation />);
    const desktop = within(screen.getByRole("navigation", { name: "Primary navigation" }));
    for (const [name, href] of [["Home", "/"], ["Paths", "/paths"], ["Lessons", "/browse"], ["Practice", "/practice"], ["Interviews", "/interviews"], ["Languages", "/languages"]]) {
      expect(desktop.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(desktop.getByRole("link", { name: "Practice" })).toHaveAttribute("aria-current", "page");
    expect(desktop.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
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

it("names Japanese and notebook practice under Languages on tablet and phone",()=>{
 route.pathname="/languages/japanese/notebooks";render(<AppNavigation/>);
 const desktop=within(screen.getByRole("navigation",{name:"Primary navigation"}));
 expect(desktop.getByRole("link",{name:"Languages"})).toHaveAttribute("aria-current","page");
 expect(desktop.getByRole("link",{name:/Japanese/})).toHaveAttribute("href","/languages/japanese");
 expect(desktop.getByRole("link",{name:"Notebook practice"})).toHaveAttribute("href","/languages/japanese/notebooks");
 fireEvent.click(screen.getByRole("button",{name:"More"}));
 expect(within(screen.getByRole("dialog")).getByRole("link",{name:"Notebook practice"})).toHaveAttribute("href","/languages/japanese/notebooks");
});
