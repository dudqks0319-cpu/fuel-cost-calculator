import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("purchase calculator feature", () => {
  it("adds the purchase tab to the tab layout", () => {
    const source = read("app/(tabs)/_layout.tsx");

    expect(source).toContain('name="purchase"');
    expect(source).toContain('title: "구매계산기"');
    expect(source).toContain('renderTabIcon("pricetag-outline", "pricetag")');
  });

  it("creates the purchase screen with the required core sections", () => {
    const source = read("app/(tabs)/purchase.tsx");

    expect(source).toContain('title="구매 계산기"');
    expect(source).toContain('subtitle="구매 시 세금과 구간 연료비를 알아보세요"');
    expect(source).toContain('title="차량 정보"');
    expect(source).toContain('title="취득세"');
    expect(source).toContain('title="개별소비세"');
    expect(source).toContain('title="연간 자동차세"');
    expect(source).toContain('title="구간 연료비 계산"');
    expect(source).toContain('title="연간 유지비 요약"');
    expect(source).toContain("useFuelPrices()");
  });

  it("stores purchase form state", () => {
    const storage = read("utils/storage.ts");
    expect(storage).toContain('purchaseForm: "@fuel-cost-mobile/purchase-form"');
  });
});
