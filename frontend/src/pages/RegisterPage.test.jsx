import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { registerUser } from "../api/client";

vi.mock("../api/client", () => ({
  registerUser: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders username, email, and password fields", () => {
    renderPage();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("calls registerUser with form values and navigates to /login on success", async () => {
    registerUser.mockResolvedValueOnce({ id: 1, username: "citizen1" });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Username"), "citizen1");
    await user.type(screen.getByPlaceholderText("Email"), "c1@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        username: "citizen1",
        email: "c1@test.com",
        password: "testpass123",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("shows an error message and does NOT navigate when registration fails", async () => {
    registerUser.mockRejectedValueOnce(new Error("Username already taken."));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Username"), "citizen1");
    await user.type(screen.getByPlaceholderText("Email"), "c1@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByText("Username already taken.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});