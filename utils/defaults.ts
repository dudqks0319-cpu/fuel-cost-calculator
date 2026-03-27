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

export const ACQUISITION_TAX_RATE = 0.07;
export const ACQUISITION_TAX_RATE_LIGHT = 0.04;
export const EV_ACQUISITION_TAX_EXEMPTION = 140;

export const INDIVIDUAL_TAX_PRESETS = [
  { key: "normal", label: "일반 (3.5%)", rate: 0.035, limitManwon: 100 },
  { key: "hybrid", label: "하이브리드 (3.5%)", rate: 0.035, limitManwon: 70 },
  { key: "ev", label: "전기차 (면제)", rate: 0, limitManwon: 300 },
  { key: "none", label: "인하 없음 (5%)", rate: 0.05, limitManwon: 0 }
] as const;

export const VEHICLE_TAX_BRACKETS = [
  { maxCc: 1000, ratePerCc: 80 },
  { maxCc: 1600, ratePerCc: 140 },
  { maxCc: Infinity, ratePerCc: 200 }
] as const;

export const EV_ANNUAL_TAX = 100000;
export const EDUCATION_TAX_RATE = 0.3;

export const DISTANCE_PRESETS = [
  { label: "서울 ↔ 부산", km: 400 },
  { label: "서울 ↔ 대전", km: 160 },
  { label: "서울 ↔ 광주", km: 270 },
  { label: "서울 ↔ 대구", km: 300 },
  { label: "서울 ↔ 강릉", km: 230 },
  { label: "서울 ↔ 전주", km: 230 },
  { label: "서울 ↔ 속초", km: 210 },
  { label: "서울 ↔ 제주(도로)", km: 450 },
  { label: "부산 ↔ 광주", km: 270 },
  { label: "대전 ↔ 부산", km: 240 }
] as const;
