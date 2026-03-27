import { describe, expect, it } from "vitest";
import { formatChartValueLabel } from "@/utils/chart";

describe("chart label formatting", () => {
  it("compacts large values for chart labels", () => {
    expect(formatChartValueLabel(2758500)).toBe("276만원");
    expect(formatChartValueLabel(27585000)).toBe("2,759만원");
    expect(formatChartValueLabel(180)).toBe("180원");
  });
});
