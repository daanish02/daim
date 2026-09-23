import { View, Text, StyleSheet } from "react-native";
import type { LeaderboardSort } from "../services/api/leaderboard";
import { colors, spacing, radii } from "../theme/tokens";

interface LeaderboardRowProps {
  rank: number;
  displayName: string;
  points: number;
  eligiblePoints: number;
  sort: LeaderboardSort;
  isMe?: boolean;
}

function consistencyPct(points: number, eligible: number): number {
  return eligible > 0 ? Math.round((points / eligible) * 100) : 0;
}

/** One leaderboard row. Primary metric matches the active sort; no hidden combined score, per PRD #10. */
export function LeaderboardRow({ rank, displayName, points, eligiblePoints, sort, isMe = false }: LeaderboardRowProps) {
  const pct = consistencyPct(points, eligiblePoints);
  const primaryMetric = sort === "points" ? `${points} points` : `${pct}%`;

  return (
    <View testID={`leaderboard-row-${rank}`} style={[styles.row, isMe && styles.rowMe]}>
      <Text style={styles.rank}>{rank}</Text>
      <Text style={styles.name}>{displayName}</Text>
      <View style={styles.metrics}>
        <Text testID="leaderboard-row-primary-metric" style={styles.primaryMetric}>
          {primaryMetric}
        </Text>
        <Text style={styles.secondaryMetric}>
          {points} pts · {pct}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  rowMe: {
    backgroundColor: "#EAF3EF",
  },
  rank: {
    width: 28,
    fontSize: 15,
    color: colors.muted,
    fontWeight: "600",
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  metrics: {
    alignItems: "flex-end",
  },
  primaryMetric: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "700",
  },
  secondaryMetric: {
    fontSize: 12,
    color: colors.muted,
  },
});
