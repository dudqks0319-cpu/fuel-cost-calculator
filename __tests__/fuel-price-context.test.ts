import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("fuel price context wiring", () => {
  it("wraps the app with FuelPriceProvider", () => {
    const source = read("app/_layout.tsx");
    expect(source).toContain("FuelPriceProvider");
  });

  it("uses shared fuel prices in all three tabs", () => {
    const home = read("app/(tabs)/index.tsx");
    const compare = read("app/(tabs)/compare.tsx");
    const evCompare = read("app/(tabs)/ev-compare.tsx");

    expect(home).toContain("useFuelPrices()");
    expect(compare).toContain("useFuelPrices()");
    expect(evCompare).toContain("useFuelPrices()");

    expect(compare).not.toContain("DEFAULT_FUEL_PRICES[");
    expect(evCompare).not.toContain("DEFAULT_FUEL_PRICES[");
  });
});
