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

function normalizeFuel(rawFuel: string): FuelType | null {
  if (rawFuel.includes("전기")) {
    return "electric";
  }

  if (rawFuel.includes("LPG")) {
    return "lpg";
  }

  if (rawFuel.includes("경유")) {
    return "diesel";
  }

  if (rawFuel.includes("가솔린")) {
    return "gasoline";
  }

  return null;
}

function isHybrid(rawFuel: string) {
  return rawFuel.includes("하이브리드") || rawFuel.includes("+전기");
}

function buildPowertrain(row: CsvRow, fuelType: FuelType) {
  const displacement = parseNumber(row["배기량"] ?? "");
  const engineLabel = displacement > 0 ? `${(displacement / 1000).toFixed(1).replace(".0", "")}${displacement >= 1400 ? "T" : ""}` : "";

  if (fuelType === "electric") {
    if ((row["모델명"] ?? "").includes("롱레인지")) {
      return "롱레인지";
    }

    if ((row["모델명"] ?? "").includes("스탠다드")) {
      return "스탠다드";
    }

    return row["유형"] || "전기";
  }

  if (isHybrid(row["연료"] ?? "")) {
    return `${engineLabel || "하이브리드"} 하이브리드`.trim();
  }

  const fuelLabel = fuelType === "gasoline" ? "가솔린" : fuelType === "diesel" ? "디젤" : "LPG";
  return `${engineLabel || fuelLabel} ${fuelLabel}`.trim();
}

function simplifyModelName(name: string) {
  return name
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\b(2WD|4WD|AWD|FWD)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVehicleRecord(row: CsvRow): VehicleRecord | null {
  const fuelType = normalizeFuel(row["연료"] ?? "");
  if (!fuelType) {
    return null;
  }

  const city = parseNumber(row["도심주행연비"] ?? row["도심_연비"] ?? "");
  const highway = parseNumber(row["고속도로연비"] ?? row["고속도로_연비"] ?? "");
  const combined = parseNumber(row["복합연비"] ?? row["복합_연비"] ?? "") || Math.round((((city + highway) / 2) || 0) * 10) / 10;
  const year = parseNumber(row["출시연도"] ?? "");

  if (year && year < minYear) {
    return null;
  }

  if (!combined && !city && !highway) {
    return null;
  }

  const manufacturer = row["업체명"] || row["제조(수입사)"] || "기타";
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
    const key = `${vehicle.manufacturer}::${vehicle.model}::${vehicle.powertrain}`;
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
