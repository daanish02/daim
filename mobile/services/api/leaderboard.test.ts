import { fetchLeaderboard } from "./leaderboard";
import { apiFetch } from "./client";

jest.mock("./client");

describe("fetchLeaderboard", () => {
  test("GETs /api/leaderboard with period and sort query params", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ entries: [], me: null });
    await fetchLeaderboard("monthly", "points");
    expect(apiFetch).toHaveBeenCalledWith("/api/leaderboard?period=monthly&sort=points");
  });

  test("supports weekly/consistency", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ entries: [], me: null });
    await fetchLeaderboard("weekly", "consistency");
    expect(apiFetch).toHaveBeenCalledWith("/api/leaderboard?period=weekly&sort=consistency");
  });

  test("returns the entries and me from the response", async () => {
    const payload = {
      entries: [{ user_id: "u1", display_name: "Ahmed", points: 132, eligible_points: 140 }],
      me: { rank: 3, points: 100, eligible_points: 140 },
    };
    (apiFetch as jest.Mock).mockResolvedValue(payload);
    const result = await fetchLeaderboard("monthly", "points");
    expect(result).toEqual(payload);
  });
});
