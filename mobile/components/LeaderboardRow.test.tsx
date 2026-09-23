import { render } from "@testing-library/react-native";
import { LeaderboardRow } from "./LeaderboardRow";

describe("LeaderboardRow", () => {
  test("shows rank, display name, points, and consistency", async () => {
    const { getByText, getByTestId } = await render(
      <LeaderboardRow rank={1} displayName="Ahmed" points={132} eligiblePoints={140} sort="points" />,
    );
    expect(getByText("1")).toBeTruthy();
    expect(getByText("Ahmed")).toBeTruthy();
    expect(getByTestId("leaderboard-row-primary-metric").props.children).toContain("132");
    expect(getByText(/94%/)).toBeTruthy();
  });

  test("highlights consistency when sort is consistency", async () => {
    const { getByTestId } = await render(
      <LeaderboardRow rank={2} displayName="Yusuf" points={128} eligiblePoints={140} sort="consistency" />,
    );
    expect(getByTestId("leaderboard-row-primary-metric").props.children).toContain("91%");
  });

  test("renders as highlighted when isMe is true", async () => {
    const { getByTestId } = await render(
      <LeaderboardRow rank={3} displayName="Me" points={100} eligiblePoints={140} sort="points" isMe />,
    );
    expect(getByTestId("leaderboard-row-3").props.style).toBeTruthy();
  });
});
