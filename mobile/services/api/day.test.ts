import { fetchDay } from "./day";
import { apiFetch } from "./client";

jest.mock("./client");

describe("fetchDay", () => {
  test("GETs the single-day range and returns that day, or a blank pending day if none logged yet", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([{ prayer_date: "2026-03-11", fajr: 1, dhuhr: null, asr: null, maghrib: null, isha: null }]);
    const day = await fetchDay("2026-03-11");
    expect(apiFetch).toHaveBeenCalledWith("/api/prayer-days?from=2026-03-11&to=2026-03-11");
    expect(day.fajr).toBe(1);
  });

  test("returns an all-pending day when the range comes back empty", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);
    const day = await fetchDay("2026-03-12");
    expect(day).toEqual({
      prayer_date: "2026-03-12",
      fajr: null,
      dhuhr: null,
      asr: null,
      maghrib: null,
      isha: null,
    });
  });
});
