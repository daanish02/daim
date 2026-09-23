import { Tabs } from "expo-router";
import { colors } from "../../theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: "Home" }} />
      <Tabs.Screen name="leaderboard/index" options={{ title: "Leaderboard" }} />
    </Tabs>
  );
}
