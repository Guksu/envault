import { TypeBuilder } from "./base";
import { isValidUrl, isValidEmail } from "./validators";

/**
 * 기본 파서블 타입. TOut은 phantom 마커로 defineConfig 타입 추론에 사용.
 * - TOut = T | undefined : required/default 없음
 * - TOut = T             : required() 또는 default() 호출됨
 */
export class ParseableType<T, TOut = T | undefined> extends TypeBuilder<T> {
  declare readonly _out: TOut;

  constructor(protected converter: (raw: unknown) => T) {
    super();
  }

  required(): ParseableType<T, T> {
    this._required = true;
    return this as unknown as ParseableType<T, T>;
  }

  default(value: T): ParseableType<T, T> {
    this._default = value;
    return this as unknown as ParseableType<T, T>;
  }

  parse(raw: unknown): TOut {
    const { defaultValue, isRequired, validators, transformers } = this.getData();

    if (raw === undefined || raw === null) {
      if (defaultValue !== undefined) return defaultValue as unknown as TOut;
      if (isRequired) throw new Error("Value is required");
      return undefined as TOut;
    }

    let result = this.converter(raw);

    for (const fn of validators) {
      if (!fn(result)) throw new Error("Validation failed");
    }

    for (const fn of transformers) {
      result = fn(result);
    }

    return result as unknown as TOut;
  }
}

/** 구분자를 지정할 수 있는 배열 타입 */
export class ArrayType<TOut = string[] | undefined> extends TypeBuilder<string[]> {
  declare readonly _out: TOut;
  private _separator = ",";

  separator(sep: string): this {
    this._separator = sep;
    return this;
  }

  required(): ArrayType<string[]> {
    this._required = true;
    return this as unknown as ArrayType<string[]>;
  }

  default(value: string[]): ArrayType<string[]> {
    this._default = value;
    return this as unknown as ArrayType<string[]>;
  }

  parse(raw: unknown): TOut {
    const { defaultValue, isRequired } = this.getData();

    if (raw === undefined || raw === null) {
      if (defaultValue !== undefined) return defaultValue as TOut;
      if (isRequired) throw new Error("Value is required");
      return undefined as TOut;
    }

    if (Array.isArray(raw)) return raw.map(String) as TOut;

    return String(raw)
      .split(this._separator)
      .map((v) => v.trim()) as TOut;
  }
}

/** 허용 값 목록을 검증하는 enum 타입 */
export class EnumType<T extends string, TOut = T | undefined> extends TypeBuilder<T> {
  declare readonly _out: TOut;

  constructor(private values: readonly T[]) {
    super();
  }

  required(): EnumType<T, T> {
    this._required = true;
    return this as unknown as EnumType<T, T>;
  }

  default(value: T): EnumType<T, T> {
    this._default = value;
    return this as unknown as EnumType<T, T>;
  }

  parse(raw: unknown): TOut {
    const { defaultValue, isRequired } = this.getData();

    if (raw === undefined || raw === null) {
      if (defaultValue !== undefined) return defaultValue as unknown as TOut;
      if (isRequired) throw new Error("Value is required");
      return undefined as TOut;
    }

    const str = String(raw);
    if (!this.values.includes(str as T)) {
      throw new Error(
        `Invalid enum value "${str}". Must be one of: ${this.values.join(", ")}`
      );
    }

    return str as unknown as TOut;
  }
}

// Converters
const stringConverter = (v: unknown): string => String(v);

const numberConverter = (v: unknown): number => {
  if (typeof v === "number") return v;
  const n = Number(String(v));
  if (isNaN(n)) throw new Error("Invalid number");
  return n;
};

const booleanConverter = (v: unknown): boolean => {
  if (typeof v === "boolean") return v;
  const lower = String(v).toLowerCase();
  if (["true", "1", "yes"].includes(lower)) return true;
  if (["false", "0", "no"].includes(lower)) return false;
  throw new Error("Invalid boolean");
};

const jsonConverter = (v: unknown): unknown => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      throw new Error("Invalid JSON");
    }
  }
  return v;
};

const urlConverter = (v: unknown): string => {
  const str = String(v);
  if (!isValidUrl(str)) throw new Error("Invalid URL");
  return str;
};

const emailConverter = (v: unknown): string => {
  const str = String(v);
  if (!isValidEmail(str)) throw new Error("Invalid email");
  return str;
};

export const t = {
  string: () => new ParseableType<string>(stringConverter),
  number: () => new ParseableType<number>(numberConverter),
  boolean: () => new ParseableType<boolean>(booleanConverter),
  array: () => new ArrayType(),
  json: () => new ParseableType<unknown>(jsonConverter),
  url: () => new ParseableType<string>(urlConverter),
  email: () => new ParseableType<string>(emailConverter),
  enum: <T extends string>(values: readonly T[]) => new EnumType<T>(values),
};
