import { describe, expect, test } from "vitest";
import { deadlineForPrayerDate, isLocked } from "../../src/services/deadlineService";

describe("deadlineForPrayerDate", () => {
  test("deadline is end of second calendar day after prayer date, in given timezone", () => {
    // Wednesday 2026-03-11 -> editable until Friday 2026-03-13 23:59:59 in tz
    const deadline = deadlineForPrayerDate("2026-03-11", "Asia/Kolkata");
    expect(deadline).toBe("2026-03-13T18:29:59.000Z"); // 23:59:59 IST (+05:30) = 18:29:59 UTC
  });

  test("UTC timezone: deadline is straightforward", () => {
    const deadline = deadlineForPrayerDate("2026-03-11", "UTC");
    expect(deadline).toBe("2026-03-13T23:59:59.000Z");
  });
});

describe("isLocked", () => {
  test("false when now is before deadline", () => {
    expect(isLocked("2026-03-13T23:59:59.000Z", new Date("2026-03-13T00:00:00.000Z"))).toBe(false);
  });

  test("true when now is after deadline", () => {
    expect(isLocked("2026-03-13T23:59:59.000Z", new Date("2026-03-14T00:00:00.000Z"))).toBe(true);
  });

  test("false exactly at deadline instant", () => {
    expect(isLocked("2026-03-13T23:59:59.000Z", new Date("2026-03-13T23:59:59.000Z"))).toBe(false);
  });
});
