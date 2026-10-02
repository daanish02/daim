import { View, Pressable, Text, StyleSheet } from "react-native";
import type { PrayerDay } from "../services/api/home";
import { colors, spacing, radii } from "../theme/tokens";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

function prayedCount(day: PrayerDay): number {
  return PRAYER_KEYS.filter((k) => day[k] === 1 || day[k] === -1).length;
}

const LEVEL_COLORS = [
  "#E7E5DE",
  "#C9E4DB",
  "#9BCFBB",
  "#5FA98A",
  "#2E8365",
  colors.primary,
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface ContributionGraphProps {
  days: PrayerDay[];
  onPressDay?: (date: string) => void;
}

export function ContributionGraph({ days, onPressDay }: ContributionGraphProps) {
  // Group flat array into weeks (columns of 7 days)
  const weeks: PrayerDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.column}>
            {week.map((day) => {
              const count = prayedCount(day);
              return (
                <Pressable
                  key={day.prayer_date}
                  testID={`contribution-square-${day.prayer_date}`}
                  accessibilityLabel={`${day.prayer_date}: ${count}/5`}
                  accessibilityRole={onPressDay ? "button" : undefined}
                  onPress={onPressDay ? () => onPressDay(day.prayer_date) : undefined}
                  style={[styles.square, { backgroundColor: LEVEL_COLORS[count] }]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const SQUARE = 28;
const GAP = 5;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  dayLabels: {
    gap: GAP,
    paddingTop: 1,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.muted,
    width: 12,
    height: SQUARE,
    lineHeight: SQUARE,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    gap: GAP,
    flex: 1,
  },
  column: {
    flex: 1,
    gap: GAP,
  },
  square: {
    aspectRatio: 1,
    borderRadius: radii.sm / 2,
  },
});
