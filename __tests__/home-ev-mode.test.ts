import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

describe("home tab EV mode", () => {
  it("supports a separate vehicle mode for fuel and electric vehicles", () => {
    expect(source).toContain('type VehicleMode = "fuel" | "electric"');
    expect(source).toContain("vehicleMode: VehicleMode");
    expect(source).toContain('label: "내연기관", value: "fuel" as const');
    expect(source).toContain('label: "전기차", value: "electric" as const');
    expect(source).toContain("useFuelPrices()");
  });

  it("includes EV manual input and charging state", () => {
    expect(source).toContain('chargeMode: "fast"');
    expect(source).toContain('manualChargePrice: ""');
    expect(source).toContain('manualEfficiency: "5.0"');
    expect(source).toContain('manualBatteryCapacity: "72.6"');
    expect(source).toContain("CHARGE_PRESETS");
    expect(source).toContain("완충 비용");
    expect(source).toContain("월 충전비");
  });

  it("shows electric pricing in the today price card", () => {
    expect(source).toContain('label: "전기"');
    expect(source).toContain('icon: "flash-outline"');
  });
});
