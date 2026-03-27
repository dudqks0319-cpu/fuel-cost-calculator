import { useWindowDimensions, View, Text } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { formatChartValueLabel } from "@/utils/chart";
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
  const svgWidth = chartWidth;
  const svgHeight = variant === "bar" ? 280 : 320;
  const margin = { top: 24, right: 18, bottom: 42, left: 54 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;
  const maxValue = Math.max(...data.map((item) => Math.max(item.valueA, item.valueB)), 1);
  const sectionCount = 4;
  const stepValue = maxValue / sectionCount;

  function getY(value: number) {
    return margin.top + plotHeight - (value / maxValue) * plotHeight;
  }

  function renderRules() {
    return Array.from({ length: sectionCount + 1 }, (_, index) => {
      const value = stepValue * (sectionCount - index);
      const y = margin.top + (plotHeight / sectionCount) * index;

      return (
        <G key={`rule-${index}`}>
          <SvgText
            fill={theme.colors.muted}
            fontSize="11"
            x={8}
            y={y + 4}
          >
            {formatChartValueLabel(value)}
          </SvgText>
          <Line
            stroke={theme.colors.border}
            strokeDasharray="4 4"
            strokeWidth="1"
            x1={margin.left}
            x2={svgWidth - margin.right}
            y1={y}
            y2={y}
          />
        </G>
      );
    });
  }

  if (variant === "bar") {
    const groupWidth = plotWidth / data.length;
    const barGap = 10;
    const barWidth = Math.min(28, (groupWidth - barGap * 2) / 2);

    return (
      <View style={{ gap: theme.spacing.sm }}>
        <Legend accentA={accentA} accentB={accentB} labels={labels} />
        <Svg height={svgHeight} width={svgWidth}>
          {renderRules()}
          <Line
            stroke={theme.colors.border}
            strokeWidth="1.5"
            x1={margin.left}
            x2={svgWidth - margin.right}
            y1={svgHeight - margin.bottom}
            y2={svgHeight - margin.bottom}
          />
          {data.map((item, index) => {
            const baseX = margin.left + groupWidth * index + (groupWidth - (barWidth * 2 + barGap)) / 2;
            const barAX = baseX;
            const barBX = baseX + barWidth + barGap;
            const barAHeight = (item.valueA / maxValue) * plotHeight;
            const barBHeight = (item.valueB / maxValue) * plotHeight;
            const barAY = svgHeight - margin.bottom - barAHeight;
            const barBY = svgHeight - margin.bottom - barBHeight;
            const labelX = margin.left + groupWidth * index + groupWidth / 2;

            return (
              <G key={item.label}>
                <Rect fill={accentA} height={barAHeight} rx={8} ry={8} width={barWidth} x={barAX} y={barAY} />
                <Rect fill={accentB} height={barBHeight} rx={8} ry={8} width={barWidth} x={barBX} y={barBY} />
                <SvgText fill={theme.colors.text} fontSize="10" textAnchor="middle" x={barAX + barWidth / 2} y={barAY - 8}>
                  {formatChartValueLabel(item.valueA)}
                </SvgText>
                <SvgText fill={theme.colors.text} fontSize="10" textAnchor="middle" x={barBX + barWidth / 2} y={barBY - 8}>
                  {formatChartValueLabel(item.valueB)}
                </SvgText>
                <SvgText fill={theme.colors.muted} fontSize="12" textAnchor="middle" x={labelX} y={svgHeight - 14}>
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    );
  }

  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const pathFor = (key: "valueA" | "valueB") =>
    data
      .map((item, index) => {
        const x = margin.left + stepX * index;
        const y = getY(item[key]);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Legend accentA={accentA} accentB={accentB} labels={labels} />
      <Svg height={svgHeight} width={svgWidth}>
        {renderRules()}
        <Line
          stroke={theme.colors.border}
          strokeWidth="1.5"
          x1={margin.left}
          x2={svgWidth - margin.right}
          y1={svgHeight - margin.bottom}
          y2={svgHeight - margin.bottom}
        />
        <Path d={pathFor("valueA")} fill="none" stroke={accentA} strokeWidth="3" />
        <Path d={pathFor("valueB")} fill="none" stroke={accentB} strokeWidth="3" />
        {data.map((item, index) => {
          const x = margin.left + stepX * index;
          const yA = getY(item.valueA);
          const yB = getY(item.valueB);
          const highlighted = highlightIndex === index;

          return (
            <G key={item.label}>
              <Circle cx={x} cy={yA} fill={accentA} r={4} />
              <Circle cx={x} cy={yB} fill={accentB} r={4} />
              <SvgText fill={theme.colors.muted} fontSize="12" textAnchor="middle" x={x} y={svgHeight - 14}>
                {item.label}
              </SvgText>
              {highlighted ? (
                <>
                  <Circle cx={x} cy={yB} fill={accentB} r={7} stroke="#FFFFFF" strokeWidth="2" />
                  <SvgText
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    x={x}
                    y={Math.max(18, yB - 18)}
                  >
                    손익분기점
                  </SvgText>
                </>
              ) : null}
            </G>
          );
        })}
      </Svg>
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
