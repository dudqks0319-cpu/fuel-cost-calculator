import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { DEFAULT_FUEL_PRICES } from "@/utils/defaults";
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from "@/utils/storage";
import type { FuelPriceMap } from "@/types/vehicle";

type FuelPriceContextValue = {
  fuelPrices: FuelPriceMap;
  setFuelPrices: React.Dispatch<React.SetStateAction<FuelPriceMap>>;
};

const FuelPriceContext = createContext<FuelPriceContextValue | null>(null);

export function FuelPriceProvider({ children }: PropsWithChildren) {
  const [fuelPrices, setFuelPrices] = useState<FuelPriceMap>(DEFAULT_FUEL_PRICES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const stored = await loadStoredValue(STORAGE_KEYS.fuelPrices, DEFAULT_FUEL_PRICES);
      if (!mounted) {
        return;
      }
      setFuelPrices(stored);
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

  const value = useMemo(
    () => ({
      fuelPrices,
      setFuelPrices
    }),
    [fuelPrices]
  );

  return <FuelPriceContext.Provider value={value}>{children}</FuelPriceContext.Provider>;
}

export function useFuelPrices() {
  const context = useContext(FuelPriceContext);

  if (!context) {
    throw new Error("useFuelPrices must be used within FuelPriceProvider");
  }

  return context;
}
