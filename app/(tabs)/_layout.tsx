import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { theme } from "@/theme/tokens";

function renderTabIcon(outline: keyof typeof Ionicons.glyphMap, filled: keyof typeof Ionicons.glyphMap) {
  const TabIcon = ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons color={color} name={focused ? filled : outline} size={size} />
  );

  TabIcon.displayName = `TabIcon(${outline}/${filled})`;

  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 78,
          paddingTop: 8,
          paddingBottom: 12
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "연비계산기",
          tabBarIcon: renderTabIcon("calculator-outline", "calculator")
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "차량비교",
          tabBarIcon: renderTabIcon("car-outline", "car")
        }}
      />
      <Tabs.Screen
        name="ev-compare"
        options={{
          title: "전기차비교",
          tabBarIcon: renderTabIcon("flash-outline", "flash")
        }}
      />
    </Tabs>
  );
}
