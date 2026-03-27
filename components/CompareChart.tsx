import { useWindowDimensions, View, Text } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { formatCurrency } from "@/utils/formatter";
import { theme } from "@/theme/tokens";

type ComparePoint = {
  label: string;
  valueA: number;
  valueB: number;
};

export function CompareChart({
  accentA,
  accentB,
  data,
  highlightIndex,
  labels,
  variant
}: {
  accentA: string;
  accentB: string;
  data: ComparePoint[];
  highlightIndex?: number | null;
  labels: { a: string; b: string };
  variant: "bar" | "line";
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 72, 280);
  const maxValue = Math.max(...data.map((item) => Math.max(item.valueA, item.valueB)), 1);

  if (variant === "bar") {
    const barData = data.flatMap((item, index) => [
      {
        value: item.valueA,
        frontColor: accentA,
        spacing: 6,
        label: "",
        topLabelComponent: () => (
          <Text style={[theme.typography.caption, { color: theme.colors.text, fontSize: 11 }]}>
            {formatCurrency(item.valueA)}
          </Text>
        )
      },
      {
        value: item.valueB,
        frontColor: accentB,
        spacing: index === data.length - 1 ? 0 : 26,
        label: item.label,
        labelTextStyle: {
          color: theme.colors.muted,
          fontSize: 12
        },
        topLabelComponent: () => (
          <Text style={[theme.typography.caption, { color: theme.colors.text, fontSize: 11 }]}>
            {formatCurrency(item.valueB)}
          </Text>
        )
      }
    ]);

    return (
      <View style={{ gap: theme.spacing.sm }}>
        <Legend accentA={accentA} accentB={accentB} labels={labels} />
        <BarChart
          adjustToWidth
          barBorderRadius={8}
          barWidth={18}
          data={barData}
          disableScroll
          height={260}
          hideRules={false}
          initialSpacing={8}
          isAnimated
          maxValue={maxValue}
          noOfSections={4}
          rulesColor={theme.colors.border}
          showValuesAsTopLabel
          width={chartWidth}
          xAxisColor={theme.colors.border}
          xAxisLabelTextStyle={{ color: theme.colors.muted, fontSize: 12 }}
          yAxisColor="transparent"
          yAxisLabelWidth={56}
          yAxisTextStyle={{ color: theme.colors.muted, fontSize: 12 }}
        />
      </View>
    );
  }

  const lineData = data.map((item) => ({
    value: item.valueA,
    label: item.label,
    dataPointColor: accentA
  }));
  const lineData2 = data.map((item, index) => ({
    value: item.valueB,
    label: item.label,
    dataPointColor: accentB,
    customDataPoint:
      highlightIndex === index
        ? () => (
            <View style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: theme.radius.pill,
                  backgroundColor: accentB
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>손익분기점</Text>
              </View>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: theme.radius.pill,
                  backgroundColor: accentB
                }}
              />
            </View>
          )
        : undefined
  }));

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Legend accentA={accentA} accentB={accentB} labels={labels} />
      <LineChart
        adjustToWidth
        color1={accentA}
        color2={accentB}
        data={lineData}
        data2={lineData2}
        dataPointsColor1={accentA}
        dataPointsColor2={accentB}
        disableScroll
        height={280}
        hideRules={false}
        initialSpacing={12}
        isAnimated
        maxValue={maxValue}
        noOfSections={4}
        rulesColor={theme.colors.border}
        thickness1={3}
        thickness2={3}
        width={chartWidth}
        xAxisColor={theme.colors.border}
        xAxisLabelTextStyle={{ color: theme.colors.muted, fontSize: 12 }}
        yAxisColor="transparent"
        yAxisLabelWidth={56}
        yAxisTextStyle={{ color: theme.colors.muted, fontSize: 12 }}
      />
    </View>
  );
}

function Legend({
  accentA,
  accentB,
  labels
}: {
  accentA: string;
  accentB: string;
  labels: { a: string; b: string };
}) {
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
      {[{ color: accentA, label: labels.a }, { color: accentB, label: labels.b }].map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: theme.radius.pill,
              backgroundColor: item.color
            }}
          />
          <Text style={theme.typography.caption}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
