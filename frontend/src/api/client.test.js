import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerUser, isLoggedIn, saveTokens, clearTokens } from "./client";

describe("token storage helpers", () => {
  beforeEach(() => localStorage.clear());

  it("isLoggedIn is false when no token stored", () => {
    expect(isLoggedIn()).toBe(false);
  });

  it("saveTokens stores access and refresh tokens", () => {
    saveTokens({ access: "abc123", refresh: "def456" });
    expect(localStorage.getItem("access_token")).toBe("abc123");
    expect(localStorage.getItem("refresh_token")).toBe("def456");
    expect(isLoggedIn()).toBe(true);
  });

  it("clearTokens removes both tokens", () => {
    saveTokens({ access: "abc123", refresh: "def456" });
    clearTokens();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});

describe("registerUser", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a POST to /api/register/ with the form as JSON", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, username: "citizen1", email: "c1@test.com" }),
    });

    const result = await registerUser({ username: "citizen1", email: "c1@test.com", password: "testpass123" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/register/"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "citizen1", email: "c1@test.com", password: "testpass123" }),
      })
    );
    expect(result.username).toBe("citizen1");
  });

  it("flattens DRF validation errors into a single readable message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ username: ["Username already taken."] }),
    });

    await expect(
      registerUser({ username: "citizen1", email: "c1@test.com", password: "testpass123" })
    ).rejects.toThrow("Username already taken.");
  });
});