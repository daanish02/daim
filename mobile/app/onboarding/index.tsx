import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { setSessionToken } from "../../services/auth/session";
import { apiFetch } from "../../services/api/client";
import { colors, spacing, radii } from "../../theme/tokens";

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        session_token: string;
        user: { display_name: string };
      }>("/api/auth/dev-login", { method: "POST" });
      await setSessionToken(response.session_token);
      router.replace("/(tabs)/home");
    } catch {
      setLoading(false);
      setError("Connection failed.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>دائم</Text>
      <Text style={styles.subtitle}>Daim</Text>
      <Pressable
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Continue (dev)</Text>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
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
  title: { fontSize: 48, color: colors.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: spacing.xl },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "600" },
  error: { color: "#B3261E", marginTop: spacing.md },
});
