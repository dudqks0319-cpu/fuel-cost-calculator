import assert from 'node:assert/strict'
import test from 'node:test'

import { FuelInputError, calculateFuelCost } from '../src/fuelMath.js'

test('calculates the attached 6.4km example', () => {
  assert.deepEqual(calculateFuelCost({ distanceKm: 6.4, efficiencyKmPerL: 6.4, fuelPricePerL: 1700 }), {
    distanceKm: 6.4,
    efficiencyKmPerL: 6.4,
    fuelPricePerL: 1700,
    usedLiters: 1,
    totalCost: 1700,
    costPerKm: 266,
  })
})

test('calculates a commute example', () => {
  assert.deepEqual(calculateFuelCost({ distanceKm: 20, efficiencyKmPerL: 10, fuelPricePerL: 1700 }), {
    distanceKm: 20,
    efficiencyKmPerL: 10,
    fuelPricePerL: 1700,
    usedLiters: 2,
    totalCost: 3400,
    costPerKm: 170,
  })
})

test('calculates a long-distance decimal efficiency example', () => {
  assert.deepEqual(calculateFuelCost({ distanceKm: 100, efficiencyKmPerL: 12.5, fuelPricePerL: 1650 }), {
    distanceKm: 100,
    efficiencyKmPerL: 12.5,
    fuelPricePerL: 1650,
    usedLiters: 8,
    totalCost: 13200,
    costPerKm: 132,
  })
})

test('rejects blank distance', () => {
  assert.throws(
    () => calculateFuelCost({ distanceKm: '', efficiencyKmPerL: 10, fuelPricePerL: 1700 }),
    (error) =>
      error instanceof FuelInputError &&
      error.field === 'distanceKm' &&
      error.message === '주행거리를 입력해주세요.',
  )
})

test('rejects zero efficiency', () => {
  assert.throws(
    () => calculateFuelCost({ distanceKm: 10, efficiencyKmPerL: 0, fuelPricePerL: 1700 }),
    (error) =>
      error instanceof FuelInputError &&
      error.field === 'efficiencyKmPerL' &&
      error.message === '연비는 0보다 커야 합니다.',
  )
})

test('rejects negative fuel price', () => {
  assert.throws(
    () => calculateFuelCost({ distanceKm: 10, efficiencyKmPerL: 10, fuelPricePerL: -1 }),
    (error) =>
      error instanceof FuelInputError &&
      error.field === 'fuelPricePerL' &&
      error.message === '리터당 기름값은 0보다 커야 합니다.',
  )
})
