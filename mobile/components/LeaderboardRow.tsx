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

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LeaderboardRow({ rank, displayName, points, eligiblePoints, sort, isMe = false }: LeaderboardRowProps) {
  const pct = consistencyPct(points, eligiblePoints);
  const primaryMetric = sort === "points" ? `${points}` : `${pct}%`;
  const primaryUnit = sort === "points" ? "pts" : "";
  const medal = MEDALS[rank];

  return (
    <View testID={`leaderboard-row-${rank}`} style={[styles.row, isMe && styles.rowMe]}>
      <View style={[styles.avatar, isMe && styles.avatarMe]}>
        <Text style={[styles.avatarText, isMe && styles.avatarTextMe]}>
          {initials(displayName)}
        </Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
        {isMe ? " (you)" : ""}
      </Text>
      <View style={styles.right}>
        <View style={styles.metricRow}>
          <Text style={styles.primaryMetric}>{primaryMetric}</Text>
          {primaryUnit ? <Text style={styles.unit}> {primaryUnit}</Text> : null}
        </View>
        <Text style={styles.secondary}>{points} pts · {pct}%</Text>
      </View>
      <Text style={styles.rankBadge}>{medal ?? rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: "#ECEAE3",
  },
  rowMe: {
    backgroundColor: "#EBF5F0",
    borderColor: "#A8D5C2",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0EDE9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMe: {
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  avatarTextMe: {
    color: "#FFFFFF",
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  right: {
    alignItems: "flex-end",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  primaryMetric: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  unit: {
    fontSize: 12,
    color: colors.muted,
  },
  secondary: {
    fontSize: 11,
    color: colors.muted,
  },
  rankBadge: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
  },
});
