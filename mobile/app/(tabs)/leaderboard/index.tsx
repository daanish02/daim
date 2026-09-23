import { useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard, type LeaderboardPeriod, type LeaderboardSort } from "../../../services/api/leaderboard";
import { LeaderboardRow } from "../../../components/LeaderboardRow";
import { colors, spacing, radii } from "../../../theme/tokens";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "alltime", label: "All time" },
];

const SORTS: { value: LeaderboardSort; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "consistency", label: "Consistency" },
];

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("monthly"); // PRD #10: monthly is default
  const [sort, setSort] = useState<LeaderboardSort>("points");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard", period, sort],
    queryFn: () => fetchLeaderboard(period, sort),
  });

  return (
    <View style={styles.container}>
      <View style={styles.selectorRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[styles.chip, period === p.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, period === p.value && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.selectorRow}>
        {SORTS.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setSort(s.value)}
            style={[styles.chip, sort === s.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, sort === s.value && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Text style={styles.error}>Couldn't load the leaderboard.</Text>
        </View>
      )}

      {data && (
        <>
          <FlatList
            data={data.entries}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item, index }) => (
              <LeaderboardRow
                rank={index + 1}
                displayName={item.display_name}
                points={item.points}
                eligiblePoints={item.eligible_points}
                sort={sort}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No one on the leaderboard yet for this period.</Text>
            }
          />
          {data.me && (
            <View style={styles.meFooter}>
              <LeaderboardRow
                rank={data.me.rank}
                displayName="You"
                points={data.me.points}
                eligiblePoints={data.me.eligible_points}
                sort={sort}
                isMe
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  selectorRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "#EFEDE6",
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: colors.muted,
    fontSize: 16,
  },
  empty: {
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  meFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E3DC",
    paddingTop: spacing.sm,
  },
});
