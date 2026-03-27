function formatDecimal(value: number) {
  return value % 1 === 0 ? value.toLocaleString("ko-KR") : value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export function formatCurrency(num: number) {
  return `₩${Math.round(num).toLocaleString("ko-KR")}`;
}

export function formatNumber(num: number) {
  return Math.round(num).toLocaleString("ko-KR");
}

export function formatKm(num: number) {
  return `${formatDecimal(num)} km`;
}

export function formatLiter(num: number) {
  return `${formatDecimal(num)} L`;
}
