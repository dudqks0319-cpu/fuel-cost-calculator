import { Text, View } from "react-native";
import { theme } from "@/theme/tokens";

export function ResultCard({
  accentColor,
  subtitle,
  title,
  value
}: {
  accentColor?: string;
  subtitle?: string;
  title: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "47%",
        backgroundColor: theme.colors.input,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.xs
      }}
    >
      <Text style={[theme.typography.caption, { fontWeight: "600" }]}>{title}</Text>
      <Text
        style={[
          theme.typography.amount,
          {
            color: accentColor ?? theme.colors.text,
            fontSize: 28
          }
        ]}
      >
        {value}
      </Text>
      {subtitle ? <Text style={theme.typography.caption}>{subtitle}</Text> : null}
    </View>
  );
}
