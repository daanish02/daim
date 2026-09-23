import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { getSessionToken } from "../services/auth/session";

const queryClient = new QueryClient();

/** Redirects between the onboarding group and the authed app based on stored session state. */
function useAuthGate() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    getSessionToken().then((token) => {
      setAuthed(!!token);
      setChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!checked) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!authed && !inOnboarding) {
      router.replace("/onboarding");
    } else if (authed && inOnboarding) {
      router.replace("/(tabs)/home");
    }
  }, [checked, authed, segments, router]);

  return checked;
}

export default function RootLayout() {
  const ready = useAuthGate();

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
