import { TypeBuilder } from "./base";

class ParseableType<T> extends TypeBuilder<T> {
  constructor(private converter: (raw: string) => T) {
    super();
  }

  parse(raw: string | undefined): T {
    const { defaultValue, isRequired, validators, transformers } =
      this.getData();

    if (raw === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      if (isRequired) throw new Error("Value is required");
      return undefined as unknown as T;
    }

    let result = this.converter(raw);

    for (const fn of validators) {
      if (!fn(result)) throw new Error("Validation failed");
    }

    for (const fn of transformers) {
      result = fn(result);
    }

    return result;
  }
}

// Converters
const stringConverter = (v: string): string => v;

const numberConverter = (v: string): number => {
  const n = Number(v);
  if (isNaN(n)) throw new Error("Invalid number");
  return n;
};

const booleanConverter = (v: string): boolean => {
  const lower = v.toLowerCase();
  if (["true", "1", "yes"].includes(lower)) return true;
  if (["false", "0", "no"].includes(lower)) return false;
  throw new Error("Invalid boolean");
};

export const t = {
  string: () => new ParseableType<string>(stringConverter),
  number: () => new ParseableType<number>(numberConverter),
  boolean: () => new ParseableType<boolean>(booleanConverter),
  array: () => {
    throw new Error("Not implemented yet");
  },
  json: () => {
    throw new Error("Not implemented yet");
  },
  url: () => {
    throw new Error("Not implemented yet");
  },
  email: () => {
    throw new Error("Not implemented yet");
  },
  enum: (_values: string[]) => {
    throw new Error("Not implemented yet");
  },
};
