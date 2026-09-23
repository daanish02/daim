import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../../../theme/tokens";

// Placeholder - real prayer list, contribution graph, consistency graph
// land in the next slice once the auth flow is verified end to end.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Signed in. Home screen coming next.</Text>
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
