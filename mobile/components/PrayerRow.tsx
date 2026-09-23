import { Pressable, Text, StyleSheet } from "react-native";
import type { PrayerName, PrayerValue } from "../services/api/home";
import { colors, spacing, radii } from "../theme/tokens";

const LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

interface PrayerRowProps {
  name: PrayerName;
  value: PrayerValue;
  onPress: () => void;
}

/**
 * One tap-to-log prayer row. Unrecorded is neutral (○), never styled as a
 * failure, per PRD #13's "reports what was recorded" rule.
 */
export function PrayerRow({ name, value, onPress }: PrayerRowProps) {
  const isPrayed = value === 1;
  const isExempt = value === -1;

  return (
    <Pressable
      testID={`prayer-row-${name}`}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPrayed }}
      style={styles.row}
    >
      <Text style={styles.label}>{LABELS[name]}</Text>
      <Text style={[styles.status, isPrayed && styles.statusPrayed]}>
        {isPrayed ? "✓" : isExempt ? "Exempt" : "○"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  status: {
    fontSize: 16,
    color: colors.muted,
  },
  statusPrayed: {
    color: colors.primary,
    fontWeight: "700",
  },
});
