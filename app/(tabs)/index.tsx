import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { calcCostPerKm, calcFuelNeeded, calcTripFuelCost } from "@/utils/calculator";
import { formatCurrency, formatNumber } from "@/utils/formatter";
import { useFuelPrices } from "@/utils/FuelPriceContext";
import { theme } from "@/theme/tokens";

type FuelChoice = "premium" | "diesel" | "gasoline" | "lpg" | "manual";

type RemoteFuelPricePayload = {
  premium?: number;
  gasoline?: number;
  diesel?: number;
  lpg?: number;
  updatedAt?: string;
};

const FUEL_PRICE_API_URL = process.env.EXPO_PUBLIC_FUEL_PRICE_API_URL;

const fuelOptions: {
  key: FuelChoice;
  label: string;
  priceKey?: keyof Omit<RemoteFuelPricePayload, "updatedAt">;
}[] = [
  { key: "premium", label: "고급 휘발유", priceKey: "premium" },
  { key: "diesel", label: "경유", priceKey: "diesel" },
  { key: "gasoline", label: "휘발유", priceKey: "gasoline" },
  { key: "lpg", label: "LPG", priceKey: "lpg" },
  { key: "manual", label: "직접입력" }
];

function sanitizeDecimal(text: string) {
  const next = text.replace(/[^0-9.]/g, "");
  const [first, ...rest] = next.split(".");
  return rest.length > 0 ? `${first}.${rest.join("")}` : first;
}

function parseNumeric(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readPrice(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.round(value);
    }
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        return Math.round(parsed);
      }
    }
  }

  return undefined;
}

function normalizeFuelPricePayload(payload: unknown): RemoteFuelPricePayload {
  const root = getRecord(payload);
  if (!root) {
    return {};
  }

  const prices = getRecord(root.prices) ?? root;
  const updatedAt = typeof root.updatedAt === "string" ? root.updatedAt : undefined;

  return {
    premium: readPrice(prices, ["premium", "B034"]),
    gasoline: readPrice(prices, ["gasoline", "B027"]),
    diesel: readPrice(prices, ["diesel", "D047"]),
    lpg: readPrice(prices, ["lpg", "K015", "K105"]),
    updatedAt
  };
}

async function fetchRemoteFuelPrices() {
  if (!FUEL_PRICE_API_URL) {
    throw new Error("오피넷 프록시 URL이 아직 설정되지 않았습니다.");
  }

  const response = await fetch(FUEL_PRICE_API_URL);
  if (!response.ok) {
    throw new Error(`유가 조회 실패: ${response.status}`);
  }

  return normalizeFuelPricePayload(await response.json());
}

function UnderlineInput({
  accessibilityLabel,
  onChangeText,
  placeholder = "입력",
  suffix,
  value,
  width
}: {
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  suffix: string;
  value: string;
  width: number;
}) {
  return (
    <View style={[styles.underlineInput, { width }]}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType="decimal-pad"
        onChangeText={(text) => onChangeText(sanitizeDecimal(text))}
        placeholder={placeholder}
        placeholderTextColor="#9B9B9B"
        style={styles.underlineTextInput}
        value={value}
      />
      <Text style={styles.inputSuffix}>{suffix}</Text>
    </View>
  );
}

function SectionTitle({
  icon,
  label
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      {icon ? <MaterialIcons color="#222222" name={icon} size={23} /> : <Text style={styles.wonIcon}>₩</Text>}
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function RadioMark({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <View
      style={[
        styles.radioOuter,
        checked ? styles.radioOuterChecked : null,
        disabled ? styles.radioOuterDisabled : null
      ]}
    >
      {checked ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

function FuelOptionRow({
  checked,
  disabled,
  label,
  onPress,
  price
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  price?: number;
}) {
  const color = disabled ? styles.disabledText : styles.optionText;
  const priceText = price ? formatNumber(price) : "---";

  return (
    <Pressable disabled={disabled} onPress={onPress} style={styles.optionRow}>
      <View style={styles.optionLabel}>
        <RadioMark checked={checked} disabled={disabled} />
        <Text style={[styles.optionLabelText, color]}>{label}</Text>
      </View>
      <Text style={[styles.optionPriceText, color]}>
        (약 <Text style={styles.optionPriceStrong}>{priceText}</Text>원/L)
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { fuelPrices, setFuelPrices } = useFuelPrices();
  const [distance, setDistance] = useState("");
  const [efficiency, setEfficiency] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [selectedFuel, setSelectedFuel] = useState<FuelChoice>("manual");
  const [premiumPrice, setPremiumPrice] = useState<number | undefined>();
  const [resultVisible, setResultVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusText, setStatusText] = useState("");

  const displayPrices = useMemo(
    () => ({
      premium: premiumPrice,
      gasoline: fuelPrices.gasoline,
      diesel: fuelPrices.diesel,
      lpg: fuelPrices.lpg
    }),
    [fuelPrices.diesel, fuelPrices.gasoline, fuelPrices.lpg, premiumPrice]
  );

  const fuelPrice = selectedFuel === "manual" ? parseNumeric(manualPrice) : displayPrices[selectedFuel] ?? 0;
  const distanceKm = parseNumeric(distance);
  const fuelEfficiency = parseNumeric(efficiency);
  const canCalculate = distanceKm > 0 && fuelEfficiency > 0 && fuelPrice > 0;

  const result = useMemo(() => {
    if (!canCalculate) {
      return null;
    }

    return {
      fuelNeeded: calcFuelNeeded(distanceKm, fuelEfficiency),
      costPerKm: calcCostPerKm(fuelPrice, fuelEfficiency),
      totalCost: calcTripFuelCost(distanceKm, fuelPrice, fuelEfficiency)
    };
  }, [canCalculate, distanceKm, fuelEfficiency, fuelPrice]);

  async function handleRefreshPrices() {
    setRefreshing(true);
    setStatusText("전국 평균 유가를 조회하는 중입니다.");

    try {
      const next = await fetchRemoteFuelPrices();
      const hasFuelPrice = Boolean(next.gasoline || next.diesel || next.lpg || next.premium);

      if (!hasFuelPrice) {
        throw new Error("응답에 유가 정보가 없습니다.");
      }

      setFuelPrices((current) => ({
        ...current,
        gasoline: next.gasoline ?? current.gasoline,
        diesel: next.diesel ?? current.diesel,
        lpg: next.lpg ?? current.lpg
      }));
      setPremiumPrice(next.premium);
      setStatusText(next.updatedAt ? `오피넷 평균가 반영: ${next.updatedAt}` : "오피넷 평균가를 반영했습니다.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "유가 조회에 실패했습니다.");
    } finally {
      setRefreshing(false);
    }
  }

  function handleCalculate() {
    if (canCalculate) {
      setResultVisible(true);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.calculator}>
          <SectionTitle icon="directions-car" label="운행 거리" />
          <UnderlineInput
            accessibilityLabel="운행 거리"
            onChangeText={(text) => {
              setDistance(text);
              setResultVisible(false);
            }}
            suffix="km"
            value={distance}
            width={92}
          />

          <SectionTitle icon="local-gas-station" label="평균 연비" />
          <UnderlineInput
            accessibilityLabel="평균 연비"
            onChangeText={(text) => {
              setEfficiency(text);
              setResultVisible(false);
            }}
            suffix="km/L"
            value={efficiency}
            width={104}
          />

          <SectionTitle label="유류 가격" />
          <Pressable disabled={refreshing} onPress={handleRefreshPrices} style={styles.lookupButton}>
            <MaterialIcons color={theme.colors.primary} name="cached" size={19} />
            <Text style={styles.lookupButtonText}>
              {refreshing ? "조회 중..." : "전국 주유소 평균 가격 조회하기"}
            </Text>
          </Pressable>
          {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

          <View style={styles.options}>
            {fuelOptions.map((option) => {
              if (option.key === "manual") {
                return (
                  <View key={option.key} style={styles.manualRow}>
                    <Pressable onPress={() => setSelectedFuel("manual")} style={styles.optionLabel}>
                      <RadioMark checked={selectedFuel === "manual"} />
                      <Text style={styles.manualLabelText}>직접입력</Text>
                    </Pressable>
                    <UnderlineInput
                      accessibilityLabel="직접 유류 가격"
                      onChangeText={(text) => {
                        setManualPrice(text);
                        setSelectedFuel("manual");
                        setResultVisible(false);
                      }}
                      suffix="원/L"
                      value={manualPrice}
                      width={112}
                    />
                  </View>
                );
              }

              const price = option.priceKey ? displayPrices[option.priceKey] : undefined;
              const disabled = !price;

              return (
                <View key={option.key}>
                  <FuelOptionRow
                    checked={selectedFuel === option.key}
                    disabled={disabled}
                    label={option.label}
                    onPress={() => {
                      setSelectedFuel(option.key);
                      setResultVisible(false);
                    }}
                    price={price}
                  />
                  <View style={styles.divider} />
                </View>
              );
            })}
          </View>

          <Pressable
            disabled={!canCalculate}
            onPress={handleCalculate}
            style={[styles.calculateButton, !canCalculate ? styles.calculateButtonDisabled : null]}
          >
            <Text style={[styles.calculateButtonText, !canCalculate ? styles.calculateButtonTextDisabled : null]}>
              계산하기
            </Text>
          </Pressable>

          {resultVisible && result ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>예상 유류비</Text>
              <Text style={styles.resultAmount}>{formatCurrency(result.totalCost)}</Text>
              <View style={styles.resultMeta}>
                <Text style={styles.resultMetaText}>필요 연료 {formatNumber(result.fuelNeeded)} L</Text>
                <Text style={styles.resultMetaText}>1km당 {formatCurrency(result.costPerKm)}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>오피넷 프록시 연결 시 최신 평균가를 자동 반영합니다.</Text>
            <Pressable onPress={() => void Linking.openURL("https://www.opinet.co.kr/user/custapi/custApiInfo.do")}>
              <Text style={styles.footerLink}>오피넷 API 안내 보기</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 42
  },
  calculator: {
    width: "100%",
    maxWidth: 330,
    alignItems: "center"
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    marginBottom: 8
  },
  sectionTitleText: {
    color: "#222222",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31
  },
  wonIcon: {
    color: "#222222",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31
  },
  underlineInput: {
    minHeight: 34,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#8C8C8C",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  underlineTextInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 0,
    color: "#222222",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "right"
  },
  inputSuffix: {
    marginLeft: 7,
    color: "#6F6F6F",
    fontSize: 16,
    fontWeight: "700"
  },
  lookupButton: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 4,
    marginBottom: 7
  },
  lookupButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  statusText: {
    maxWidth: 282,
    minHeight: 18,
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 2
  },
  options: {
    width: "100%",
    maxWidth: 226,
    marginTop: 2
  },
  optionRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  optionLabel: {
    flexDirection: "row",
    alignItems: "center"
  },
  optionLabelText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  optionText: {
    color: "#707070"
  },
  disabledText: {
    color: "#B2B2B2"
  },
  optionPriceText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  optionPriceStrong: {
    fontWeight: "900"
  },
  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#B8B8B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  radioOuterChecked: {
    borderColor: theme.colors.primary
  },
  radioOuterDisabled: {
    borderColor: "#C6C6C6"
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: theme.colors.primary
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D8D8D8"
  },
  manualRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  manualLabelText: {
    color: "#222222",
    fontSize: 16,
    fontWeight: "800"
  },
  calculateButton: {
    width: "100%",
    maxWidth: 320,
    minHeight: 43,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15
  },
  calculateButtonDisabled: {
    backgroundColor: "#DDDDDD"
  },
  calculateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  },
  calculateButtonTextDisabled: {
    color: "#A7A7A7"
  },
  resultBox: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14
  },
  resultLabel: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4
  },
  resultAmount: {
    color: "#222222",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  resultMeta: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9
  },
  resultMetaText: {
    color: "#777777",
    fontSize: 12,
    fontWeight: "700"
  },
  footer: {
    width: "100%",
    alignItems: "center",
    gap: 5,
    marginTop: 22
  },
  footerText: {
    color: "#8A8A8A",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center"
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800"
  }
});
