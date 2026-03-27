export function formatChartValueLabel(value: number) {
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억`;
  }

  if (value >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}
