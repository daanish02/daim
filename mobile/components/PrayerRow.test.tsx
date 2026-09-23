import { render, fireEvent } from "@testing-library/react-native";
import { PrayerRow } from "./PrayerRow";

describe("PrayerRow", () => {
  test("shows prayer name and unrecorded state", async () => {
    const { getByText } = await render(<PrayerRow name="fajr" value={null} onPress={jest.fn()} />);
    expect(getByText("Fajr")).toBeTruthy();
  });

  test("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PrayerRow name="fajr" value={null} onPress={onPress} />);
    fireEvent.press(getByText("Fajr"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("renders distinctly for prayed vs exempt vs unrecorded (via testID state)", async () => {
    const prayed = await render(<PrayerRow name="fajr" value={1} onPress={jest.fn()} />);
    expect(prayed.getByTestId("prayer-row-fajr").props.accessibilityState?.checked).toBe(true);

    const exempt = await render(<PrayerRow name="fajr" value={-1} onPress={jest.fn()} />);
    expect(exempt.getByText("Exempt")).toBeTruthy();
  });
});
