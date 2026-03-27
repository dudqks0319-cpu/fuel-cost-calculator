import type { FuelPriceMap, FuelType, MileageType } from "@/types/vehicle";

export const DEFAULT_FUEL_PRICES: FuelPriceMap = {
  gasoline: 1839,
  diesel: 1836,
  lpg: 1050,
  electric: 347
};

export const CHARGE_PRESETS = [
  { key: "fast", label: "공공급속", price: 347 },
  { key: "slow", label: "공공완속", price: 324 },
  { key: "home", label: "가정충전", price: 170 },
  { key: "manual", label: "직접입력", price: 0 }
] as const;

export type ChargePresetKey = (typeof CHARGE_PRESETS)[number]["key"];

export const MILEAGE_TYPE_OPTIONS: { label: string; value: MileageType }[] = [
  { label: "복합", value: "combined" },
  { label: "도심", value: "city" },
  { label: "고속", value: "highway" }
];

export const MANUAL_FUEL_OPTIONS: { label: string; value: Exclude<FuelType, "electric"> }[] = [
  { label: "휘발유", value: "gasoline" },
  { label: "경유", value: "diesel" },
  { label: "LPG", value: "lpg" }
];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: "휘발유",
  diesel: "경유",
  lpg: "LPG",
  electric: "전기"
};

export const DEFAULT_MONTHLY_KM = 1000;
export const DEFAULT_YEARLY_KM = 15000;
export const DEFAULT_EV_PRICE_DIFF_MANWON = 800;

export const MONTHLY_KM_RANGE = {
  min: 500,
  max: 5000,
  step: 100
};

export const YEARLY_KM_RANGE = {
  min: 5000,
  max: 50000,
  step: 1000
};
