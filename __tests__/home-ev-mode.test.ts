import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

describe("home tab fuel calculator", () => {
  it("renders the simple distance, efficiency, and fuel price flow", () => {
    expect(source).toContain('label="운행 거리"');
    expect(source).toContain('label="평균 연비"');
    expect(source).toContain('label="유류 가격"');
    expect(source).toContain("전국 주유소 평균 가격 조회하기");
    expect(source).toContain("계산하기");
    expect(source).toContain("useFuelPrices()");
  });

  it("supports Opinet-style product codes through a proxy payload", () => {
    expect(source).toContain('const FUEL_PRICE_API_URL = process.env.EXPO_PUBLIC_FUEL_PRICE_API_URL');
    expect(source).toContain('readPrice(prices, ["premium", "B034"])');
    expect(source).toContain('readPrice(prices, ["gasoline", "B027"])');
    expect(source).toContain('readPrice(prices, ["diesel", "D047"])');
    expect(source).toContain('readPrice(prices, ["lpg", "K015", "K105"])');
    expect(source).toContain("setFuelPrices((current) => ({");
  });

  it("calculates trip fuel cost from manual values", () => {
    expect(source).toContain("calcFuelNeeded(distanceKm, fuelEfficiency)");
    expect(source).toContain("calcCostPerKm(fuelPrice, fuelEfficiency)");
    expect(source).toContain("calcTripFuelCost(distanceKm, fuelPrice, fuelEfficiency)");
    expect(source).toContain("예상 유류비");
    expect(source).toContain("직접입력");
  });
});
