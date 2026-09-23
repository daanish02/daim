import { fetchHome, setPrayerState, setDayExempt } from "./home";
import { apiFetch } from "./client";

jest.mock("./client");

describe("fetchHome", () => {
  test("GETs /api/home", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ today: {}, contribution: [], consistency: [] });
    await fetchHome();
    expect(apiFetch).toHaveBeenCalledWith("/api/home");
  });
});

describe("setPrayerState", () => {
  test("PUTs to /api/prayer-days/:date/:prayer", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11", fajr: 1 });
    await setPrayerState("2026-03-11", "fajr");
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/fajr", { method: "PUT" });
  });
});

describe("setDayExempt", () => {
  test("PUTs to /api/prayer-days/:date/exempt", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11" });
    await setDayExempt("2026-03-11");
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/exempt", { method: "PUT" });
  });
});
