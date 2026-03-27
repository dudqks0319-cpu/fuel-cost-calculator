import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { VehicleSelector, type VehicleSelectionState } from "@/components/VehicleSelector";
import { AppCard, AppScreen, InlineMessage, InputField, PrimaryButton, SegmentedControl } from "@/components/ui";
import { vehiclesData } from "@/data/vehicles";
import {
  calcAcquisitionTax,
  calcAnnualVehicleTax,
  calcEvTripCost,
  calcFuelNeeded,
  calcIndividualConsumptionTax,
  calcTripFuelCost,
  calcYearlyCost,
  calcEvYearlyCost
} from "@/utils/calculator";
import {
  DEFAULT_YEARLY_KM,
  DISTANCE_PRESETS,
  INDIVIDUAL_TAX_PRESETS
} from "@/utils/defaults";
import { formatCurrency, formatLiter, formatNumber } from "@/utils/formatter";
import { useFuelPrices } from "@/utils/FuelPriceContext";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import { getVehicleBySelection } from "@/utils/vehicles";
import { isElectricVehicle, isFuelVehicle, type VehicleRecord } from "@/types/vehicle";
import { theme } from "@/theme/tokens";

type PurchaseFormState = {
  selection: VehicleSelectionState;
  manualPriceManwon: string;
  manualDisplacement: string;
  selectedTaxPreset: (typeof INDIVIDUAL_TAX_PRESETS)[number]["key"];
  discountRate: number;
  selectedDistanceLabel: string;
  manualDistanceKm: string;
};

const defaultSelection: VehicleSelectionState = {
  manufacturer: "",
  model: "",
  powertrain: ""
};

const defaultPurchaseForm: PurchaseFormState = {
  selection: defaultSelection,
  manualPriceManwon: "",
  manualDisplacement: "",
  selectedTaxPreset: "normal",
  discountRate: 0,
  selectedDistanceLabel: DISTANCE_PRESETS[0].label,
  manualDistanceKm: ""
};

function sanitizeNumber(text: string, allowDecimal = false) {
  return text.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
}

function parseNumeric(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatManwonCurrency(value: number) {
  return formatCurrency(value * 10000);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}>
      <Text style={theme.typography.caption}>{label}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}

export default function PurchaseScreen() {
  const { fuelPrices } = useFuelPrices();
  const [form, setForm] = useState<PurchaseFormState>(defaultPurchaseForm);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const stored = await loadStoredValue(STORAGE_KEYS.purchaseForm, defaultPurchaseForm);
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

    void saveStoredValue(STORAGE_KEYS.purchaseForm, form);
  }, [form, loaded]);

  const vehicle = getVehicleBySelection(
    vehiclesData.vehicles,
    form.selection.manufacturer,
    form.selection.model,
    form.selection.powertrain
  ) as VehicleRecord | undefined;

  const isElectric = vehicle ? isElectricVehicle(vehicle) : false;
  const effectivePriceManwon = vehicle?.price && vehicle.price > 0 ? vehicle.price : parseNumeric(form.manualPriceManwon);
  const effectiveDisplacement =
    vehicle && isFuelVehicle(vehicle) && vehicle.displacement > 0 ? vehicle.displacement : parseNumeric(form.manualDisplacement);
  const selectedTaxPreset = INDIVIDUAL_TAX_PRESETS.find((preset) => preset.key === form.selectedTaxPreset) ?? INDIVIDUAL_TAX_PRESETS[0];
  const discountedPriceManwon = Math.round(effectivePriceManwon * (1 - form.discountRate / 100));
  const acquisitionTax = calcAcquisitionTax(discountedPriceManwon, effectiveDisplacement, isElectric);
  const individualTax = calcIndividualConsumptionTax(discountedPriceManwon, selectedTaxPreset.rate, selectedTaxPreset.limitManwon);
  const annualVehicleTax = calcAnnualVehicleTax(effectiveDisplacement, isElectric);
  const selectedDistanceKm =
    parseNumeric(form.manualDistanceKm) ||
    DISTANCE_PRESETS.find((preset) => preset.label === form.selectedDistanceLabel)?.km ||
    DISTANCE_PRESETS[0].km;

  const tripSummary = useMemo(() => {
    if (!vehicle) {
      return null;
    }

    if (isElectricVehicle(vehicle)) {
      const requiredEnergy = vehicle.efficiency > 0 ? selectedDistanceKm / vehicle.efficiency : 0;
      return {
        amountLabel: `${requiredEnergy.toFixed(1)} kWh`,
        cost: calcEvTripCost(selectedDistanceKm, fuelPrices.electric, vehicle.efficiency)
      };
    }

    const mileage = vehicle.mpg.combined;
    return {
      amountLabel: formatLiter(calcFuelNeeded(selectedDistanceKm, mileage)),
      cost: calcTripFuelCost(selectedDistanceKm, fuelPrices[vehicle.fuelType], mileage)
    };
  }, [fuelPrices, selectedDistanceKm, vehicle]);

  const annualEnergyCost = useMemo(() => {
    if (!vehicle) {
      return 0;
    }

    if (isElectricVehicle(vehicle)) {
      return calcEvYearlyCost(DEFAULT_YEARLY_KM, fuelPrices.electric, vehicle.efficiency);
    }

    return calcYearlyCost(DEFAULT_YEARLY_KM, fuelPrices[vehicle.fuelType], vehicle.mpg.combined);
  }, [fuelPrices, vehicle]);

  const annualMaintenanceCost = annualVehicleTax + annualEnergyCost;

  async function shareResult() {
    await Share.share({
      message: [
        "[구매 계산 결과]",
        vehicle ? `${vehicle.model} ${vehicle.powertrain}` : "직접 입력 차량",
        `취득세: ${formatManwonCurrency(acquisitionTax)}`,
        `연간 유지비: ${formatCurrency(annualMaintenanceCost)}`,
        "- 연료비 계산기 앱"
      ].join("\n")
    });
  }

  return (
    <AppScreen subtitle="구매 시 세금과 구간 연료비를 알아보세요" title="구매 계산기">
      <AppCard title="차량 정보">
        <VehicleSelector
          mode="all"
          onSelectionChange={(selection) => setForm((current) => ({ ...current, selection }))}
          selection={form.selection}
          vehicles={vehiclesData.vehicles}
        />
        <InputField
          keyboardType="number-pad"
          label="차량 가격"
          onChangeText={(text) => setForm((current) => ({ ...current, manualPriceManwon: sanitizeNumber(text) }))}
          suffix="만원"
          value={vehicle?.price && vehicle.price > 0 ? String(vehicle.price) : form.manualPriceManwon}
        />
        <InputField
          keyboardType="number-pad"
          label="배기량"
          onChangeText={(text) => setForm((current) => ({ ...current, manualDisplacement: sanitizeNumber(text) }))}
          suffix="cc"
          value={vehicle && isFuelVehicle(vehicle) && vehicle.displacement > 0 ? String(vehicle.displacement) : form.manualDisplacement}
        />
      </AppCard>

      <AppCard title="취득세">
        <SummaryRow label="원가" value={formatManwonCurrency(effectivePriceManwon)} />
        <SummaryRow label="할인가" value={formatManwonCurrency(discountedPriceManwon)} />
        <SummaryRow label="예상 취득세" value={formatManwonCurrency(acquisitionTax)} />
        <Text style={theme.typography.caption}>할인율 {form.discountRate}%</Text>
        <Slider
          maximumTrackTintColor={theme.colors.border}
          maximumValue={30}
          minimumTrackTintColor={theme.colors.primary}
          minimumValue={0}
          onValueChange={(value) => setForm((current) => ({ ...current, discountRate: Math.round(value / 5) * 5 }))}
          step={5}
          thumbTintColor={theme.colors.primary}
          value={form.discountRate}
        />
        <Text style={theme.typography.caption}>
          {isElectric
            ? "전기차 감면 한도를 적용했습니다."
            : effectiveDisplacement > 0 && effectiveDisplacement <= 1000
              ? "경차 4% 세율을 적용했습니다."
              : "일반 승용 7% 세율을 적용했습니다."}
        </Text>
      </AppCard>

      <AppCard title="개별소비세">
        <SegmentedControl
          onChange={(value) => setForm((current) => ({ ...current, selectedTaxPreset: value }))}
          options={INDIVIDUAL_TAX_PRESETS.map((preset) => ({ label: preset.label, value: preset.key }))}
          value={form.selectedTaxPreset}
        />
        <SummaryRow label="개별소비세" value={formatManwonCurrency(individualTax.consumptionTax)} />
        <SummaryRow label="교육세" value={formatManwonCurrency(individualTax.educationTax)} />
        <SummaryRow label="부가세" value={formatManwonCurrency(individualTax.vat)} />
        <SummaryRow label="합계" value={formatManwonCurrency(individualTax.totalTax)} />
        <Text style={theme.typography.caption}>2026년 6월까지 30% 인하(3.5%) 적용 중</Text>
      </AppCard>

      <AppCard title="연간 자동차세">
        <SummaryRow label="예상 자동차세" value={formatCurrency(annualVehicleTax)} />
        <Text style={theme.typography.caption}>
          {isElectric ? "전기차 고정 130,000원" : `배기량 ${formatNumber(effectiveDisplacement)}cc × 세율 + 교육세 30%`}
        </Text>
      </AppCard>

      <AppCard title="구간 연료비 계산">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
            {DISTANCE_PRESETS.map((preset) => {
              const active = preset.label === form.selectedDistanceLabel;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => setForm((current) => ({ ...current, selectedDistanceLabel: preset.label, manualDistanceKm: "" }))}
                  style={{
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.radius.pill,
                    backgroundColor: active ? theme.colors.primary : theme.colors.input
                  }}
                >
                  <Text style={{ color: active ? "#FFFFFF" : theme.colors.text, fontSize: 12, fontWeight: "600" }}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <InputField
          keyboardType="number-pad"
          label="직접 거리 입력"
          onChangeText={(text) => setForm((current) => ({ ...current, manualDistanceKm: sanitizeNumber(text) }))}
          suffix="km"
          value={form.manualDistanceKm}
        />
        {tripSummary ? (
          <>
            <SummaryRow label={isElectric ? "필요 전력량" : "필요 연료량"} value={tripSummary.amountLabel} />
            <SummaryRow label={isElectric ? "예상 충전비용" : "예상 연료비용"} value={formatCurrency(tripSummary.cost)} />
            <Text style={theme.typography.caption}>
              {isElectric ? `전기 요금 ${formatNumber(fuelPrices.electric)}원/kWh 기준` : "현재 유가 기준으로 계산합니다."}
            </Text>
          </>
        ) : (
          <InlineMessage
            backgroundColor={`${theme.colors.primary}10`}
            color={theme.colors.primary}
            text="차량을 먼저 선택하면 구간 연료비를 계산할 수 있습니다."
          />
        )}
      </AppCard>

      <AppCard title="연간 유지비 요약">
        <SummaryRow label="연간 자동차세" value={formatCurrency(annualVehicleTax)} />
        <SummaryRow label="연간 에너지 비용" value={formatCurrency(annualEnergyCost)} />
        <SummaryRow label="연간 유지비" value={formatCurrency(annualMaintenanceCost)} />
        <SummaryRow label="월평균 유지비" value={formatCurrency(Math.round(annualMaintenanceCost / 12))} />
        <InlineMessage
          backgroundColor={`${theme.colors.primary}10`}
          color={theme.colors.primary}
          text={`연간 유지비는 자동차세와 연간 ${formatNumber(DEFAULT_YEARLY_KM)}km 기준 연료비를 더한 값입니다.`}
        />
      </AppCard>

      <PrimaryButton label="결과 공유하기" onPress={() => void shareResult()} />
    </AppScreen>
  );
}
