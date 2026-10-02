import { Pressable, View, Text, StyleSheet } from "react-native";
import type { PrayerName, PrayerValue } from "../services/api/home";
import { colors, spacing, radii } from "../theme/tokens";

const LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const TIMES: Record<PrayerName, string> = {
  fajr: "Before sunrise",
  dhuhr: "Midday",
  asr: "Afternoon",
  maghrib: "After sunset",
  isha: "Night",
};

interface PrayerRowProps {
  name: PrayerName;
  value: PrayerValue;
  onPress: () => void;
}

export function PrayerRow({ name, value, onPress }: PrayerRowProps) {
  const isPrayed = value === 1;
  const isExempt = value === -1;

  return (
    <Pressable
      testID={`prayer-row-${name}`}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isPrayed }}
      style={({ pressed }) => [
        styles.row,
        isPrayed && styles.rowPrayed,
        isExempt && styles.rowExempt,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.label, isPrayed && styles.labelPrayed]}>{LABELS[name]}</Text>
        <Text style={styles.time}>{isExempt ? "Exempt" : TIMES[name]}</Text>
      </View>
      <View style={[styles.indicator, isPrayed && styles.indicatorPrayed, isExempt && styles.indicatorExempt]}>
        {isPrayed && <Text style={styles.check}>✓</Text>}
        {isExempt && <Text style={styles.check}>–</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#ECEAE3",
  },
  rowPrayed: {
    backgroundColor: "#EBF5F0",
    borderColor: "#A8D5C2",
  },
  rowExempt: {
    backgroundColor: "#F5F3EE",
    borderColor: "#D8D5CE",
  },
  rowPressed: {
    opacity: 0.75,
  },
  left: {
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  labelPrayed: {
    color: colors.primary,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
  },
  indicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#D0CEC7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  indicatorPrayed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  indicatorExempt: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  check: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
});
