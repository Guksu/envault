import { ParseableType, ArrayType, EnumType } from "./types/index";
import { loadEnvSource } from "./sources/env";
import { loadJsonSource } from "./sources/json";
import { maskSensitiveValue } from "./utils/mask";
import { ConfigValidationError, formatErrors } from "./utils/errors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = ParseableType<any, any> | ArrayType<any> | EnumType<any, any>;

type InferSchema<Schema extends Record<string, AnyBuilder>> = {
  [K in keyof Schema]: Schema[K] extends { _out: infer TOut } ? TOut : never;
};

type SourcesConfig = {
  env?: Record<string, string | undefined>;
  json?: string;
  [key: string]: Record<string, unknown> | string | undefined;
};

interface DefineConfigOptions<Schema extends Record<string, AnyBuilder>> {
  sources?: SourcesConfig;
  schema: Schema;
  options?: {
    throwOnError?: boolean;
    logErrors?: boolean;
  };
}

type ConfigResult<Schema extends Record<string, AnyBuilder>> =
  InferSchema<Schema> & {
    print(): void;
    toObject(): InferSchema<Schema>;
    validate(): { valid: boolean; errors: string[] };
  };

function getRawValue(
  key: string,
  builder: AnyBuilder,
  loadedSources: Record<string, Record<string, unknown>>
): unknown {
  const { source } = builder.getData();
  const sourceName = source ?? "env";
  const sourceData = loadedSources[sourceName];
  if (!sourceData) return undefined;
  return sourceData[key];
}

export function defineConfig<Schema extends Record<string, AnyBuilder>>(
  options: DefineConfigOptions<Schema>
): ConfigResult<Schema> {
  const { schema, sources = {}, options: opts = {} } = options;
  const { throwOnError = true, logErrors = true } = opts;

  // 소스 로딩
  const loadedSources: Record<string, Record<string, unknown>> = {};

  if (sources.env !== undefined) {
    loadedSources["env"] = loadEnvSource(sources.env) as Record<string, unknown>;
  } else {
    // 기본값: process.env
    loadedSources["env"] = loadEnvSource(process.env) as Record<string, unknown>;
  }

  if (sources.json !== undefined) {
    loadedSources["json"] = loadJsonSource(sources.json);
  }

  // 추가 소스 (string이면 JSON 파일, object면 직접 사용)
  for (const [name, value] of Object.entries(sources)) {
    if (name === "env" || name === "json") continue;
    if (typeof value === "string") {
      loadedSources[name] = loadJsonSource(value);
    } else if (value && typeof value === "object") {
      loadedSources[name] = value as Record<string, unknown>;
    }
  }

  // 스키마 검증 및 값 파싱
  const errors: ConfigValidationError[] = [];
  const parsedValues: Record<string, unknown> = {};

  for (const [key, builder] of Object.entries(schema)) {
    try {
      const raw = getRawValue(key, builder, loadedSources);
      parsedValues[key] = builder.parse(raw);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(new ConfigValidationError(key, message));
    }
  }

  if (errors.length > 0) {
    if (logErrors) {
      console.error(formatErrors(errors));
    }
    if (throwOnError) {
      throw new AggregateError(errors, `Config validation failed:\n${formatErrors(errors)}`);
    }
  }

  const methods = {
    print(): void {
      for (const [key, builder] of Object.entries(schema)) {
        const { isSensitive } = builder.getData();
        const value = parsedValues[key];
        const displayValue =
          value === undefined
            ? "(not set)"
            : isSensitive
              ? maskSensitiveValue(String(value))
              : String(value);
        console.log(`${key}: ${displayValue}`);
      }
    },

    toObject(): InferSchema<Schema> {
      return { ...parsedValues } as InferSchema<Schema>;
    },

    validate(): { valid: boolean; errors: string[] } {
      const validationErrors: string[] = [];
      for (const [key, builder] of Object.entries(schema)) {
        try {
          const raw = getRawValue(key, builder, loadedSources);
          builder.parse(raw);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          validationErrors.push(`[${key}] ${message}`);
        }
      }
      return { valid: validationErrors.length === 0, errors: validationErrors };
    },
  };

  // 메서드를 non-enumerable로 추가 -> spread/toObject()에서 제외됨
  for (const [name, fn] of Object.entries(methods)) {
    Object.defineProperty(parsedValues, name, {
      value: fn,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  return parsedValues as ConfigResult<Schema>;
}

