import { fetchMe, updateMe, deleteAccount, exportData, logout } from "./me";
import { apiFetch } from "./client";

jest.mock("./client");

describe("fetchMe", () => {
  test("GETs /api/me", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ display_name: "Ada" });
    await fetchMe();
    expect(apiFetch).toHaveBeenCalledWith("/api/me");
  });
});

describe("updateMe", () => {
  test("PATCHes /api/me with the given fields", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ leaderboard_visible: 1 });
    await updateMe({ leaderboard_visible: true });
    expect(apiFetch).toHaveBeenCalledWith("/api/me", { method: "PATCH", body: { leaderboard_visible: true } });
  });
});

describe("deleteAccount", () => {
  test("DELETEs /api/me", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(undefined);
    await deleteAccount();
    expect(apiFetch).toHaveBeenCalledWith("/api/me", { method: "DELETE" });
  });
});

describe("exportData", () => {
  test("GETs /api/me/export", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ user: {}, prayer_days: [] });
    await exportData();
    expect(apiFetch).toHaveBeenCalledWith("/api/me/export");
  });
});

describe("logout", () => {
  test("POSTs /api/auth/logout", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(undefined);
    await logout();
    expect(apiFetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
