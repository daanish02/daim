import { View, StyleSheet } from "react-native";
import { colors, spacing, radii } from "../theme/tokens";

interface ConsistencyWeek {
  period_key: string;
  consistency: number;
}

interface ConsistencyGraphProps {
  weeks: ConsistencyWeek[];
}

const MAX_BAR_HEIGHT = 48;

/** Compact 4-week consistency trend, fixed 0-100% scale. Secondary to today's prayers. */
export function ConsistencyGraph({ weeks }: ConsistencyGraphProps) {
  return (
    <View style={styles.row}>
      {weeks.map((week) => (
        <View key={week.period_key} style={styles.barTrack}>
          <View
            testID={`consistency-bar-${week.period_key}`}
            accessibilityLabel={`${week.period_key}: ${week.consistency}%`}
            style={[
              styles.bar,
              { height: Math.max(2, (week.consistency / 100) * MAX_BAR_HEIGHT) },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    height: MAX_BAR_HEIGHT,
  },
  barTrack: {
    justifyContent: "flex-end",
    height: MAX_BAR_HEIGHT,
  },
  bar: {
    width: 20,
    backgroundColor: colors.accent,
    borderRadius: radii.sm / 2,
  },
});
