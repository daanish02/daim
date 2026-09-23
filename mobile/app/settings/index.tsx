import { useState } from "react";
import { View, Text, Switch, Pressable, StyleSheet, Alert, ActivityIndicator, Share } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMe, updateMe, deleteAccount, exportData, logout } from "../../services/api/me";
import { clearSessionToken } from "../../services/auth/session";
import { colors, spacing, radii } from "../../theme/tokens";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  const toggleLeaderboard = useMutation({
    mutationFn: (visible: boolean) => updateMe({ leaderboard_visible: visible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const handleExport = async () => {
    setBusy(true);
    try {
      const payload = await exportData();
      await Share.share({ message: JSON.stringify(payload, null, 2) });
    } catch {
      Alert.alert("Couldn't export your data", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await logout();
    } catch {
      // Logout is best-effort server-side; clear the local session regardless.
    }
    await clearSessionToken();
    router.replace("/onboarding");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account and prayer history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteAccount();
              await clearSessionToken();
              router.replace("/onboarding");
            } catch {
              Alert.alert("Couldn't delete your account", "Please try again.");
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !me) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Show me on the leaderboard</Text>
        <Switch
          value={!!me.leaderboard_visible}
          onValueChange={(v) => toggleLeaderboard.mutate(v)}
          disabled={toggleLeaderboard.isPending}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Language</Text>
        <Text style={styles.value}>English</Text>
      </View>

      <Pressable style={styles.button} onPress={handleExport} disabled={busy}>
        <Text style={styles.buttonText}>Download my data</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleSignOut} disabled={busy}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.dangerButton]} onPress={handleDelete} disabled={busy}>
        <Text style={styles.dangerButtonText}>Delete account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  value: {
    fontSize: 16,
    color: colors.muted,
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    color: colors.text,
  },
  dangerButton: {
    borderColor: "#B3261E",
  },
  dangerButtonText: {
    fontSize: 15,
    color: "#B3261E",
  },
});
