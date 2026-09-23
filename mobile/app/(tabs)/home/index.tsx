import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHome, setPrayerState, type PrayerName } from "../../../services/api/home";
import { PrayerRow } from "../../../components/PrayerRow";
import { ContributionGraph } from "../../../components/ContributionGraph";
import { ConsistencyGraph } from "../../../components/ConsistencyGraph";
import { colors, spacing } from "../../../theme/tokens";

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["home"], queryFn: fetchHome });

  const mutation = useMutation({
    mutationFn: (prayer: PrayerName) => setPrayerState(data!.today.prayer_date, prayer),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["home"] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn't load your prayers. Pull to refresh.</Text>
      </View>
    );
  }

  const prayedCount = PRAYER_NAMES.filter((p) => data.today[p] === 1).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Today</Text>

      <View style={styles.prayerList}>
        {PRAYER_NAMES.map((prayer) => (
          <PrayerRow
            key={prayer}
            name={prayer}
            value={data.today[prayer]}
            onPress={() => {
              // Tap an unrecorded prayer -> prayed. Undo/change while
              // editable is a later iteration (route only supports
              // setting to prayed right now).
              if (data.today[prayer] !== 1) mutation.mutate(prayer);
            }}
          />
        ))}
      </View>

      <Text style={styles.summary}>
        {prayedCount} / 5 prayed
      </Text>

      <Text style={styles.sectionLabel}>8-week contribution</Text>
      <ContributionGraph days={data.contribution} />

      <Text style={styles.sectionLabel}>4-week consistency</Text>
      <ConsistencyGraph weeks={data.consistency} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  error: {
    color: colors.muted,
    fontSize: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  prayerList: {
    marginBottom: spacing.md,
  },
  summary: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: "uppercase",
  },
});
