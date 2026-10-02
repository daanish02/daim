import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHome, setPrayerState, setDayExempt, type PrayerName, type PrayerValue } from "../../../services/api/home";
import { PrayerRow } from "../../../components/PrayerRow";
import { ContributionGraph } from "../../../components/ContributionGraph";
import { ConsistencyGraph } from "../../../components/ConsistencyGraph";
import { colors, spacing, radii } from "../../../theme/tokens";

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["home"], queryFn: fetchHome });

  const mutation = useMutation({
    mutationFn: ({ prayer, value }: { prayer: PrayerName; value: PrayerValue }) =>
      setPrayerState(data!.today.prayer_date, prayer, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["home"] }),
  });

  const exemptMutation = useMutation({
    mutationFn: () => setDayExempt(data!.today.prayer_date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["home"] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Couldn't load your prayers.</Text>
        <Text style={styles.errorSub}>Pull to refresh.</Text>
      </View>
    );
  }

  const prayedCount = PRAYER_NAMES.filter((p) => data.today[p] === 1).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Today</Text>
          <Text style={styles.date}>{todayLabel()}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsGlyph}>{"⚙︎"}</Text>
        </Pressable>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressCount}>{prayedCount}<Text style={styles.progressTotal}> / 5</Text></Text>
        <Text style={styles.progressLabel}>prayers today</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: prayedCount }]} />
          <View style={{ flex: 5 - prayedCount }} />
        </View>
      </View>

      <View style={styles.prayerList}>
        {PRAYER_NAMES.map((prayer) => (
          <PrayerRow
            key={prayer}
            name={prayer}
            value={data.today[prayer]}
            onPress={() => {
              const nextValue: PrayerValue = data.today[prayer] === 1 ? null : 1;
              mutation.mutate({ prayer, value: nextValue });
            }}
          />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.exemptButton, pressed && { opacity: 0.7 }]}
        onPress={() => exemptMutation.mutate()}
        disabled={exemptMutation.isPending}
      >
        <Text style={styles.exemptButtonText}>Mark day as exempt</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>8-week contribution</Text>
      <ContributionGraph
        days={data.contribution}
        onPressDay={(date) => router.push(`/day/${date}`)}
      />

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
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  error: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  errorSub: {
    color: colors.muted,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECEAE3",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsGlyph: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  progressCount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 40,
  },
  progressTotal: {
    fontSize: 22,
    fontWeight: "400",
    color: "rgba(255,255,255,0.7)",
  },
  progressLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.sm,
  },
  progressTrack: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  prayerList: {
    marginBottom: spacing.sm,
  },
  exemptButton: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#D0CEC7",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  exemptButtonText: {
    fontSize: 14,
    color: colors.muted,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
});
