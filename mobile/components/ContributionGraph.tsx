import { View, Pressable, StyleSheet } from "react-native";
import type { PrayerDay } from "../services/api/home";
import { colors, spacing, radii } from "../theme/tokens";

const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

// Intensity per PRD #8: 0/5 empty -> 5/5 strongest. Exempt days count toward
// intensity too (they must not read as failures, i.e. not render as empty).
function prayedCount(day: PrayerDay): number {
  return PRAYER_KEYS.filter((k) => day[k] === 1 || day[k] === -1).length;
}

const LEVEL_COLORS = [
  "#E7E5DE", // 0/5 - empty
  "#C9E4DB",
  "#9BCFBB",
  "#5FA98A",
  "#2E8365",
  colors.primary, // 5/5 - strongest
];

interface ContributionGraphProps {
  days: PrayerDay[];
  onPressDay?: (date: string) => void;
}

/**
 * GitHub-style 8-week (56-day) contribution grid. Purely for personal
 * feedback. Tapping a square opens that day (PRD #7: "Tapping a day opens
 * its prayers and allows editing if the editing window is still open").
 */
export function ContributionGraph({ days, onPressDay }: ContributionGraphProps) {
  return (
    <View style={styles.grid}>
      {days.map((day) => {
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
  );
}

const SQUARE_SIZE = 12;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs / 2,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: radii.sm / 2,
  },
});
