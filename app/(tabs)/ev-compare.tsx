import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { Share, Text, View } from "react-native";
import { CompareChart } from "@/components/CompareChart";
import { VehicleSelector, type VehicleSelectionState } from "@/components/VehicleSelector";
import { ActionTextButton, AppCard, AppScreen, InlineMessage, InputField, PrimaryButton, SegmentedControl } from "@/components/ui";
import vehiclesData from "@/data/vehicles.json";
import {
  calcBreakEvenMonths,
  calcCostPerKm,
  calcEvCostPerKm,
  calcEvMonthlyCost,
  calcEvYearlyCost,
  calcMonthlyCost,
  calcYearlyCost
} from "@/utils/calculator";
import {
  CHARGE_PRESETS,
  DEFAULT_EV_PRICE_DIFF_MANWON,
  DEFAULT_FUEL_PRICES,
  DEFAULT_YEARLY_KM,
  YEARLY_KM_RANGE,
  type ChargePresetKey
} from "@/utils/defaults";
import { formatCurrency, formatNumber } from "@/utils/formatter";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import { getVehicleBySelection } from "@/utils/vehicles";
import type { ElectricVehicleRecord, FuelVehicleRecord } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

type EvCompareFormState = {
  chargeMode: ChargePresetKey;
  fuelSelection: VehicleSelectionState;
  evSelection: VehicleSelectionState;
  manualChargePrice: string;
  priceDiffManwon: string;
  showDetails: boolean;
  yearlyKm: number;
};

const defaultSelection: VehicleSelectionState = {
  manufacturer: "",
  model: "",
  powertrain: ""
};

const defaultForm: EvCompareFormState = {
  chargeMode: "fast",
  fuelSelection: defaultSelection,
  evSelection: defaultSelection,
  manualChargePrice: "",
  priceDiffManwon: String(DEFAULT_EV_PRICE_DIFF_MANWON),
  showDetails: false,
  yearlyKm: DEFAULT_YEARLY_KM
};

const fuelVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType !== "electric") as FuelVehicleRecord[];
const electricVehicles = vehiclesData.vehicles.filter((vehicle) => vehicle.fuelType === "electric") as ElectricVehicleRecord[];

function clampYearlyKm(value: number) {
  const rounded = Math.round(value / YEARLY_KM_RANGE.step) * YEARLY_KM_RANGE.step;
  return Math.min(YEARLY_KM_RANGE.max, Math.max(YEARLY_KM_RANGE.min, rounded));
}

function monthsToLabel(months: number | null) {
  if (months === null) {
    return "손익분기 없음";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths}개월`;
  }

  return `${years}년 ${remainingMonths}개월`;
}

function ResultRow({
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

export default function EvCompareScreen() {
  const [form, setForm] = useState<EvCompareFormState>(defaultForm);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const stored = await loadStoredValue(STORAGE_KEYS.evCompareForm, defaultForm);

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

    void saveStoredValue(STORAGE_KEYS.evCompareForm, form);
  }, [form, loaded]);

  const fuelVehicle = getVehicleBySelection(
    fuelVehicles,
    form.fuelSelection.manufacturer,
    form.fuelSelection.model,
    form.fuelSelection.powertrain
  );
  const evVehicle = getVehicleBySelection(
    electricVehicles,
    form.evSelection.manufacturer,
    form.evSelection.model,
    form.evSelection.powertrain
  );
  const chargePreset = CHARGE_PRESETS.find((preset) => preset.key === form.chargeMode);
  const chargePrice = form.chargeMode === "manual" ? Number.parseInt(form.manualChargePrice.replace(/[^0-9]/g, ""), 10) || 0 : chargePreset?.price ?? 0;
  const priceDiffWon = (Number.parseInt(form.priceDiffManwon.replace(/[^0-9]/g, ""), 10) || 0) * 10000;
  const fuelEfficiency = fuelVehicle?.mpg.combined ?? 0;
  const evEfficiency = evVehicle?.efficiency ?? 0;
  const fuelYearlyCost = fuelVehicle ? calcYearlyCost(form.yearlyKm, DEFAULT_FUEL_PRICES[fuelVehicle.fuelType], fuelEfficiency) : 0;
  const evYearlyCost = evVehicle ? calcEvYearlyCost(form.yearlyKm, chargePrice, evEfficiency) : 0;
  const fuelMonthlyCost = fuelVehicle ? calcMonthlyCost(form.yearlyKm / 12, DEFAULT_FUEL_PRICES[fuelVehicle.fuelType], fuelEfficiency) : 0;
  const evMonthlyCost = evVehicle ? calcEvMonthlyCost(form.yearlyKm / 12, chargePrice, evEfficiency) : 0;
  const fuelCostPerKm = fuelVehicle ? calcCostPerKm(DEFAULT_FUEL_PRICES[fuelVehicle.fuelType], fuelEfficiency) : 0;
  const evCostPerKm = evVehicle ? calcEvCostPerKm(chargePrice, evEfficiency) : 0;
  const yearlySaving = fuelYearlyCost - evYearlyCost;
  const breakEvenMonths = calcBreakEvenMonths(priceDiffWon, yearlySaving);
  const breakEvenIndex = breakEvenMonths === null ? null : Math.max(0, Math.min(9, Math.ceil(breakEvenMonths / 12) - 1));
  const yearlyData = Array.from({ length: 10 }, (_, index) => {
    const year = index + 1;

    return {
      label: `${year}년`,
      valueA: fuelYearlyCost * year,
      valueB: priceDiffWon + evYearlyCost * year
    };
  });
  const ready = Boolean(fuelVehicle && evVehicle);

  async function shareResult() {
    if (!fuelVehicle || !evVehicle) {
      return;
    }

    const message = [
      "[전기차 비교 결과]",
      `${fuelVehicle.model} ${fuelVehicle.powertrain} vs ${evVehicle.model} ${evVehicle.powertrain}`,
      `연간 ${formatNumber(form.yearlyKm)}km 주행 시`,
      `연간 절약액: ${formatCurrency(Math.max(yearlySaving, 0))}`,
      `손익분기: ${monthsToLabel(breakEvenMonths)}`,
      "- 연료비 계산기 앱"
    ].join("\n");

    await Share.share({ message });
  }

  return (
    <AppScreen subtitle="전기차로 바꾸면 얼마나 절약될까요?" title="전기차 비교">
      <AppCard accentColor={theme.colors.danger} title="내연기관 차량">
        <VehicleSelector
          accentColor={theme.colors.danger}
          mode="fuel"
          onSelectionChange={(selection) => setForm((current) => ({ ...current, fuelSelection: selection }))}
          selection={form.fuelSelection}
          vehicles={fuelVehicles}
        />
      </AppCard>

      <AppCard accentColor={theme.colors.purple} title="전기차">
        <VehicleSelector
          accentColor={theme.colors.purple}
          mode="electric"
          onSelectionChange={(selection) => setForm((current) => ({ ...current, evSelection: selection }))}
          selection={form.evSelection}
          vehicles={electricVehicles}
        />
      </AppCard>

      <AppCard title="충전 조건">
        <SegmentedControl
          onChange={(value) => setForm((current) => ({ ...current, chargeMode: value }))}
          options={CHARGE_PRESETS.map((preset) => ({ label: preset.label, value: preset.key }))}
          value={form.chargeMode}
        />
        {form.chargeMode === "manual" ? (
          <InputField
            keyboardType="number-pad"
            label="충전 요금 직접 입력"
            onChangeText={(text) => setForm((current) => ({ ...current, manualChargePrice: text.replace(/[^0-9]/g, "") }))}
            suffix="원/kWh"
            value={form.manualChargePrice}
          />
        ) : null}
        <Text style={theme.typography.caption}>현재 적용 요금: {formatNumber(chargePrice)}원/kWh</Text>
      </AppCard>

      <AppCard title="주행 조건">
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
          label="차량 가격 차이"
          helperText="예: 전기차 4,800만원 - 내연기관 4,000만원 = 800만원"
          onChangeText={(text) => setForm((current) => ({ ...current, priceDiffManwon: text.replace(/[^0-9]/g, "") }))}
          suffix="만원"
          value={form.priceDiffManwon}
        />
      </AppCard>

      <AppCard title="비교 결과">
        {ready && fuelVehicle && evVehicle ? (
          <>
            <ResultRow
              colorA={theme.colors.danger}
              colorB={theme.colors.purple}
              label="에너지 효율"
              valueA={`${fuelEfficiency.toFixed(1)} km/L`}
              valueB={`${evEfficiency.toFixed(1)} km/kWh`}
            />
            <ResultRow
              colorA={theme.colors.danger}
              colorB={theme.colors.purple}
              label="연간 에너지비"
              valueA={formatCurrency(fuelYearlyCost)}
              valueB={formatCurrency(evYearlyCost)}
            />
            <ResultRow
              colorA={theme.colors.danger}
              colorB={theme.colors.purple}
              label="월 평균"
              valueA={formatCurrency(fuelMonthlyCost)}
              valueB={formatCurrency(evMonthlyCost)}
            />
            <ResultRow
              colorA={theme.colors.danger}
              colorB={theme.colors.purple}
              label="1km당 비용"
              valueA={formatCurrency(fuelCostPerKm)}
              valueB={formatCurrency(evCostPerKm)}
            />
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.purple}12`}
            color={theme.colors.purple}
            text="차량을 선택해주세요."
          />
        )}
      </AppCard>

      <AppCard title="손익분기점">
        {ready ? (
          <View
            style={{
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              gap: theme.spacing.xs,
              backgroundColor: `${theme.colors.purple}18`
            }}
          >
            <Text style={[theme.typography.amount, { color: theme.colors.purple }]}>{monthsToLabel(breakEvenMonths)}</Text>
            <Text style={[theme.typography.body, { color: theme.colors.purple, fontWeight: "600" }]}>
              {breakEvenMonths === null ? "현재 조건에서는 전기차가 이득이 되지 않습니다." : "이 시점부터 전기차가 이득입니다."}
            </Text>
            <Text style={theme.typography.caption}>
              차량 가격 차이 {formatCurrency(priceDiffWon)} ÷ 연간 절약 {formatCurrency(Math.max(yearlySaving, 0))} ={" "}
              {yearlySaving > 0 ? `${(priceDiffWon / yearlySaving).toFixed(1)}년` : "손익분기 없음"}
            </Text>
          </View>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.purple}12`}
            color={theme.colors.purple}
            text="손익분기 계산을 보려면 내연기관 차량과 전기차를 모두 선택해주세요."
          />
        )}
      </AppCard>

      <AppCard title="누적 비용 비교 그래프">
        {ready ? (
          <>
            <CompareChart
              accentA={theme.colors.danger}
              accentB={theme.colors.purple}
              data={yearlyData}
              highlightIndex={breakEvenIndex}
              labels={{ a: "내연기관", b: "전기차" }}
              variant="line"
            />
            <Text style={theme.typography.caption}>
              빨간선이 보라선 위로 가는 시점이 전기차가 이득인 시점입니다.
            </Text>
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.purple}12`}
            color={theme.colors.purple}
            text="그래프를 보려면 차량을 선택해주세요."
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
        title="연도별 상세"
      >
        {form.showDetails && ready ? (
          <View style={{ gap: theme.spacing.xs }}>
            {yearlyData.map((item) => {
              const delta = item.valueA - item.valueB;

              return (
                <Text key={item.label} style={theme.typography.caption}>
                  {item.label}: 내연기관 {formatCurrency(item.valueA)} / 전기차 {formatCurrency(item.valueB)} / 차이 {formatCurrency(Math.abs(delta))}
                </Text>
              );
            })}
          </View>
        ) : (
          <Text style={theme.typography.caption}>1년차부터 10년차까지 누적 비용 차이를 확인할 수 있습니다.</Text>
        )}
      </AppCard>

      <PrimaryButton label="결과 공유하기" onPress={() => void shareResult()} />
    </AppScreen>
  );
}
