import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useGoogleAuthRequest, signInWithGoogle } from "../../services/auth/googleSignIn";
import { setSessionToken } from "../../services/auth/session";
import { apiFetch } from "../../services/api/client";
import { colors, spacing, radii } from "../../theme/tokens";

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResponse {
  session_token: string;
  user: { display_name: string };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [request, , promptAsync] = useGoogleAuthRequest();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleSignIn = async () => {
    if (!request) return;
    setStatus("loading");

    const result = await signInWithGoogle(() => promptAsync());

    if (result.type === "cancelled") {
      setStatus("idle");
      return;
    }
    if (result.type === "error") {
      setStatus("error");
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
    } catch {
      setStatus("error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>دائم</Text>
      <Text style={styles.subtitle}>Daim</Text>

      <Pressable
        style={styles.button}
        onPress={handleSignIn}
        disabled={!request || status === "loading"}
        accessibilityRole="button"
      >
        {status === "loading" ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </Pressable>

      {status === "error" && <Text style={styles.error}>Couldn't sign in. Try again.</Text>}
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
