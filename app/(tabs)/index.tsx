import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { vehiclesData } from "@/data/vehicles";
import { ResultCard } from "@/components/ResultCard";
import { VehicleSelector, type VehicleSelectionState } from "@/components/VehicleSelector";
import { ActionTextButton, AppCard, AppScreen, InlineMessage, InputField, SegmentedControl } from "@/components/ui";
import { calcCostPerKm, calcFullTankCost, calcFullTankRange, calcMonthlyCost } from "@/utils/calculator";
import {
  DEFAULT_FUEL_PRICES,
  DEFAULT_MONTHLY_KM,
  FUEL_TYPE_LABELS,
  MANUAL_FUEL_OPTIONS,
  MILEAGE_TYPE_OPTIONS,
  MONTHLY_KM_RANGE
} from "@/utils/defaults";
import { formatCurrency, formatKm, formatLiter, formatNumber } from "@/utils/formatter";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import { getVehicleBySelection } from "@/utils/vehicles";
import type { FuelPriceMap, FuelVehicleRecord, MileageType } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

type HomeFormState = {
  inputMode: "vehicle" | "manual";
  mileageType: MileageType;
  selection: VehicleSelectionState;
  manualMpg: string;
  manualFuelType: FuelVehicleRecord["fuelType"];
  manualTankCapacity: string;
  monthlyKm: number;
  showFormula: boolean;
};

const defaultSelection: VehicleSelectionState = {
  manufacturer: "",
  model: "",
  powertrain: ""
};

const defaultHomeForm: HomeFormState = {
  inputMode: "vehicle",
  mileageType: "combined",
  selection: defaultSelection,
  manualMpg: "10.0",
  manualFuelType: "gasoline",
  manualTankCapacity: "60",
  monthlyKm: DEFAULT_MONTHLY_KM,
  showFormula: false
};

const fuelVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType !== "electric") as FuelVehicleRecord[];

function sanitizeNumber(text: string, allowDecimal = false) {
  return text.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
}

function parseNumeric(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fuelPriceMeta(fuelPrices: FuelPriceMap) {
  return [
    {
      key: "gasoline",
      icon: "flame-outline" as const,
      label: "휘발유",
      price: fuelPrices.gasoline
    },
    {
      key: "diesel",
      icon: "speedometer-outline" as const,
      label: "경유",
      price: fuelPrices.diesel
    },
    {
      key: "lpg",
      icon: "leaf-outline" as const,
      label: "LPG",
      price: fuelPrices.lpg
    }
  ];
}

export default function HomeScreen() {
  const [fuelPrices, setFuelPrices] = useState<FuelPriceMap>(DEFAULT_FUEL_PRICES);
  const [homeForm, setHomeForm] = useState<HomeFormState>(defaultHomeForm);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const [storedFuelPrices, storedHomeForm] = await Promise.all([
        loadStoredValue(STORAGE_KEYS.fuelPrices, DEFAULT_FUEL_PRICES),
        loadStoredValue(STORAGE_KEYS.homeForm, defaultHomeForm)
      ]);

      if (!mounted) {
        return;
      }

      setFuelPrices(storedFuelPrices);
      setHomeForm(storedHomeForm);
      setLoaded(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    void saveStoredValue(STORAGE_KEYS.fuelPrices, fuelPrices);
  }, [fuelPrices, loaded]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    void saveStoredValue(STORAGE_KEYS.homeForm, homeForm);
  }, [homeForm, loaded]);

  const selectedVehicle = getVehicleBySelection(
    fuelVehicles,
    homeForm.selection.manufacturer,
    homeForm.selection.model,
    homeForm.selection.powertrain
  ) as FuelVehicleRecord | undefined;

  const effectiveMpg =
    homeForm.inputMode === "vehicle" ? selectedVehicle?.mpg[homeForm.mileageType] ?? 0 : parseNumeric(homeForm.manualMpg);
  const effectiveFuelType = homeForm.inputMode === "vehicle" ? selectedVehicle?.fuelType ?? "gasoline" : homeForm.manualFuelType;
  const effectiveTankCapacity =
    homeForm.inputMode === "vehicle" ? selectedVehicle?.tankCapacity ?? 0 : parseNumeric(homeForm.manualTankCapacity);
  const effectiveFuelPrice = fuelPrices[effectiveFuelType];
  const ready = effectiveMpg > 0 && effectiveTankCapacity > 0;
  const fullTankCost = calcFullTankCost(effectiveTankCapacity, effectiveFuelPrice);
  const fullTankRange = calcFullTankRange(effectiveTankCapacity, effectiveMpg);
  const costPerKm = calcCostPerKm(effectiveFuelPrice, effectiveMpg);
  const monthlyCost = calcMonthlyCost(homeForm.monthlyKm, effectiveFuelPrice, effectiveMpg);

  return (
    <AppScreen title="연료비 계산기">
      <AppCard
        action={
          <ActionTextButton
            label={isEditingPrices ? "수정완료" : "직접수정"}
            onPress={() => setIsEditingPrices((current) => !current)}
          />
        }
        title="오늘의 유가"
      >
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {fuelPriceMeta(fuelPrices).map((item) => (
            <View
              key={item.key}
              style={{
                flex: 1,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.input,
                padding: theme.spacing.md,
                alignItems: "center",
                gap: 6
              }}
            >
              <Ionicons color={theme.colors.primary} name={item.icon} size={20} />
              <Text style={[theme.typography.caption, { fontWeight: "600" }]}>{item.label}</Text>
              <Text style={[theme.typography.body, { fontWeight: "700", color: theme.colors.text }]}>
                {formatNumber(item.price)}원
              </Text>
            </View>
          ))}
        </View>
        {isEditingPrices ? (
          <View style={{ gap: theme.spacing.sm }}>
            <InputField
              keyboardType="number-pad"
              label="휘발유 가격"
              onChangeText={(text) =>
                setFuelPrices((current) => ({
                  ...current,
                  gasoline: Number.parseInt(sanitizeNumber(text), 10) || 0
                }))
              }
              suffix="원"
              value={String(fuelPrices.gasoline)}
            />
            <InputField
              keyboardType="number-pad"
              label="경유 가격"
              onChangeText={(text) =>
                setFuelPrices((current) => ({
                  ...current,
                  diesel: Number.parseInt(sanitizeNumber(text), 10) || 0
                }))
              }
              suffix="원"
              value={String(fuelPrices.diesel)}
            />
            <InputField
              keyboardType="number-pad"
              label="LPG 가격"
              onChangeText={(text) =>
                setFuelPrices((current) => ({
                  ...current,
                  lpg: Number.parseInt(sanitizeNumber(text), 10) || 0
                }))
              }
              suffix="원"
              value={String(fuelPrices.lpg)}
            />
          </View>
        ) : null}
      </AppCard>

      <AppCard title="내 차 정보">
        <SegmentedControl
          onChange={(value) => setHomeForm((current) => ({ ...current, inputMode: value }))}
          options={[
            { label: "차량 선택", value: "vehicle" as const },
            { label: "직접 입력", value: "manual" as const }
          ]}
          value={homeForm.inputMode}
        />

        {homeForm.inputMode === "vehicle" ? (
          <View style={{ gap: theme.spacing.sm }}>
            <VehicleSelector
              mileageType={homeForm.mileageType}
              mode="fuel"
              onSelectionChange={(selection) => setHomeForm((current) => ({ ...current, selection }))}
              selection={homeForm.selection}
              vehicles={fuelVehicles}
            />
            <SegmentedControl
              onChange={(value) => setHomeForm((current) => ({ ...current, mileageType: value }))}
              options={MILEAGE_TYPE_OPTIONS}
              value={homeForm.mileageType}
            />
            {selectedVehicle ? (
              <View style={{ gap: 4 }}>
                <Text style={theme.typography.caption}>연비 {selectedVehicle.mpg[homeForm.mileageType].toFixed(1)} km/L</Text>
                <Text style={theme.typography.caption}>연료 {FUEL_TYPE_LABELS[selectedVehicle.fuelType]}</Text>
                <Text style={theme.typography.caption}>탱크용량 {formatLiter(selectedVehicle.tankCapacity)}</Text>
              </View>
            ) : (
              <InlineMessage
                backgroundColor={`${theme.colors.primary}10`}
                color={theme.colors.primary}
                text="제조사, 모델, 파워트레인을 순서대로 선택해주세요."
              />
            )}
          </View>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            <InputField
              helperText="예: 10.0"
              keyboardType="decimal-pad"
              label="연비"
              onChangeText={(text) => setHomeForm((current) => ({ ...current, manualMpg: sanitizeNumber(text, true) }))}
              suffix="km/L"
              value={homeForm.manualMpg}
            />
            <SegmentedControl
              onChange={(value) => setHomeForm((current) => ({ ...current, manualFuelType: value }))}
              options={MANUAL_FUEL_OPTIONS}
              value={homeForm.manualFuelType}
            />
            <InputField
              keyboardType="decimal-pad"
              label="탱크용량"
              onChangeText={(text) =>
                setHomeForm((current) => ({ ...current, manualTankCapacity: sanitizeNumber(text, true) }))
              }
              suffix="L"
              value={homeForm.manualTankCapacity}
            />
          </View>
        )}
      </AppCard>

      <AppCard title="계산 결과">
        {ready ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              <ResultCard
                accentColor={theme.colors.primary}
                subtitle={`${formatLiter(effectiveTankCapacity)} × ${formatNumber(effectiveFuelPrice)}원`}
                title="만땅 비용"
                value={formatCurrency(fullTankCost)}
              />
              <ResultCard
                accentColor={theme.colors.success}
                subtitle={`${formatLiter(effectiveTankCapacity)} × ${effectiveMpg.toFixed(1)}km/L`}
                title="만땅 주행거리"
                value={formatKm(fullTankRange)}
              />
              <ResultCard
                accentColor={theme.colors.danger}
                subtitle={`${formatNumber(effectiveFuelPrice)}원 ÷ ${effectiveMpg.toFixed(1)}km/L`}
                title="1km당 비용"
                value={formatCurrency(costPerKm)}
              />
              <ResultCard
                accentColor={theme.colors.primary}
                subtitle={`${formatNumber(homeForm.monthlyKm)}km ÷ ${effectiveMpg.toFixed(1)}km/L × ${formatNumber(effectiveFuelPrice)}원`}
                title="월 유류비"
                value={formatCurrency(monthlyCost)}
              />
            </View>

            <View style={{ gap: theme.spacing.xs }}>
              <Text style={[theme.typography.caption, { fontWeight: "600" }]}>
                월 주행거리 {formatNumber(homeForm.monthlyKm)} km
              </Text>
              <Slider
                maximumTrackTintColor={theme.colors.border}
                maximumValue={MONTHLY_KM_RANGE.max}
                minimumTrackTintColor={theme.colors.primary}
                minimumValue={MONTHLY_KM_RANGE.min}
                onValueChange={(value) =>
                  setHomeForm((current) => ({
                    ...current,
                    monthlyKm: Math.round(value / MONTHLY_KM_RANGE.step) * MONTHLY_KM_RANGE.step
                  }))
                }
                step={MONTHLY_KM_RANGE.step}
                thumbTintColor={theme.colors.primary}
                value={homeForm.monthlyKm}
              />
            </View>

            <Pressable
              onPress={() => setHomeForm((current) => ({ ...current, showFormula: !current.showFormula }))}
              style={{ paddingVertical: theme.spacing.xs }}
            >
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: "600" }]}>
                {homeForm.showFormula ? "계산 과정 닫기" : "계산 과정 보기"}
              </Text>
            </Pressable>

            {homeForm.showFormula ? (
              <View
                style={{
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.input,
                  padding: theme.spacing.md,
                  gap: 6
                }}
              >
                <Text style={theme.typography.caption}>만땅 비용 = 탱크용량 × 연료 단가</Text>
                <Text style={theme.typography.caption}>만땅 주행거리 = 탱크용량 × 연비</Text>
                <Text style={theme.typography.caption}>1km당 비용 = 연료 단가 ÷ 연비</Text>
                <Text style={theme.typography.caption}>월 유류비 = 월 주행거리 ÷ 연비 × 연료 단가</Text>
              </View>
            ) : null}
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.primary}10`}
            color={theme.colors.primary}
            text="차량을 선택하거나 직접 입력값을 채워주세요."
          />
        )}
      </AppCard>
    </AppScreen>
  );
}
