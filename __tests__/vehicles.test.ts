import { describe, expect, it } from "vitest";
import { vehiclesData } from "@/data/vehicles";
import {
  filterVehiclesByMode,
  getManufacturers,
  getModelsForManufacturer,
  getPowertrainsForModel,
  getSelectedEfficiency
} from "@/utils/vehicles";

describe("vehicle helpers", () => {
  it("filters vehicles by fuel or electric mode", () => {
    expect(filterVehiclesByMode(vehiclesData.vehicles, "fuel").every((vehicle) => vehicle.fuelType !== "electric")).toBe(true);
    expect(filterVehiclesByMode(vehiclesData.vehicles, "electric").every((vehicle) => vehicle.fuelType === "electric")).toBe(true);
  });

  it("builds manufacturer, model, and powertrain options", () => {
    expect(getManufacturers(vehiclesData.vehicles, "all")).toEqual(["기아", "현대"]);
    expect(getModelsForManufacturer(vehiclesData.vehicles, "현대", "all")).toEqual(["싼타페", "아이오닉5", "아이오닉6", "투싼"]);
    expect(getPowertrainsForModel(vehiclesData.vehicles, "현대", "싼타페", "all")).toEqual([
      "1.6T 하이브리드",
      "2.5T 가솔린"
    ]);
  });

  it("selects the right efficiency metric for each vehicle type", () => {
    const santaFe = vehiclesData.vehicles.find(
      (vehicle) => vehicle.model === "싼타페" && vehicle.powertrain === "2.5T 가솔린"
    );
    const ionic5 = vehiclesData.vehicles.find((vehicle) => vehicle.model === "아이오닉5");

    expect(getSelectedEfficiency(santaFe, "combined")).toBe(10);
    expect(getSelectedEfficiency(santaFe, "city")).toBe(8.8);
    expect(getSelectedEfficiency(ionic5, "combined")).toBe(5.2);
  });
});
