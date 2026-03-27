import { describe, expect, it } from "vitest";
import { formatCurrency, formatKm, formatLiter, formatNumber } from "@/utils/formatter";

describe("formatter", () => {
  it("formats currency in Korean won", () => {
    expect(formatCurrency(1839000)).toBe("₩1,839,000");
  });

  it("formats plain numbers", () => {
    expect(formatNumber(15000)).toBe("15,000");
  });

  it("formats distance and volume units", () => {
    expect(formatKm(600)).toBe("600 km");
    expect(formatLiter(67)).toBe("67 L");
    expect(formatLiter(67.5)).toBe("67.5 L");
  });
});
