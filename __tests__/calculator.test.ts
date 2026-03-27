import { describe, expect, it } from "vitest";
import {
  calcAcquisitionTax,
  calcAnnualVehicleTax,
  calcBreakEvenMonths,
  calcCostPerKm,
  calcEvCostPerKm,
  calcEvMonthlyCost,
  calcEvRange,
  calcEvYearlyCost,
  calcEvTripCost,
  calcFuelNeeded,
  calcFullTankCost,
  calcFullTankRange,
  calcIndividualConsumptionTax,
  calcMonthlyCost,
  calcTripFuelCost,
  calcYearlyCost,
  calcYearlySaving
} from "@/utils/calculator";
import type { ElectricVehicleRecord, FuelVehicleRecord } from "@/types/vehicle";

describe("calculator", () => {
  it("calculates internal combustion metrics", () => {
    expect(calcFullTankCost(60, 1800)).toBe(108000);
    expect(calcFullTankRange(60, 10)).toBe(600);
    expect(calcCostPerKm(1839, 10)).toBe(184);
    expect(calcMonthlyCost(1000, 1800, 10)).toBe(180000);
    expect(calcYearlyCost(15000, 1839, 10)).toBe(2758500);
    expect(calcFuelNeeded(15000, 10)).toBe(1500);
  });

  it("calculates EV metrics", () => {
    expect(calcEvCostPerKm(347, 5.2)).toBe(67);
    expect(calcEvMonthlyCost(1000, 170, 5.2)).toBe(32692);
    expect(calcEvYearlyCost(15000, 347, 5.2)).toBe(1000962);
    expect(calcEvRange(72.6, 5.2)).toBe(378);
  });

  it("calculates yearly savings across fuel and EV vehicles", () => {
    const fuelVehicle: FuelVehicleRecord = {
      manufacturer: "현대",
      model: "싼타페",
      powertrain: "2.5T 가솔린",
      fuelType: "gasoline",
      price: 3381,
      displacement: 2497,
      tankCapacity: 67,
      mpg: {
        combined: 10,
        city: 8.8,
        highway: 12
      }
    };
    const hybridVehicle: FuelVehicleRecord = {
      manufacturer: "현대",
      model: "싼타페",
      powertrain: "1.6T 하이브리드",
      fuelType: "gasoline",
      price: 3781,
      displacement: 1598,
      tankCapacity: 67,
      mpg: {
        combined: 15,
        city: 15.7,
        highway: 14.2
      }
    };
    const electricVehicle: ElectricVehicleRecord = {
      manufacturer: "현대",
      model: "아이오닉5",
      powertrain: "롱레인지 2WD",
      fuelType: "electric",
      price: 4695,
      batteryCapacity: 72.6,
      efficiency: 5.2
    };

    expect(
      calcYearlySaving(15000, fuelVehicle, hybridVehicle, {
        gasoline: 1839,
        diesel: 1836,
        lpg: 1050,
        electric: 347
      })
    ).toBe(919500);

    expect(
      calcYearlySaving(15000, fuelVehicle, electricVehicle, {
        gasoline: 1839,
        diesel: 1836,
        lpg: 1050,
        electric: 347
      })
    ).toBe(1757538);
  });

  it("calculates break-even months conservatively", () => {
    expect(calcBreakEvenMonths(8000000, 1756962)).toBe(55);
    expect(calcBreakEvenMonths(8000000, 0)).toBeNull();
  });

  it("verifies the EV comparison example with exact formula rounding", () => {
    const yearlyFuelCost = calcYearlyCost(15000, 1839, 10);
    const yearlyEvCost = calcEvYearlyCost(15000, 347, 5.2);
    const yearlySaving = yearlyFuelCost - yearlyEvCost;

    expect(yearlyFuelCost).toBe(2758500);
    expect(yearlyEvCost).toBe(1000962);
    expect(yearlySaving).toBe(1757538);
    expect(calcBreakEvenMonths(8000000, yearlySaving)).toBe(55);
  });
});

describe("tax calculations", () => {
  it("calculates acquisition tax for normal vehicle", () => {
    expect(calcAcquisitionTax(3381, 2497, false)).toBe(237);
  });

  it("calculates acquisition tax for light vehicle", () => {
    expect(calcAcquisitionTax(1225, 998, false)).toBe(49);
  });

  it("calculates acquisition tax for EV", () => {
    expect(calcAcquisitionTax(4695, 0, true)).toBe(189);
  });

  it("calculates individual consumption tax", () => {
    const result = calcIndividualConsumptionTax(3381, 0.035, 100);
    expect(result.consumptionTax).toBe(100);
    expect(result.educationTax).toBe(30);
    expect(result.vat).toBe(13);
    expect(result.totalTax).toBe(143);
  });

  it("calculates annual vehicle tax", () => {
    expect(calcAnnualVehicleTax(2497, false)).toBe(649220);
    expect(calcAnnualVehicleTax(0, true)).toBe(130000);
  });

  it("calculates trip fuel cost", () => {
    expect(calcTripFuelCost(400, 1839, 10)).toBe(73560);
  });

  it("calculates EV trip cost", () => {
    expect(calcEvTripCost(400, 347, 5.2)).toBe(26692);
  });
});
