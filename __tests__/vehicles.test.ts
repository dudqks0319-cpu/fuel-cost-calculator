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
    expect(getManufacturers(vehiclesData.vehicles, "all")).toEqual(["기아", "제네시스", "현대"]);
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
        "캐스퍼 일렉트릭",
        "코나",
        "투싼",
        "팰리세이드",
        "스타리아 라운지"
      ])
    );
    expect(getModelsForManufacturer(vehiclesData.vehicles, "제네시스", "all")).toEqual(
      expect.arrayContaining([
        "Electrified G80",
        "Electrified GV70",
        "G70",
        "G70 슈팅 브레이크",
        "G80",
        "G90",
        "G90 Long Wheel Base",
        "GV60",
        "GV70",
        "GV80",
        "GV80 쿠페"
      ])
    );
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
