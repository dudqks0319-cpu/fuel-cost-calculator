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
    expect(getManufacturers(vehiclesData.vehicles, "all")).toEqual(
      expect.arrayContaining(["기아", "제네시스", "현대"])
    );
    expect(getModelsForManufacturer(vehiclesData.vehicles, "현대", "all")).toEqual(
      expect.arrayContaining([
        "그랜저",
        "베뉴",
        "싼타페",
        "아반떼",
        "아이오닉5",
        "아이오닉6",
        "아이오닉9",
        "쏘나타",
        "캐스퍼",
        "코나",
        "투싼",
        "팰리세이드",
        "스타리아 라운지"
      ])
    );
    expect(getModelsForManufacturer(vehiclesData.vehicles, "제네시스", "all")).toEqual(
      expect.arrayContaining([
        "G70",
        "G80",
        "G90",
        "GV60",
        "GV70",
        "GV80"
      ])
    );
    expect(getPowertrainsForModel(vehiclesData.vehicles, "현대", "싼타페", "all")).toEqual(
      expect.arrayContaining(["1.6T-GDI 하이브리드", "2.5T-GDI 가솔린"])
    );
  });

  it("selects the right efficiency metric for each vehicle type", () => {
    const santaFe = vehiclesData.vehicles.find(
      (vehicle) => vehicle.model === "싼타페" && vehicle.powertrain === "2.5T-GDI 가솔린"
    );
    const ionic5 = vehiclesData.vehicles.find((vehicle) => vehicle.model === "아이오닉5");

    expect(getSelectedEfficiency(santaFe, "combined")).toBeGreaterThan(0);
    expect(getSelectedEfficiency(santaFe, "city")).toBeGreaterThan(0);
    expect(getSelectedEfficiency(ionic5, "combined")).toBeGreaterThan(0);
  });

  it("applies default price and displacement fields and enriches popular models", () => {
    const santaFe = vehiclesData.vehicles.find(
      (vehicle) => vehicle.manufacturer === "현대" && vehicle.model === "싼타페" && vehicle.powertrain === "2.5T-GDI 가솔린"
    );
    const ioniq5 = vehiclesData.vehicles.find(
      (vehicle) => vehicle.manufacturer === "현대" && vehicle.model === "아이오닉5" && vehicle.powertrain === "2WD"
    );
    const ray = vehiclesData.vehicles.find(
      (vehicle) => vehicle.manufacturer === "기아" && vehicle.model === "레이" && vehicle.powertrain.includes("1.0")
    );
    const gv80 = vehiclesData.vehicles.find(
      (vehicle) => vehicle.manufacturer === "제네시스" && vehicle.model === "GV80" && vehicle.powertrain.includes("2.5")
    );

    expect(vehiclesData.vehicles[0]).toHaveProperty("price");
    expect(santaFe).toMatchObject({ price: 3381, displacement: 2497, tankCapacity: 67 });
    expect(ioniq5).toMatchObject({ price: 4695, batteryCapacity: 72.6 });
    expect(ray).toMatchObject({ price: 1460, displacement: 998, tankCapacity: 35 });
    const morning = vehiclesData.vehicles.find(
      (vehicle) => vehicle.manufacturer === "기아" && vehicle.model === "모닝" && vehicle.powertrain.includes("1.0 가솔린")
    );
    expect(morning).toMatchObject({ price: 1225, displacement: 998, tankCapacity: 32 });
    expect(gv80).toMatchObject({ price: 6523, displacement: 2497 });
  });
});
