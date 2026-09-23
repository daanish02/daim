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
  test("defaults to marking prayed (no body) for backward compatibility", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11", fajr: 1 });
    await setPrayerState("2026-03-11", "fajr");
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/fajr", { method: "PUT" });
  });

  test("sends explicit value to undo (null) an already-prayed prayer", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11", fajr: null });
    await setPrayerState("2026-03-11", "fajr", null);
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/fajr", {
      method: "PUT",
      body: { value: null },
    });
  });

  test("sends explicit value -1 for exempt", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11", fajr: -1 });
    await setPrayerState("2026-03-11", "fajr", -1);
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/fajr", {
      method: "PUT",
      body: { value: -1 },
    });
  });
});

describe("setDayExempt", () => {
  test("PUTs to /api/prayer-days/:date/exempt", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ prayer_date: "2026-03-11" });
    await setDayExempt("2026-03-11");
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days/2026-03-11/exempt", { method: "PUT" });
  });
});
