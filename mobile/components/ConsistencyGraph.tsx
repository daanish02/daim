import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radii } from "../theme/tokens";

interface ConsistencyWeek {
  period_key: string;
  consistency: number;
}

interface ConsistencyGraphProps {
  weeks: ConsistencyWeek[];
}

const MAX_BAR_HEIGHT = 72;

export function ConsistencyGraph({ weeks }: ConsistencyGraphProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {weeks.map((week) => {
          const pct = Math.round(week.consistency);
          const barHeight = pct > 0 ? Math.max(6, (pct / 100) * MAX_BAR_HEIGHT) : 0;
          return (
            <View key={week.period_key} style={styles.barWrapper}>
              <Text style={styles.pctLabel}>{pct > 0 ? `${pct}%` : ""}</Text>
              <View style={styles.track}>
                <View
                  testID={`consistency-bar-${week.period_key}`}
                  accessibilityLabel={`${week.period_key}: ${pct}%`}
                  style={[styles.bar, { height: barHeight }]}
                />
              </View>
              <Text style={styles.weekLabel}>W{week.period_key.slice(-1) || "?"}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  pctLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: "600",
    height: 16,
    lineHeight: 16,
  },
  track: {
    width: "100%",
    height: MAX_BAR_HEIGHT,
    backgroundColor: "#EDE9E0",
    borderRadius: radii.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
  },
  weekLabel: {
    fontSize: 11,
    color: colors.muted,
  },
});
