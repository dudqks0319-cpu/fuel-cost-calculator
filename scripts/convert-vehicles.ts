import fs from "node:fs";
import path from "node:path";
import type { FuelType, VehicleRecord } from "../types/vehicle";

type CsvRow = Record<string, string>;
type VehicleMetadataPatch = Partial<VehicleRecord & { displacement: number; tankCapacity: number; batteryCapacity: number }>;

const inputPath = path.resolve(process.cwd(), "scripts/raw-vehicles.csv");
const outputPath = path.resolve(process.cwd(), "data/vehicles.json");
const currentYear = 2026;
const minYear = currentYear - 5;

const modelDefaults: Array<{
  manufacturer: string;
  model: string;
  price: number;
  displacement?: number;
}> = [
  { manufacturer: "현대", model: "캐스퍼", price: 1460, displacement: 998 },
  { manufacturer: "현대", model: "아반떼", price: 2015, displacement: 1598 },
  { manufacturer: "현대", model: "쏘나타", price: 2794, displacement: 1999 },
  { manufacturer: "현대", model: "그랜저", price: 3928, displacement: 2497 },
  { manufacturer: "현대", model: "투싼", price: 3098, displacement: 1997 },
  { manufacturer: "현대", model: "싼타페", price: 3381, displacement: 2497 },
  { manufacturer: "현대", model: "팰리세이드", price: 4130, displacement: 3470 },
  { manufacturer: "현대", model: "스타리아 라운지", price: 3616, displacement: 2199 },
  { manufacturer: "현대", model: "아이오닉5", price: 4695 },
  { manufacturer: "현대", model: "아이오닉6", price: 4695 },
  { manufacturer: "현대", model: "아이오닉9", price: 6600 },
  { manufacturer: "기아", model: "모닝", price: 1225, displacement: 998 },
  { manufacturer: "기아", model: "레이", price: 1460, displacement: 998 },
  { manufacturer: "기아", model: "K5", price: 2535, displacement: 1999 },
  { manufacturer: "기아", model: "스포티지", price: 2734, displacement: 1598 },
  { manufacturer: "기아", model: "쏘렌토", price: 3386, displacement: 2497 },
  { manufacturer: "기아", model: "카니발", price: 3523, displacement: 2199 },
  { manufacturer: "기아", model: "EV3", price: 4292 },
  { manufacturer: "기아", model: "EV6", price: 4870 },
  { manufacturer: "기아", model: "EV9", price: 7390 },
  { manufacturer: "제네시스", model: "GV80", price: 6523, displacement: 2497 },
  { manufacturer: "제네시스", model: "G80", price: 6028, displacement: 2497 }
];

const exactOverrides: Array<{
  manufacturer: string;
  model: string;
  matcher: (powertrain: string) => boolean;
  patch: VehicleMetadataPatch;
}> = [
  { manufacturer: "현대", model: "캐스퍼", matcher: (p) => p.includes("1.0 가솔린"), patch: { tankCapacity: 32 } },
  { manufacturer: "현대", model: "아반떼", matcher: (p) => p.includes("1.6 가솔린"), patch: { tankCapacity: 50 } },
  { manufacturer: "현대", model: "아반떼", matcher: (p) => p.includes("하이브리드"), patch: { price: 2560, displacement: 1598, tankCapacity: 42 } },
  { manufacturer: "현대", model: "쏘나타", matcher: (p) => p.includes("2.0 가솔린"), patch: { tankCapacity: 60 } },
  { manufacturer: "현대", model: "쏘나타", matcher: (p) => p.includes("하이브리드"), patch: { price: 3367, displacement: 1598, tankCapacity: 50 } },
  { manufacturer: "현대", model: "그랜저", matcher: (p) => p.includes("2.5"), patch: { tankCapacity: 70 } },
  { manufacturer: "현대", model: "그랜저", matcher: (p) => p.includes("하이브리드"), patch: { price: 4461, displacement: 1598, tankCapacity: 55 } },
  { manufacturer: "현대", model: "투싼", matcher: (p) => p.includes("2.0 디젤"), patch: { tankCapacity: 54 } },
  { manufacturer: "현대", model: "투싼", matcher: (p) => p.includes("하이브리드"), patch: { price: 3368, displacement: 1598, tankCapacity: 52 } },
  { manufacturer: "현대", model: "싼타페", matcher: (p) => p.includes("2.5"), patch: { tankCapacity: 67 } },
  { manufacturer: "현대", model: "싼타페", matcher: (p) => p.includes("하이브리드"), patch: { price: 3781, displacement: 1598, tankCapacity: 67 } },
  { manufacturer: "현대", model: "팰리세이드", matcher: (p) => p.includes("3.8") || p.includes("3.5"), patch: { tankCapacity: 71 } },
  { manufacturer: "현대", model: "스타리아 라운지", matcher: (p) => p.includes("2.2"), patch: { tankCapacity: 75 } },
  { manufacturer: "현대", model: "아이오닉5", matcher: (p) => p.includes("2WD") || p.includes("롱레인지"), patch: { batteryCapacity: 72.6 } },
  { manufacturer: "현대", model: "아이오닉6", matcher: (p) => p.includes("2WD") || p.includes("롱레인지"), patch: { batteryCapacity: 72.6 } },
  { manufacturer: "현대", model: "아이오닉9", matcher: (p) => p.includes("2WD") || p.includes("롱레인지"), patch: { batteryCapacity: 110 } },
  { manufacturer: "기아", model: "모닝", matcher: (p) => p.includes("1.0 가솔린"), patch: { tankCapacity: 32 } },
  { manufacturer: "기아", model: "레이", matcher: (p) => p.includes("1.0"), patch: { tankCapacity: 35 } },
  { manufacturer: "기아", model: "K5", matcher: (p) => p.includes("하이브리드"), patch: { price: 3060, displacement: 1598, tankCapacity: 50 } },
  { manufacturer: "기아", model: "스포티지", matcher: (p) => p.includes("하이브리드"), patch: { price: 3284, displacement: 1598, tankCapacity: 52 } },
  { manufacturer: "기아", model: "쏘렌토", matcher: (p) => p.includes("하이브리드"), patch: { price: 3786, displacement: 1598, tankCapacity: 67 } },
  { manufacturer: "기아", model: "카니발", matcher: (p) => p.includes("2.2"), patch: { tankCapacity: 72 } },
  { manufacturer: "기아", model: "EV3", matcher: (p) => p.includes("2WD") || p.includes("일반형"), patch: { batteryCapacity: 58.3 } },
  { manufacturer: "기아", model: "EV6", matcher: (p) => p.includes("2WD") || p.includes("롱레인지"), patch: { batteryCapacity: 77.4 } },
  { manufacturer: "기아", model: "EV9", matcher: (p) => p.includes("2WD") || p.includes("롱레인지"), patch: { batteryCapacity: 99.8 } },
  { manufacturer: "제네시스", model: "GV80", matcher: (p) => p.includes("2.5"), patch: { tankCapacity: 72 } },
  { manufacturer: "제네시스", model: "G80", matcher: (p) => p.includes("2.5"), patch: { tankCapacity: 70 } }
];

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
  "스포티지",
  "쏘렌토",
  "카니발",
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
  const displacement = parseNumber(row["배기량"] ?? row["배기량(cc)"] ?? "");

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
      price: 0,
      batteryCapacity: 0,
      efficiency: combined || city || highway || 0
    };
  }

  return {
    manufacturer,
    model,
    powertrain,
    fuelType,
    price: 0,
    displacement,
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

function applyMetadataOverrides(vehicles: VehicleRecord[]) {
  for (const vehicle of vehicles) {
    const base = modelDefaults.find((candidate) => candidate.manufacturer === vehicle.manufacturer && candidate.model === vehicle.model);
    if (base) {
      vehicle.price = base.price;
      if ("displacement" in vehicle && base.displacement !== undefined) {
        vehicle.displacement = base.displacement;
      }
    }

    const overrides = exactOverrides.filter(
      (candidate) =>
        candidate.manufacturer === vehicle.manufacturer &&
        candidate.model === vehicle.model &&
        candidate.matcher(String(vehicle.powertrain))
    );

    for (const override of overrides) {
      Object.assign(vehicle, override.patch);
    }
  }

  return vehicles;
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`입력 CSV 파일이 없습니다: ${inputPath}`);
  }

  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  const vehicles = applyMetadataOverrides(
    dedupeVehicles(rows.map(buildVehicleRecord).filter((vehicle): vehicle is VehicleRecord => Boolean(vehicle))).sort(compareVehicles)
  );

  fs.writeFileSync(outputPath, `${JSON.stringify({ vehicles }, null, 2)}\n`, "utf8");
  console.log(`총 ${vehicles.length}대 차량 변환 완료`);
}

main();
