import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  it("hides Apple login until the provider flag is enabled", () => {
    render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /continue with apple/i })).not.toBeInTheDocument();
  });

  it("shows Apple login when the provider flag is enabled", () => {
    render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled shouldSync={false} />);

    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeVisible();
  });

  it("disables auth controls when Supabase env vars are missing", () => {
    render(<LoginForm nextPath="/" isAuthConfigured={false} isAppleEnabled={false} shouldSync={false} />);

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /sign in with email/i })).toBeDisabled();
    expect(screen.getByText(/auth is not configured/i)).toBeVisible();
  });
});
