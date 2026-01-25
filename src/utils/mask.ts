// TODO: 민감정보 마스킹 구현
export function maskSensitiveValue(value: string): string {
  if (value.length <= 8) {
    return "****";
  }
  const visibleStart = value.slice(0, 4);
  const visibleEnd = value.slice(-4);
  return `${visibleStart}****${visibleEnd}`;
}
