import fs from "node:fs";
import path from "node:path";
import type { FuelType, VehicleRecord } from "../types/vehicle";

type CsvRow = Record<string, string>;

const inputPath = path.resolve(process.cwd(), "scripts/raw-vehicles.csv");
const outputPath = path.resolve(process.cwd(), "data/vehicles.json");
const currentYear = 2026;
const minYear = currentYear - 5;

function stripBom(content: string) {
  return content.replace(/^\uFEFF/, "");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string) {
  const lines = stripBom(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function parseNumber(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferYear(row: CsvRow) {
  const text = row["모델명"] ?? "";
  const fourDigit = text.match(/\b(20\d{2})\b/);
  if (fourDigit) {
    return Number.parseInt(fourDigit[1], 10);
  }

  const my = text.match(/\b(\d{2})MY\b/i);
  if (my) {
    return 2000 + Number.parseInt(my[1], 10);
  }

  return 0;
}

function inferFuelType(row: CsvRow): FuelType {
  const model = `${row["모델명"] ?? ""} ${row["유형"] ?? ""}`;
  const chargeRange = parseNumber(row["1회충전주행거리"] ?? "");

  if (
    chargeRange > 0 ||
    /(전기|Electric|일렉트릭|EV|e-tron|Electrified|아이오닉 ?[569]|GV60)/i.test(model)
  ) {
    return "electric";
  }

  if (/(LPG|LPI)/i.test(model)) {
    return "lpg";
  }

  if (/(디젤|Diesel|TDI|BlueHDi|dCi|CDI|CRDi)/i.test(model)) {
    return "diesel";
  }

  if (/(하이브리드|HEV|PHEV|Hybrid|e:HEV)/i.test(model)) {
    return "gasoline";
  }

  return "gasoline";
}

function buildPowertrain(row: CsvRow, fuelType: FuelType) {
  const modelName = row["모델명"] ?? "";
  const engineMatch = modelName.match(/(\d\.\d)\s?(T-GDI|TDI|MPI|GDI|LPI|dCi|CRDi|T?)/i);
  const engineLabel = engineMatch
    ? `${engineMatch[1]}${engineMatch[2] ? engineMatch[2].replace(/^T$/i, "T") : ""}`.replace(/\s+/g, "")
    : "";

  if (fuelType === "electric") {
    if (modelName.includes("롱레인지")) {
      return "롱레인지";
    }

    if (modelName.includes("스탠다드")) {
      return "스탠다드";
    }

    if (/(AWD|4WD)/i.test(modelName)) {
      return "AWD";
    }

    if (/(2WD|RWD|후륜)/i.test(modelName)) {
      return "2WD";
    }

    return row["유형"] || "전기";
  }

  const fuelLabel = fuelType === "gasoline" ? "가솔린" : fuelType === "diesel" ? "디젤" : "LPG";
  if (/(하이브리드|HEV|PHEV|Hybrid|e:HEV)/i.test(modelName)) {
    return `${engineLabel || "하이브리드"} 하이브리드`.trim();
  }

  return `${engineLabel || fuelLabel} ${fuelLabel}`.trim();
}

const domesticBaseModels = [
  "캐스퍼 일렉트릭",
  "캐스퍼",
  "아반떼",
  "쏘나타",
  "그랜저",
  "베뉴",
  "코나",
  "투싼",
  "싼타페",
  "팰리세이드",
  "스타리아 라운지",
  "스타리아",
  "아이오닉 5",
  "아이오닉5",
  "아이오닉 6",
  "아이오닉6",
  "아이오닉 9",
  "아이오닉9",
  "레이",
  "모닝",
  "K5",
  "쏘렌토",
  "EV6",
  "EV9",
  "EV3",
  "니로",
  "GV80 쿠페",
  "Electrified GV70",
  "Electrified G80",
  "GV80",
  "GV70",
  "GV60",
  "G90 Long Wheel Base",
  "G90",
  "G80",
  "G70 슈팅 브레이크",
  "G70"
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function simplifyManufacturer(manufacturer: string, modelName: string) {
  if (manufacturer === "현대" && /(^|\s)(G70|G80|G90|GV60|GV70|GV80|Electrified)(\s|$)/.test(modelName)) {
    return "제네시스";
  }

  if (manufacturer === "GM" || manufacturer === "한국지엠") {
    return "쉐보레";
  }

  if (manufacturer === "르노코리아자동차(주)") {
    return "르노코리아";
  }

  if (manufacturer === "케이지모빌리티") {
    return "KGM";
  }

  return manufacturer;
}

function simplifyModelName(name: string) {
  const cleaned = name
    .replace(/\t/g, " ")
    .replace(/_/g, " ")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\b(2WD|4WD|AWD|FWD|RWD)\b/gi, " ")
    .replace(/\b\d{2}MY\b/gi, " ")
    .replace(/빌트인캠\s?(없음|미장착|장착)/g, " ")
    .replace(/\d{1,2}인치/g, " ")
    .replace(/타이어/g, " ")
    .replace(/\b(밴형|밴|쿠페|스포츠패키지|블랙라인|롱레인지|스탠다드)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/G70\s*슈팅\s*브레이크|G70\s*슈팅브레이크/i.test(cleaned)) {
    return "G70 슈팅 브레이크";
  }

  if (/스타리아\s*라운지/.test(cleaned)) {
    return "스타리아 라운지";
  }

  if (/캐스퍼\s*일렉트릭/.test(cleaned)) {
    return "캐스퍼 일렉트릭";
  }

  if (/아이오닉\s*5/.test(cleaned)) {
    return "아이오닉5";
  }

  if (/아이오닉\s*6/.test(cleaned)) {
    return "아이오닉6";
  }

  if (/아이오닉\s*9/.test(cleaned)) {
    return "아이오닉9";
  }

  const matchedBaseModel = [...domesticBaseModels]
    .sort((left, right) => right.length - left.length)
    .find((baseModel) => new RegExp(`(^|\\s)${escapeRegExp(baseModel)}(?=\\s|$)`).test(cleaned));
  if (matchedBaseModel) {
    return matchedBaseModel.replace(/\s+/g, " ").trim();
  }

  const cutPoints = [
    "가솔린",
    "디젤",
    "하이브리드",
    "전기",
    "Electric",
    "T-GDI",
    "MPI",
    "GDI",
    "LPI",
    "HEV",
    "PHEV"
  ];

  for (const point of cutPoints) {
    const index = cleaned.indexOf(point);
    if (index > 0) {
      return cleaned.slice(0, index).trim();
    }
  }

  return cleaned;
}

function buildVehicleRecord(row: CsvRow): VehicleRecord | null {
  const fuelType = inferFuelType(row);

  const city = parseNumber(row["도심주행연비"] ?? row["도심_연비"] ?? "");
  const highway = parseNumber(row["고속도로연비"] ?? row["고속도로_연비"] ?? "");
  const combined = parseNumber(row["복합연비"] ?? row["복합_연비"] ?? "") || Math.round((((city + highway) / 2) || 0) * 10) / 10;
  const year = inferYear(row);

  if (year && year < minYear) {
    return null;
  }

  if (!combined && !city && !highway) {
    return null;
  }

  const manufacturer = simplifyManufacturer(row["업체명"] || row["제조(수입사)"] || "기타", row["모델명"] || "");
  const model = simplifyModelName(row["모델명"] || "");
  const powertrain = buildPowertrain(row, fuelType);

  if (!model) {
    return null;
  }

  if (fuelType === "electric") {
    return {
      manufacturer,
      model,
      powertrain,
      fuelType: "electric",
      batteryCapacity: 0,
      efficiency: combined || city || highway || 0
    };
  }

  return {
    manufacturer,
    model,
    powertrain,
    fuelType,
    tankCapacity: 0,
    mpg: {
      combined,
      city,
      highway
    }
  };
}

function dedupeVehicles(vehicles: VehicleRecord[]) {
  const seen = new Set<string>();

  return vehicles.filter((vehicle) => {
    const key = `${vehicle.manufacturer}::${vehicle.model}::${vehicle.powertrain}::${vehicle.fuelType}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function compareVehicles(left: VehicleRecord, right: VehicleRecord) {
  return (
    left.manufacturer.localeCompare(right.manufacturer, "ko-KR") ||
    left.model.localeCompare(right.model, "ko-KR") ||
    left.powertrain.localeCompare(right.powertrain, "ko-KR")
  );
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`입력 CSV 파일이 없습니다: ${inputPath}`);
  }

  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  const vehicles = dedupeVehicles(rows.map(buildVehicleRecord).filter((vehicle): vehicle is VehicleRecord => Boolean(vehicle))).sort(compareVehicles);

  fs.writeFileSync(outputPath, `${JSON.stringify({ vehicles }, null, 2)}\n`, "utf8");
  console.log(`총 ${vehicles.length}대 차량 변환 완료`);
}

main();
