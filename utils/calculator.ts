import {
  ACQUISITION_TAX_RATE,
  ACQUISITION_TAX_RATE_LIGHT,
  EDUCATION_TAX_RATE,
  EV_ACQUISITION_TAX_EXEMPTION,
  EV_ANNUAL_TAX,
  VEHICLE_TAX_BRACKETS
} from "@/utils/defaults";
import { type FuelPriceMap, type MileageType, type VehicleRecord, isElectricVehicle, isFuelVehicle } from "@/types/vehicle";

function roundWhole(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

export function calcFullTankCost(tankCapacity: number, fuelPrice: number) {
  return roundWhole(tankCapacity * fuelPrice);
}

export function calcFullTankRange(tankCapacity: number, mpg: number) {
  return roundWhole(tankCapacity * mpg);
}

export function calcCostPerKm(fuelPrice: number, mpg: number) {
  return mpg > 0 ? roundWhole(fuelPrice / mpg) : 0;
}

export function calcMonthlyCost(monthlyKm: number, fuelPrice: number, mpg: number) {
  return mpg > 0 ? roundWhole((monthlyKm * fuelPrice) / mpg) : 0;
}

export function calcYearlyCost(yearlyKm: number, fuelPrice: number, mpg: number) {
  return mpg > 0 ? roundWhole((yearlyKm * fuelPrice) / mpg) : 0;
}

export function calcFuelNeeded(distance: number, mpg: number) {
  return mpg > 0 ? roundWhole((distance / mpg) * 10) / 10 : 0;
}

export function calcEvCostPerKm(chargePrice: number, efficiency: number) {
  return efficiency > 0 ? roundWhole(chargePrice / efficiency) : 0;
}

export function calcEvMonthlyCost(monthlyKm: number, chargePrice: number, efficiency: number) {
  return efficiency > 0 ? roundWhole((monthlyKm * chargePrice) / efficiency) : 0;
}

export function calcEvYearlyCost(yearlyKm: number, chargePrice: number, efficiency: number) {
  return efficiency > 0 ? roundWhole((yearlyKm * chargePrice) / efficiency) : 0;
}

export function calcEvRange(batteryCapacity: number, efficiency: number) {
  return roundWhole(batteryCapacity * efficiency);
}

function getVehicleEfficiency(vehicle: VehicleRecord, mileageType: MileageType) {
  if (isElectricVehicle(vehicle)) {
    return vehicle.efficiency;
  }

  return vehicle.mpg[mileageType];
}

function getYearlyVehicleCost(
  yearlyKm: number,
  vehicle: VehicleRecord,
  fuelPrices: FuelPriceMap,
  mileageType: MileageType
) {
  const efficiency = getVehicleEfficiency(vehicle, mileageType);

  if (isElectricVehicle(vehicle)) {
    return calcEvYearlyCost(yearlyKm, fuelPrices.electric, efficiency);
  }

  if (!isFuelVehicle(vehicle)) {
    return 0;
  }

  return calcYearlyCost(yearlyKm, fuelPrices[vehicle.fuelType], efficiency);
}

export function calcYearlySaving(
  yearlyKm: number,
  carA: VehicleRecord,
  carB: VehicleRecord,
  fuelPrices: FuelPriceMap,
  mileageType: MileageType = "combined"
) {
  return getYearlyVehicleCost(yearlyKm, carA, fuelPrices, mileageType) - getYearlyVehicleCost(yearlyKm, carB, fuelPrices, mileageType);
}

export function calcBreakEvenMonths(priceDifference: number, yearlySaving: number) {
  if (priceDifference <= 0) {
    return 0;
  }

  if (yearlySaving <= 0) {
    return null;
  }

  return Math.ceil((priceDifference / yearlySaving) * 12);
}

export function calcAcquisitionTax(priceManwon: number, displacement: number, isElectric: boolean) {
  if (isElectric) {
    return roundWhole(Math.max(0, priceManwon * ACQUISITION_TAX_RATE - EV_ACQUISITION_TAX_EXEMPTION));
  }

  if (displacement > 0 && displacement <= 1000) {
    return roundWhole(priceManwon * ACQUISITION_TAX_RATE_LIGHT);
  }

  return roundWhole(priceManwon * ACQUISITION_TAX_RATE);
}

export function calcIndividualConsumptionTax(priceManwon: number, rate: number, limitManwon: number) {
  const rawConsumptionTax = priceManwon * rate;
  const consumptionTax = roundWhole(limitManwon === 0 ? rawConsumptionTax : Math.min(rawConsumptionTax, limitManwon));
  const educationTax = roundWhole(consumptionTax * EDUCATION_TAX_RATE);
  const vat = roundWhole((consumptionTax + educationTax) * 0.1);
  const totalTax = consumptionTax + educationTax + vat;

  return {
    consumptionTax,
    educationTax,
    vat,
    totalTax
  };
}

export function calcAnnualVehicleTax(displacement: number, isElectric: boolean) {
  if (isElectric) {
    return EV_ANNUAL_TAX + roundWhole(EV_ANNUAL_TAX * EDUCATION_TAX_RATE);
  }

  const bracket = VEHICLE_TAX_BRACKETS.find((candidate) => displacement <= candidate.maxCc) ?? VEHICLE_TAX_BRACKETS[VEHICLE_TAX_BRACKETS.length - 1];
  const baseTax = displacement * bracket.ratePerCc;
  return roundWhole(baseTax + baseTax * EDUCATION_TAX_RATE);
}

export function calcTripFuelCost(distanceKm: number, fuelPrice: number, mpg: number) {
  return mpg > 0 ? roundWhole((distanceKm / mpg) * fuelPrice) : 0;
}

export function calcEvTripCost(distanceKm: number, chargePrice: number, efficiency: number) {
  return efficiency > 0 ? roundWhole((distanceKm / efficiency) * chargePrice) : 0;
}
