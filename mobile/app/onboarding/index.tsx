import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { configureGoogleSignIn, signInWithGoogle } from "../../services/auth/googleSignIn";
import { setSessionToken } from "../../services/auth/session";
import { apiFetch } from "../../services/api/client";
import { colors, spacing, radii } from "../../theme/tokens";

interface GoogleAuthResponse {
  session_token: string;
  user: { display_name: string };
}

type ErrorKind = "network" | "auth" | null;

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorKind(null);

    const result = await signInWithGoogle();

    if (result.type === "cancelled") {
      setLoading(false);
      return;
    }
    if (result.type === "error") {
      setLoading(false);
      setErrorKind("auth");
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await apiFetch<GoogleAuthResponse>("/api/auth/google", {
        method: "POST",
        body: { id_token: result.idToken, timezone },
      });
      await setSessionToken(response.session_token);
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      setLoading(false);
      const isNetworkError =
        err instanceof TypeError && err.message.toLowerCase().includes("network");
      setErrorKind(isNetworkError ? "network" : "auth");
    }
  };

  const errorMessage =
    errorKind === "network"
      ? "Connection failed. Check your network and try again."
      : errorKind === "auth"
        ? "Sign-in didn't complete. Try again."
        : null;

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
        ) : errorKind ? (
          <Text style={styles.buttonText}>Try again</Text>
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </Pressable>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
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
  title: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#B3261E",
    marginTop: spacing.md,
  },
});
