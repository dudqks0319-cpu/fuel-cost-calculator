import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  fuelPrices: "@fuel-cost-mobile/fuel-prices",
  homeForm: "@fuel-cost-mobile/home-form",
  compareForm: "@fuel-cost-mobile/compare-form",
  evCompareForm: "@fuel-cost-mobile/ev-compare-form",
  purchaseForm: "@fuel-cost-mobile/purchase-form"
} as const;

export async function loadStoredValue<T>(key: string, fallback: T) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStoredValue<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
