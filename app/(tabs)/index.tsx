import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ResultCard } from "@/components/ResultCard";
import { VehicleSelector, type VehicleSelectionState } from "@/components/VehicleSelector";
import { ActionTextButton, AppCard, AppScreen, InlineMessage, InputField, SegmentedControl } from "@/components/ui";
import { vehiclesData } from "@/data/vehicles";
import {
  calcCostPerKm,
  calcEvCostPerKm,
  calcEvMonthlyCost,
  calcEvRange,
  calcFullTankCost,
  calcFullTankRange,
  calcMonthlyCost
} from "@/utils/calculator";
import {
  CHARGE_PRESETS,
  type ChargePresetKey,
  DEFAULT_MONTHLY_KM,
  FUEL_TYPE_LABELS,
  MANUAL_FUEL_OPTIONS,
  MILEAGE_TYPE_OPTIONS,
  MONTHLY_KM_RANGE
} from "@/utils/defaults";
import { formatCurrency, formatKm, formatLiter, formatNumber } from "@/utils/formatter";
import { useFuelPrices } from "@/utils/FuelPriceContext";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import { getVehicleBySelection } from "@/utils/vehicles";
import { type ElectricVehicleRecord, type FuelVehicleRecord, type MileageType } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

type HomeMode = "vehicle" | "manual";
type VehicleMode = "fuel" | "electric";

type HomeFormState = {
  inputMode: HomeMode;
  vehicleMode: VehicleMode;
  mileageType: MileageType;
  selection: VehicleSelectionState;
  manualMpg: string;
  manualFuelType: FuelVehicleRecord["fuelType"];
  manualTankCapacity: string;
  monthlyKm: number;
  showFormula: boolean;
  chargeMode: ChargePresetKey;
  manualChargePrice: string;
  manualEfficiency: string;
  manualBatteryCapacity: string;
};

const defaultSelection: VehicleSelectionState = {
  manufacturer: "",
  model: "",
  powertrain: ""
};

const defaultHomeForm: HomeFormState = {
  inputMode: "vehicle",
  vehicleMode: "fuel",
  mileageType: "combined",
  selection: defaultSelection,
  manualMpg: "10.0",
  manualFuelType: "gasoline",
  manualTankCapacity: "60",
  monthlyKm: DEFAULT_MONTHLY_KM,
  showFormula: false,
  chargeMode: "fast",
  manualChargePrice: "",
  manualEfficiency: "5.0",
  manualBatteryCapacity: "72.6"
};

const fuelVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType !== "electric") as FuelVehicleRecord[];
const electricVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType === "electric") as ElectricVehicleRecord[];

function sanitizeNumber(text: string, allowDecimal = false) {
  return text.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
}

function parseNumeric(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function priceMeta(fuelPrices: ReturnType<typeof useFuelPrices>["fuelPrices"]) {
  return [
    { key: "gasoline", icon: "flame-outline" as const, label: "휘발유", price: fuelPrices.gasoline },
    { key: "diesel", icon: "speedometer-outline" as const, label: "경유", price: fuelPrices.diesel },
    { key: "lpg", icon: "leaf-outline" as const, label: "LPG", price: fuelPrices.lpg },
    { key: "electric", icon: "flash-outline" as const, label: "전기", price: fuelPrices.electric }
  ];
}

export default function HomeScreen() {
  const { fuelPrices, setFuelPrices } = useFuelPrices();
  const [homeForm, setHomeForm] = useState<HomeFormState>(defaultHomeForm);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const storedHomeForm = await loadStoredValue(STORAGE_KEYS.homeForm, defaultHomeForm);
      if (!mounted) {
        return;
      }
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

    void saveStoredValue(STORAGE_KEYS.homeForm, homeForm);
  }, [homeForm, loaded]);

  const selectedFuelVehicle = getVehicleBySelection(
    fuelVehicles,
    homeForm.selection.manufacturer,
    homeForm.selection.model,
    homeForm.selection.powertrain
  ) as FuelVehicleRecord | undefined;
  const selectedElectricVehicle = getVehicleBySelection(
    electricVehicles,
    homeForm.selection.manufacturer,
    homeForm.selection.model,
    homeForm.selection.powertrain
  ) as ElectricVehicleRecord | undefined;
  const isElectricMode = homeForm.vehicleMode === "electric";
  const chargePreset = CHARGE_PRESETS.find((preset) => preset.key === homeForm.chargeMode);
  const chargePrice =
    homeForm.chargeMode === "manual"
      ? parseNumeric(homeForm.manualChargePrice) || fuelPrices.electric
      : chargePreset?.price ?? fuelPrices.electric;

  const fuelEfficiency =
    homeForm.inputMode === "vehicle"
      ? selectedFuelVehicle?.mpg[homeForm.mileageType] ?? 0
      : parseNumeric(homeForm.manualMpg);
  const fuelTankCapacity =
    homeForm.inputMode === "vehicle"
      ? selectedFuelVehicle?.tankCapacity ?? 0
      : parseNumeric(homeForm.manualTankCapacity);
  const fuelType =
    homeForm.inputMode === "vehicle"
      ? selectedFuelVehicle?.fuelType ?? "gasoline"
      : homeForm.manualFuelType;

  const electricEfficiency =
    homeForm.inputMode === "vehicle"
      ? selectedElectricVehicle?.efficiency ?? 0
      : parseNumeric(homeForm.manualEfficiency);
  const batteryCapacity =
    homeForm.inputMode === "vehicle"
      ? selectedElectricVehicle?.batteryCapacity ?? 0
      : parseNumeric(homeForm.manualBatteryCapacity);

  const resultCards = useMemo(() => {
    if (isElectricMode) {
      return {
        fullCost: calcFullTankCost(batteryCapacity, chargePrice),
        fullRange: calcEvRange(batteryCapacity, electricEfficiency),
        costPerKm: calcEvCostPerKm(chargePrice, electricEfficiency),
        monthlyCost: calcEvMonthlyCost(homeForm.monthlyKm, chargePrice, electricEfficiency)
      };
    }

    const fuelPrice = fuelPrices[fuelType];
    return {
      fullCost: calcFullTankCost(fuelTankCapacity, fuelPrice),
      fullRange: calcFullTankRange(fuelTankCapacity, fuelEfficiency),
      costPerKm: calcCostPerKm(fuelPrice, fuelEfficiency),
      monthlyCost: calcMonthlyCost(homeForm.monthlyKm, fuelPrice, fuelEfficiency)
    };
  }, [
    batteryCapacity,
    chargePrice,
    electricEfficiency,
    fuelEfficiency,
    fuelPrices,
    fuelTankCapacity,
    fuelType,
    homeForm.monthlyKm,
    isElectricMode
  ]);

  const ready = isElectricMode
    ? electricEfficiency > 0 && batteryCapacity > 0
    : fuelEfficiency > 0 && fuelTankCapacity > 0;

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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {priceMeta(fuelPrices).map((item) => (
            <View
              key={item.key}
              style={{
                flex: 1,
                minWidth: "47%",
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.input,
                padding: theme.spacing.md,
                alignItems: "center",
                gap: 6
              }}
            >
              <Ionicons color={item.key === "electric" ? theme.colors.purple : theme.colors.primary} name={item.icon} size={20} />
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
            <InputField
              keyboardType="number-pad"
              label="전기 충전요금"
              onChangeText={(text) =>
                setFuelPrices((current) => ({
                  ...current,
                  electric: Number.parseInt(sanitizeNumber(text), 10) || 0
                }))
              }
              suffix="원/kWh"
              value={String(fuelPrices.electric)}
            />
          </View>
        ) : null}
      </AppCard>

      <AppCard title="내 차 정보">
        <SegmentedControl
          onChange={(value) => setHomeForm((current) => ({ ...current, vehicleMode: value, selection: defaultSelection }))}
          options={[
            { label: "내연기관", value: "fuel" as const },
            { label: "전기차", value: "electric" as const }
          ]}
          value={homeForm.vehicleMode}
        />
        <SegmentedControl
          onChange={(value) => setHomeForm((current) => ({ ...current, inputMode: value }))}
          options={[
            { label: "차량 선택", value: "vehicle" as const },
            { label: "직접 입력", value: "manual" as const }
          ]}
          value={homeForm.inputMode}
        />

        {homeForm.inputMode === "vehicle" ? (
          <VehicleSelector
            mileageType={homeForm.mileageType}
            mode={homeForm.vehicleMode}
            onSelectionChange={(selection) => setHomeForm((current) => ({ ...current, selection }))}
            selection={homeForm.selection}
            vehicles={isElectricMode ? electricVehicles : fuelVehicles}
          />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {isElectricMode ? (
              <>
                <InputField
                  helperText="예: 5.0"
                  keyboardType="decimal-pad"
                  label="전비"
                  onChangeText={(text) =>
                    setHomeForm((current) => ({ ...current, manualEfficiency: sanitizeNumber(text, true) }))
                  }
                  suffix="km/kWh"
                  value={homeForm.manualEfficiency}
                />
                <InputField
                  helperText="예: 72.6"
                  keyboardType="decimal-pad"
                  label="배터리용량"
                  onChangeText={(text) =>
                    setHomeForm((current) => ({ ...current, manualBatteryCapacity: sanitizeNumber(text, true) }))
                  }
                  suffix="kWh"
                  value={homeForm.manualBatteryCapacity}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        )}

        {!isElectricMode ? (
          <SegmentedControl
            onChange={(value) => setHomeForm((current) => ({ ...current, mileageType: value }))}
            options={MILEAGE_TYPE_OPTIONS}
            value={homeForm.mileageType}
          />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            <SegmentedControl
              onChange={(value) => setHomeForm((current) => ({ ...current, chargeMode: value }))}
              options={CHARGE_PRESETS.map((preset) => ({ label: preset.label, value: preset.key }))}
              value={homeForm.chargeMode}
            />
            {homeForm.chargeMode === "manual" ? (
              <InputField
                keyboardType="number-pad"
                label="직접 충전요금"
                onChangeText={(text) =>
                  setHomeForm((current) => ({ ...current, manualChargePrice: sanitizeNumber(text) }))
                }
                suffix="원/kWh"
                value={homeForm.manualChargePrice}
              />
            ) : null}
          </View>
        )}

        {isElectricMode && selectedElectricVehicle ? (
          <View style={{ gap: 4 }}>
            <Text style={theme.typography.caption}>
              {selectedElectricVehicle.model} {selectedElectricVehicle.powertrain}
            </Text>
            <Text style={theme.typography.caption}>전비 {selectedElectricVehicle.efficiency.toFixed(1)} km/kWh</Text>
            <Text style={theme.typography.caption}>
              배터리용량 {selectedElectricVehicle.batteryCapacity > 0 ? `${selectedElectricVehicle.batteryCapacity} kWh` : "미입력"}
            </Text>
          </View>
        ) : !isElectricMode && selectedFuelVehicle ? (
          <View style={{ gap: 4 }}>
            <Text style={theme.typography.caption}>
              {selectedFuelVehicle.model} {selectedFuelVehicle.powertrain}
            </Text>
            <Text style={theme.typography.caption}>연료 {FUEL_TYPE_LABELS[selectedFuelVehicle.fuelType]}</Text>
            <Text style={theme.typography.caption}>연비 {selectedFuelVehicle.mpg[homeForm.mileageType].toFixed(1)} km/L</Text>
            <Text style={theme.typography.caption}>탱크용량 {formatLiter(selectedFuelVehicle.tankCapacity)}</Text>
          </View>
        ) : (
          <InlineMessage
            backgroundColor={`${isElectricMode ? theme.colors.purple : theme.colors.primary}10`}
            color={isElectricMode ? theme.colors.purple : theme.colors.primary}
            text="차량을 선택하거나 직접 입력값을 채워주세요."
          />
        )}
      </AppCard>

      <AppCard title="계산 결과">
        {ready ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              <ResultCard
                accentColor={isElectricMode ? theme.colors.purple : theme.colors.primary}
                subtitle={
                  isElectricMode
                    ? `${batteryCapacity.toFixed(1)}kWh × ${formatNumber(chargePrice)}원`
                    : `${formatLiter(fuelTankCapacity)} × ${formatNumber(fuelPrices[fuelType])}원`
                }
                title={isElectricMode ? "완충 비용" : "만땅 비용"}
                value={formatCurrency(resultCards.fullCost)}
              />
              <ResultCard
                accentColor={isElectricMode ? theme.colors.purple : theme.colors.success}
                subtitle={
                  isElectricMode
                    ? `${batteryCapacity.toFixed(1)}kWh × ${electricEfficiency.toFixed(1)}km/kWh`
                    : `${formatLiter(fuelTankCapacity)} × ${fuelEfficiency.toFixed(1)}km/L`
                }
                title={isElectricMode ? "완충 주행거리" : "만땅 주행거리"}
                value={formatKm(resultCards.fullRange)}
              />
              <ResultCard
                accentColor={isElectricMode ? theme.colors.purple : theme.colors.danger}
                subtitle={
                  isElectricMode
                    ? `${formatNumber(chargePrice)}원 ÷ ${electricEfficiency.toFixed(1)}km/kWh`
                    : `${formatNumber(fuelPrices[fuelType])}원 ÷ ${fuelEfficiency.toFixed(1)}km/L`
                }
                title="1km당 비용"
                value={formatCurrency(resultCards.costPerKm)}
              />
              <ResultCard
                accentColor={isElectricMode ? theme.colors.purple : theme.colors.primary}
                subtitle={`${formatNumber(homeForm.monthlyKm)}km 기준`}
                title={isElectricMode ? "월 충전비" : "월 유류비"}
                value={formatCurrency(resultCards.monthlyCost)}
              />
            </View>

            <View style={{ gap: theme.spacing.xs }}>
              <Text style={[theme.typography.caption, { fontWeight: "600" }]}>
                월 주행거리 {formatNumber(homeForm.monthlyKm)} km
              </Text>
              <Slider
                maximumTrackTintColor={theme.colors.border}
                maximumValue={MONTHLY_KM_RANGE.max}
                minimumTrackTintColor={isElectricMode ? theme.colors.purple : theme.colors.primary}
                minimumValue={MONTHLY_KM_RANGE.min}
                onValueChange={(value) =>
                  setHomeForm((current) => ({
                    ...current,
                    monthlyKm: Math.round(value / MONTHLY_KM_RANGE.step) * MONTHLY_KM_RANGE.step
                  }))
                }
                step={MONTHLY_KM_RANGE.step}
                thumbTintColor={isElectricMode ? theme.colors.purple : theme.colors.primary}
                value={homeForm.monthlyKm}
              />
            </View>

            <Pressable
              onPress={() => setHomeForm((current) => ({ ...current, showFormula: !current.showFormula }))}
              style={{ paddingVertical: theme.spacing.xs }}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: isElectricMode ? theme.colors.purple : theme.colors.primary, fontWeight: "600" }
                ]}
              >
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
                {isElectricMode ? (
                  <>
                    <Text style={theme.typography.caption}>완충 비용 = 배터리용량 × 충전요금</Text>
                    <Text style={theme.typography.caption}>완충 주행거리 = 배터리용량 × 전비</Text>
                    <Text style={theme.typography.caption}>1km당 비용 = 충전요금 ÷ 전비</Text>
                    <Text style={theme.typography.caption}>월 충전비 = 월 주행거리 ÷ 전비 × 충전요금</Text>
                  </>
                ) : (
                  <>
                    <Text style={theme.typography.caption}>만땅 비용 = 탱크용량 × 연료 단가</Text>
                    <Text style={theme.typography.caption}>만땅 주행거리 = 탱크용량 × 연비</Text>
                    <Text style={theme.typography.caption}>1km당 비용 = 연료 단가 ÷ 연비</Text>
                    <Text style={theme.typography.caption}>월 유류비 = 월 주행거리 ÷ 연비 × 연료 단가</Text>
                  </>
                )}
              </View>
            ) : null}
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${isElectricMode ? theme.colors.purple : theme.colors.primary}10`}
            color={isElectricMode ? theme.colors.purple : theme.colors.primary}
            text="차량을 선택하거나 직접 입력값을 채워주세요."
          />
        )}
      </AppCard>
    </AppScreen>
  );
}
