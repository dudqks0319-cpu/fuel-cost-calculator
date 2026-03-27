import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { Share, Text, View } from "react-native";
import { CompareChart } from "@/components/CompareChart";
import { VehicleSelector, type VehicleSelectionState } from "@/components/VehicleSelector";
import { AppCard, AppScreen, InlineMessage, InputField, PrimaryButton, SegmentedControl, ActionTextButton } from "@/components/ui";
import { vehiclesData } from "@/data/vehicles";
import { calcFuelNeeded, calcMonthlyCost, calcYearlyCost, calcYearlySaving } from "@/utils/calculator";
import { DEFAULT_FUEL_PRICES, DEFAULT_YEARLY_KM, MILEAGE_TYPE_OPTIONS, YEARLY_KM_RANGE } from "@/utils/defaults";
import { formatCurrency, formatLiter, formatNumber } from "@/utils/formatter";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import { getVehicleBySelection } from "@/utils/vehicles";
import type { FuelVehicleRecord, MileageType } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

type CompareFormState = {
  mileageType: MileageType;
  selectionA: VehicleSelectionState;
  selectionB: VehicleSelectionState;
  yearlyKm: number;
  showDetails: boolean;
};

const defaultSelection: VehicleSelectionState = {
  manufacturer: "",
  model: "",
  powertrain: ""
};

const defaultCompareForm: CompareFormState = {
  mileageType: "combined",
  selectionA: defaultSelection,
  selectionB: defaultSelection,
  yearlyKm: DEFAULT_YEARLY_KM,
  showDetails: false
};

const fuelVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType !== "electric") as FuelVehicleRecord[];

function clampYearlyKm(value: number) {
  const rounded = Math.round(value / YEARLY_KM_RANGE.step) * YEARLY_KM_RANGE.step;
  return Math.min(YEARLY_KM_RANGE.max, Math.max(YEARLY_KM_RANGE.min, rounded));
}

function ComparisonRow({
  colorA,
  colorB,
  label,
  valueA,
  valueB
}: {
  colorA: string;
  colorB: string;
  label: string;
  valueA: string;
  valueB: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
      }}
    >
      <Text style={[theme.typography.caption, { flex: 1, fontWeight: "600" }]}>{label}</Text>
      <Text style={[theme.typography.body, { flex: 1, color: colorA, textAlign: "right", fontWeight: "600" }]}>{valueA}</Text>
      <Text style={[theme.typography.body, { flex: 1, color: colorB, textAlign: "right", fontWeight: "600" }]}>{valueB}</Text>
    </View>
  );
}

export default function CompareScreen() {
  const [form, setForm] = useState<CompareFormState>(defaultCompareForm);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const stored = await loadStoredValue(STORAGE_KEYS.compareForm, defaultCompareForm);

      if (!mounted) {
        return;
      }

      setForm(stored);
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

    void saveStoredValue(STORAGE_KEYS.compareForm, form);
  }, [form, loaded]);

  const vehicleA = getVehicleBySelection(
    fuelVehicles,
    form.selectionA.manufacturer,
    form.selectionA.model,
    form.selectionA.powertrain
  );
  const vehicleB = getVehicleBySelection(
    fuelVehicles,
    form.selectionB.manufacturer,
    form.selectionB.model,
    form.selectionB.powertrain
  );

  const mpgA = vehicleA?.mpg[form.mileageType] ?? 0;
  const mpgB = vehicleB?.mpg[form.mileageType] ?? 0;
  const yearlyFuelA = calcFuelNeeded(form.yearlyKm, mpgA);
  const yearlyFuelB = calcFuelNeeded(form.yearlyKm, mpgB);
  const yearlyCostA = vehicleA ? calcYearlyCost(form.yearlyKm, DEFAULT_FUEL_PRICES[vehicleA.fuelType], mpgA) : 0;
  const yearlyCostB = vehicleB ? calcYearlyCost(form.yearlyKm, DEFAULT_FUEL_PRICES[vehicleB.fuelType], mpgB) : 0;
  const monthlyCostA = vehicleA ? calcMonthlyCost(form.yearlyKm / 12, DEFAULT_FUEL_PRICES[vehicleA.fuelType], mpgA) : 0;
  const monthlyCostB = vehicleB ? calcMonthlyCost(form.yearlyKm / 12, DEFAULT_FUEL_PRICES[vehicleB.fuelType], mpgB) : 0;
  const yearlySaving = vehicleA && vehicleB ? calcYearlySaving(form.yearlyKm, vehicleA, vehicleB, DEFAULT_FUEL_PRICES, form.mileageType) : 0;
  const projectionYears = [1, 3, 5, 10];
  const chartData = projectionYears.map((year) => ({
    label: `${year}년`,
    valueA: yearlyCostA * year,
    valueB: yearlyCostB * year
  }));
  const ready = Boolean(vehicleA && vehicleB);

  async function shareResult() {
    if (!vehicleA || !vehicleB) {
      return;
    }

    const message = [
      "[연료비 비교 결과]",
      `${vehicleA.model} ${vehicleA.powertrain} vs ${vehicleB.model} ${vehicleB.powertrain}`,
      `연간 ${formatNumber(form.yearlyKm)}km 주행 시`,
      `연간 유류비 차이: ${formatCurrency(Math.abs(yearlySaving))}`,
      "- 연료비 계산기 앱"
    ].join("\n");

    await Share.share({ message });
  }

  return (
    <AppScreen subtitle="두 차의 유류비를 비교해보세요" title="차량 비교">
      <AppCard accentColor={theme.colors.primary} title="차량 A">
        <VehicleSelector
          accentColor={theme.colors.primary}
          mileageType={form.mileageType}
          mode="fuel"
          onSelectionChange={(selection) => setForm((current) => ({ ...current, selectionA: selection }))}
          selection={form.selectionA}
          vehicles={fuelVehicles}
        />
      </AppCard>

      <AppCard accentColor={theme.colors.success} title="차량 B">
        <VehicleSelector
          accentColor={theme.colors.success}
          mileageType={form.mileageType}
          mode="fuel"
          onSelectionChange={(selection) => setForm((current) => ({ ...current, selectionB: selection }))}
          selection={form.selectionB}
          vehicles={fuelVehicles}
        />
      </AppCard>

      <AppCard title="주행 조건 설정">
        <SegmentedControl
          onChange={(value) => setForm((current) => ({ ...current, mileageType: value }))}
          options={MILEAGE_TYPE_OPTIONS}
          value={form.mileageType}
        />
        <View style={{ gap: 6 }}>
          <Text style={[theme.typography.amount, { color: theme.colors.text, fontSize: 30 }]}>
            {formatNumber(form.yearlyKm)} km/년
          </Text>
          <Slider
            maximumTrackTintColor={theme.colors.border}
            maximumValue={YEARLY_KM_RANGE.max}
            minimumTrackTintColor={theme.colors.primary}
            minimumValue={YEARLY_KM_RANGE.min}
            onValueChange={(value) => setForm((current) => ({ ...current, yearlyKm: clampYearlyKm(value) }))}
            step={YEARLY_KM_RANGE.step}
            thumbTintColor={theme.colors.primary}
            value={form.yearlyKm}
          />
        </View>
        <InputField
          keyboardType="number-pad"
          label="연간 주행거리 직접 입력"
          onChangeText={(text) =>
            setForm((current) => ({
              ...current,
              yearlyKm: clampYearlyKm(Number.parseInt(text.replace(/[^0-9]/g, ""), 10) || YEARLY_KM_RANGE.min)
            }))
          }
          suffix="km"
          value={String(form.yearlyKm)}
        />
      </AppCard>

      <AppCard title="비교 결과">
        {ready && vehicleA && vehicleB ? (
          <>
            <ComparisonRow
              colorA={theme.colors.primary}
              colorB={theme.colors.success}
              label="적용 연비"
              valueA={`${mpgA.toFixed(1)} km/L`}
              valueB={`${mpgB.toFixed(1)} km/L`}
            />
            <ComparisonRow
              colorA={theme.colors.primary}
              colorB={theme.colors.success}
              label="연간 연료량"
              valueA={formatLiter(yearlyFuelA)}
              valueB={formatLiter(yearlyFuelB)}
            />
            <ComparisonRow
              colorA={theme.colors.primary}
              colorB={theme.colors.success}
              label="연간 유류비"
              valueA={formatCurrency(yearlyCostA)}
              valueB={formatCurrency(yearlyCostB)}
            />
            <ComparisonRow
              colorA={theme.colors.primary}
              colorB={theme.colors.success}
              label="월 평균"
              valueA={formatCurrency(monthlyCostA)}
              valueB={formatCurrency(monthlyCostB)}
            />

            <InlineMessage
              backgroundColor={yearlySaving >= 0 ? "#E9F9EE" : "#FFF1F0"}
              color={yearlySaving >= 0 ? theme.colors.success : theme.colors.danger}
              text={
                yearlySaving >= 0
                  ? `차량 B가 연간 ${formatCurrency(yearlySaving)} 절약! 3년이면 ${formatCurrency(yearlySaving * 3)}, 5년이면 ${formatCurrency(yearlySaving * 5)} 차이`
                  : `차량 B가 연간 ${formatCurrency(Math.abs(yearlySaving))} 더 듭니다. 3년이면 ${formatCurrency(Math.abs(yearlySaving) * 3)} 차이입니다.`
              }
            />
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.primary}10`}
            color={theme.colors.primary}
            text="차량 A와 B를 선택해주세요."
          />
        )}
      </AppCard>

      <AppCard title="누적 비용 비교 그래프">
        {ready ? (
          <CompareChart
            accentA={theme.colors.primary}
            accentB={theme.colors.success}
            data={chartData}
            labels={{ a: "차량 A", b: "차량 B" }}
            variant="bar"
          />
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.primary}10`}
            color={theme.colors.primary}
            text="그래프를 보려면 두 차량을 모두 선택해주세요."
          />
        )}
      </AppCard>

      <AppCard
        action={
          <ActionTextButton
            label={form.showDetails ? "접기" : "펼치기"}
            onPress={() => setForm((current) => ({ ...current, showDetails: !current.showDetails }))}
          />
        }
        title="상세 비교"
      >
        {form.showDetails && ready ? (
          <View style={{ gap: theme.spacing.xs }}>
            {projectionYears.map((year) => {
              const delta = (yearlyCostA - yearlyCostB) * year;

              return (
                <Text key={year} style={theme.typography.caption}>
                  {year}년 차이: {formatCurrency(Math.abs(delta))} {delta >= 0 ? "절약" : "추가 지출"}
                </Text>
              );
            })}
            <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: "600" }]}>
              10년간 차량B로 절약하는 금액: {formatCurrency(Math.abs((yearlyCostA - yearlyCostB) * 10))}
            </Text>
          </View>
        ) : (
          <Text style={theme.typography.caption}>비교 상세를 열어 1년, 3년, 5년, 10년 차이를 확인할 수 있습니다.</Text>
        )}
      </AppCard>

      <PrimaryButton label="결과 공유하기" onPress={() => void shareResult()} />
    </AppScreen>
  );
}
