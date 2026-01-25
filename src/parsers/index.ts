// TODO: 타입별 파싱 로직 구현
export function parseString(value: string): string {
  return value;
}

export function parseNumber(value: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
}

export function parseBoolean(value: string): boolean {
  const truthy = ["true", "1", "yes"];
  const falsy = ["false", "0", "no"];
  const lower = value.toLowerCase();

  if (truthy.includes(lower)) return true;
  if (falsy.includes(lower)) return false;
  throw new Error(`Invalid boolean: ${value}`);
}

export function parseArray(value: string, separator = ","): string[] {
  return value.split(separator).map((v) => v.trim());
}

export function parseJson(value: string): unknown {
  return JSON.parse(value);
}
