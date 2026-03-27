import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const compareScreenPath = path.resolve(process.cwd(), "app/(tabs)/compare.tsx");
const compareScreenSource = fs.readFileSync(compareScreenPath, "utf8");

describe("compare.tsx copy", () => {
  it("includes the required Korean labels without corruption", () => {
    const requiredStrings = [
      "차량 비교",
      "두 차의 유류비를 비교해보세요",
      "차량 A",
      "차량 B",
      "주행 조건 설정",
      "연간 주행거리 직접입력",
      "비교 결과",
      "적용 연비",
      "연간 연료량",
      "연간 유류비",
      "월 평균",
      "차량 A와 B를 선택해주세요.",
      '차량 B가 연간 ${formatCurrency(yearlySaving)} 절약! 3년 ${formatCurrency(yearlySaving * 3)}, 5년 ${formatCurrency(yearlySaving * 5)} 차이',
      '차량 B가 연간 ${formatCurrency(Math.abs(yearlySaving))} 더 비쌈. 3년이면 ${formatCurrency(Math.abs(yearlySaving) * 3)} 차이.',
      "누적 비용 비교 그래프",
      "상세 비교",
      "펼치기",
      "접기",
      "10년간 차량B로 절약하는 금액:",
      "추가 비용",
      "펼치기를 누르면 1, 3, 5, 10년 누적 비용 차이를 볼 수 있습니다.",
      "그래프를 보려면 차량을 선택해주세요.",
      "[연료비 비교 결과]",
      "연간 ${formatNumber(form.yearlyKm)}km 주행 시",
      "연간 유류비 차이:",
      "- 연료비 계산기 앱",
      'labels={{ a: "차량 A", b: "차량 B" }}'
    ];

    requiredStrings.forEach((text) => {
      expect(compareScreenSource).toContain(text);
    });
  });
});
