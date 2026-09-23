import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDay } from "../../services/api/day";
import { setPrayerState, setDayExempt, type PrayerName, type PrayerValue } from "../../services/api/home";
import { PrayerRow } from "../../components/PrayerRow";
import { colors, spacing, radii } from "../../theme/tokens";

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: day, isLoading, isError } = useQuery({
    queryKey: ["day", date],
    queryFn: () => fetchDay(date),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["day", date] });
    queryClient.invalidateQueries({ queryKey: ["home"] });
  };

  const setPrayer = useMutation({
    mutationFn: ({ prayer, value }: { prayer: PrayerName; value: PrayerValue }) =>
      setPrayerState(date, prayer, value),
    onSuccess: invalidate,
  });

  const setExempt = useMutation({
    mutationFn: () => setDayExempt(date),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !day) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn't load this day.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>{date}</Text>

      <View style={styles.prayerList}>
        {PRAYER_NAMES.map((prayer) => (
          <PrayerRow
            key={prayer}
            name={prayer}
            value={day[prayer]}
            onPress={() => {
              const nextValue: PrayerValue = day[prayer] === 1 ? null : 1;
              setPrayer.mutate({ prayer, value: nextValue });
            }}
          />
        ))}
      </View>

      <Pressable
        style={styles.exemptButton}
        onPress={() => setExempt.mutate()}
        disabled={setExempt.isPending}
      >
        <Text style={styles.exemptButtonText}>Mark day as exempt</Text>
      </Pressable>
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
  back: {
    color: colors.primary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  prayerList: {
    marginBottom: spacing.lg,
  },
  exemptButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
  },
  exemptButtonText: {
    fontSize: 15,
    color: colors.text,
  },
});
