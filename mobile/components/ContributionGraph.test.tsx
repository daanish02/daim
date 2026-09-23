import { render, fireEvent } from "@testing-library/react-native";
import { ContributionGraph } from "./ContributionGraph";
import type { PrayerDay } from "../services/api/home";

function makeDay(prayer_date: string, prayedCount: number): PrayerDay {
  const values = [1, 1, 1, 1, 1].slice(0, prayedCount).concat(Array(5 - prayedCount).fill(null));
  const [fajr, dhuhr, asr, maghrib, isha] = values as PrayerDay["fajr"][];
  return { prayer_date, fajr, dhuhr, asr, maghrib, isha };
}

describe("ContributionGraph", () => {
  test("renders one square per day", async () => {
    const days = Array.from({ length: 56 }, (_, i) => {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      return makeDay(date, 0);
    });
    const { getAllByTestId } = await render(<ContributionGraph days={days} />);
    expect(getAllByTestId(/contribution-square-/)).toHaveLength(56);
  });

  test("a fully-prayed day gets the strongest intensity level", async () => {
    const days = [makeDay("2026-03-11", 5)];
    const { getByTestId } = await render(<ContributionGraph days={days} />);
    expect(getByTestId("contribution-square-2026-03-11").props.accessibilityLabel).toContain("5/5");
  });

  test("an empty day gets level 0", async () => {
    const days = [makeDay("2026-03-11", 0)];
    const { getByTestId } = await render(<ContributionGraph days={days} />);
    expect(getByTestId("contribution-square-2026-03-11").props.accessibilityLabel).toContain("0/5");
  });

  test("tapping a square calls onPressDay with that date", async () => {
    const onPressDay = jest.fn();
    const days = [makeDay("2026-03-11", 2)];
    const { getByTestId } = await render(<ContributionGraph days={days} onPressDay={onPressDay} />);
    fireEvent.press(getByTestId("contribution-square-2026-03-11"));
    expect(onPressDay).toHaveBeenCalledWith("2026-03-11");
  });
});
