import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserPage from "./UserPage";
import { getCurrentUser, isLoggedIn } from "../api/client";

vi.mock("../api/client", () => ({
  getCurrentUser: vi.fn(),
  isLoggedIn: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <UserPage />
    </MemoryRouter>
  );
}

describe("UserPage role-based rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoggedIn.mockReturnValue(true);
  });

  it("shows 'Report an Issue' link for a citizen, but not officer/admin links", async () => {
    getCurrentUser.mockResolvedValueOnce({
      id: 1, username: "citizen1", email: "c1@test.com", role: "citizen", officer_profile: null,
    });
    renderPage();

    expect(await screen.findByText("+ Report an Issue")).toBeInTheDocument();
    expect(screen.queryByText("Officer Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Officers")).not.toBeInTheDocument();
  });

  it("shows Officer Dashboard link (not Manage Officers) for an officer", async () => {
    getCurrentUser.mockResolvedValueOnce({
      id: 2, username: "officer1", email: "o1@gov.in", role: "officer",
      officer_profile: { designation: "MRO", department: "Revenue", jurisdiction_area: "Ward 5" },
    });
    renderPage();

    expect(await screen.findByText("Officer Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Manage Officers")).not.toBeInTheDocument();
    expect(screen.queryByText("+ Report an Issue")).not.toBeInTheDocument();
  });

  it("shows BOTH Officer Dashboard and Manage Officers links for an admin", async () => {
    getCurrentUser.mockResolvedValueOnce({
      id: 3, username: "superadmin", email: "admin@civicpulse.local", role: "admin", officer_profile: null,
    });
    renderPage();

    expect(await screen.findByText("Officer Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manage Officers")).toBeInTheDocument();
  });

  it("redirects to /login if not logged in, without calling the API", () => {
    isLoggedIn.mockReturnValue(false);
    renderPage();

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});