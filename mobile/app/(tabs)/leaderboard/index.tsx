import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../../theme/tokens";

// Placeholder - real leaderboard list lands in a later slice.
export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Leaderboard coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
});
