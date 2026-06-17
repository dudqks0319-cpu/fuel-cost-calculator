import { FuelInputError, calculateFuelCost } from './fuelMath.js'

const STORAGE_KEY = 'fuel-cost-calculator:v1'
const currencyFormatter = new Intl.NumberFormat('ko-KR')
const literFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const form = document.querySelector('#calculatorForm')
const distanceInput = document.querySelector('#distanceInput')
const efficiencyInput = document.querySelector('#efficiencyInput')
const fuelPriceInput = document.querySelector('#fuelPriceInput')
const formError = document.querySelector('#formError')
const summaryText = document.querySelector('#summaryText')
const usedLiters = document.querySelector('#usedLiters')
const totalCost = document.querySelector('#totalCost')
const costPerKm = document.querySelector('#costPerKm')
const resetButton = document.querySelector('#resetButton')
const exampleButtons = document.querySelectorAll('[data-example-distance]')

loadSavedDefaults()

form.addEventListener('submit', (event) => {
  event.preventDefault()
  renderCalculation()
})

resetButton.addEventListener('click', () => {
  form.reset()
  localStorage.removeItem(STORAGE_KEY)
  setResultEmpty()
  clearError()
  distanceInput.focus()
})

for (const button of exampleButtons) {
  button.addEventListener('click', () => {
    distanceInput.value = button.dataset.exampleDistance
    efficiencyInput.value = button.dataset.exampleEfficiency
    fuelPriceInput.value = button.dataset.examplePrice
    renderCalculation()
  })
}

for (const input of [distanceInput, efficiencyInput, fuelPriceInput]) {
  input.addEventListener('input', () => {
    clearError()
  })
}

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}

function renderCalculation() {
  try {
    const result = calculateFuelCost({
      distanceKm: distanceInput.value,
      efficiencyKmPerL: efficiencyInput.value,
      fuelPricePerL: fuelPriceInput.value,
    })

    clearError()
    persistDefaults(result)
    usedLiters.textContent = `${literFormatter.format(result.usedLiters)} L`
    totalCost.textContent = `${currencyFormatter.format(result.totalCost)} 원`
    costPerKm.textContent = `${currencyFormatter.format(result.costPerKm)} 원/km`
    summaryText.textContent = `${currencyFormatter.format(result.distanceKm)}km 주행 기준 약 ${literFormatter.format(
      result.usedLiters,
    )}L를 사용했고, 기름값은 약 ${currencyFormatter.format(result.totalCost)}원입니다.`
  } catch (error) {
    if (error instanceof FuelInputError) {
      setError(error)
      setResultEmpty()
      return
    }

    setError(new FuelInputError('계산 중 문제가 발생했습니다. 입력값을 다시 확인해주세요.', 'unknown'))
    setResultEmpty()
  }
}

function setError(error) {
  formError.textContent = error.message

  for (const input of [distanceInput, efficiencyInput, fuelPriceInput]) {
    input.removeAttribute('aria-invalid')
  }

  const inputByField = {
    distanceKm: distanceInput,
    efficiencyKmPerL: efficiencyInput,
    fuelPricePerL: fuelPriceInput,
  }
  inputByField[error.field]?.setAttribute('aria-invalid', 'true')
  inputByField[error.field]?.focus()
}

function clearError() {
  formError.textContent = ''

  for (const input of [distanceInput, efficiencyInput, fuelPriceInput]) {
    input.removeAttribute('aria-invalid')
  }
}

function setResultEmpty() {
  usedLiters.textContent = '0.00 L'
  totalCost.textContent = '0 원'
  costPerKm.textContent = '0 원/km'
  summaryText.textContent = '값을 입력하면 이번 주행의 예상 비용이 표시됩니다.'
}

function persistDefaults(result) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      efficiencyKmPerL: String(result.efficiencyKmPerL),
      fuelPricePerL: String(result.fuelPricePerL),
    }),
  )
}

function loadSavedDefaults() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')

    if (saved.efficiencyKmPerL) {
      efficiencyInput.value = saved.efficiencyKmPerL
    }

    if (saved.fuelPricePerL) {
      fuelPriceInput.value = saved.fuelPricePerL
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}
