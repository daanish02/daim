import { describe, expect, test } from "vitest";
import { prayerStateToPoints, periodKeysForDate } from "../../src/services/scoringService";

describe("prayerStateToPoints", () => {
  test("prayed (1) scores 1 point, 1 eligible", () => {
    expect(prayerStateToPoints(1)).toEqual({ points: 1, eligible: 1 });
  });

  test("exempt (-1) scores 0 points, 0 eligible (excluded)", () => {
    expect(prayerStateToPoints(-1)).toEqual({ points: 0, eligible: 0 });
  });

  test("pending before deadline (null, not locked) scores 0 points, 0 eligible", () => {
    expect(prayerStateToPoints(null, { locked: false })).toEqual({ points: 0, eligible: 0 });
  });

  test("unrecorded after deadline (null, locked) scores 0 points, 1 eligible", () => {
    expect(prayerStateToPoints(null, { locked: true })).toEqual({ points: 0, eligible: 1 });
  });
});

describe("periodKeysForDate", () => {
  // 2026-03-11 is a Wednesday, ISO week 11
  test("returns weekly, monthly, yearly, alltime keys for a date", () => {
    expect(periodKeysForDate("2026-03-11")).toEqual({
      weekly: "2026-W11",
      monthly: "2026-03",
      yearly: "2026",
      alltime: "alltime",
    });
  });

  test("ISO week rolls over correctly at year boundary (2025-12-31 is W01 2026)", () => {
    expect(periodKeysForDate("2025-12-31").weekly).toBe("2026-W01");
  });
});
