import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/theme/tokens";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

export function AppScreen({
  children,
  subtitle,
  title
}: PropsWithChildren<{ subtitle?: string; title: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.sm
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle ? <Text style={theme.typography.caption}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppCard({
  action,
  accentColor,
  children,
  title
}: PropsWithChildren<{ action?: ReactNode; accentColor?: string; title: string }>) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
          position: "relative"
        },
        theme.shadow
      ]}
    >
      {accentColor ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            top: theme.spacing.md,
            bottom: theme.spacing.md,
            width: 4,
            borderTopRightRadius: theme.radius.pill,
            borderBottomRightRadius: theme.radius.pill,
            backgroundColor: accentColor
          }}
        />
      ) : null}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: theme.spacing.sm
        }}
      >
        <Text style={[theme.typography.subtitle, { color: theme.colors.text, flex: 1 }]}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function InputField({
  helperText,
  keyboardType = "default",
  label,
  onChangeText,
  placeholder,
  suffix,
  value
}: {
  helperText?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  label: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix?: string;
  value: string;
}) {
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.typography.caption, { fontWeight: "600" }]}>{label}</Text>
      <View
        style={{
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.input,
          paddingHorizontal: theme.spacing.md,
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: 15
          }}
          value={value}
        />
        {suffix ? <Text style={[theme.typography.caption, { fontWeight: "600" }]}>{suffix}</Text> : null}
      </View>
      {helperText ? <Text style={theme.typography.caption}>{helperText}</Text> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  onChange,
  options,
  value
}: {
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  value: T;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.input,
        borderRadius: theme.radius.sm,
        padding: 4
      }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: theme.radius.sm,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? theme.colors.card : "transparent"
            }}
          >
            <Text
              style={[
                theme.typography.caption,
                {
                  color: active ? theme.colors.text : theme.colors.muted,
                  fontWeight: "600"
                }
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function InlineMessage({
  backgroundColor,
  color,
  text
}: {
  backgroundColor: string;
  color: string;
  text: string;
}) {
  return (
    <View
      style={{
        backgroundColor,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.md
      }}
    >
      <Text style={[theme.typography.body, { color, fontWeight: "600" }]}>{text}</Text>
    </View>
  );
}

export function ActionTextButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: "600" }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.sm,
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.spacing.md
        },
        theme.shadow
      ]}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
