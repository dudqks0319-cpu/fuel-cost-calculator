export class FuelInputError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'FuelInputError'
    this.field = field
  }
}

const FIELD_LABELS = {
  distanceKm: '주행거리',
  efficiencyKmPerL: '연비',
  fuelPricePerL: '리터당 기름값',
}

export function parsePositiveNumber(value, field) {
  const label = FIELD_LABELS[field] ?? '값'
  const text = String(value ?? '').trim().replaceAll(',', '')

  if (!text) {
    throw new FuelInputError(`${label}${label.endsWith('값') ? '을' : '를'} 입력해주세요.`, field)
  }

  const number = Number(text)

  if (!Number.isFinite(number)) {
    throw new FuelInputError(`${label}${label.endsWith('값') ? '은' : '는'} 숫자로 입력해주세요.`, field)
  }

  if (number <= 0) {
    throw new FuelInputError(`${label}${label.endsWith('값') ? '은' : '는'} 0보다 커야 합니다.`, field)
  }

  return number
}

export function calculateFuelCost(input) {
  const distanceKm = parsePositiveNumber(input.distanceKm, 'distanceKm')
  const efficiencyKmPerL = parsePositiveNumber(input.efficiencyKmPerL, 'efficiencyKmPerL')
  const fuelPricePerL = parsePositiveNumber(input.fuelPricePerL, 'fuelPricePerL')

  const usedLitersRaw = distanceKm / efficiencyKmPerL
  const totalCostRaw = usedLitersRaw * fuelPricePerL
  const costPerKmRaw = totalCostRaw / distanceKm

  return {
    distanceKm,
    efficiencyKmPerL,
    fuelPricePerL,
    usedLiters: roundTo(usedLitersRaw, 2),
    totalCost: Math.round(totalCostRaw),
    costPerKm: Math.round(costPerKmRaw),
  }
}

function roundTo(value, digits) {
  const multiplier = 10 ** digits
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}
