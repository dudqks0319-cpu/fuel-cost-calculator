import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { theme } from "@/theme/tokens";
import { FuelPriceProvider } from "@/utils/FuelPriceContext";

export default function RootLayout() {
  return (
    <FuelPriceProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background
          }
        }}
      />
    </FuelPriceProvider>
  );
}
