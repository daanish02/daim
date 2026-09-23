import { render } from "@testing-library/react-native";
import { ConsistencyGraph } from "./ConsistencyGraph";

describe("ConsistencyGraph", () => {
  test("renders one bar per week", async () => {
    const weeks = [
      { period_key: "2026-W08", consistency: 40 },
      { period_key: "2026-W09", consistency: 60 },
      { period_key: "2026-W10", consistency: 80 },
      { period_key: "2026-W11", consistency: 100 },
    ];
    const { getAllByTestId } = await render(<ConsistencyGraph weeks={weeks} />);
    expect(getAllByTestId(/consistency-bar-/)).toHaveLength(4);
  });

  test("bar height reflects the consistency percentage", async () => {
    const weeks = [{ period_key: "2026-W11", consistency: 50 }];
    const { getByTestId } = await render(<ConsistencyGraph weeks={weeks} />);
    expect(getByTestId("consistency-bar-2026-W11").props.accessibilityLabel).toContain("50%");
  });
});
