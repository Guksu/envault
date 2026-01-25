// TODO: 에러 포매팅 구현
export class ConfigValidationError extends Error {
  constructor(
    public readonly key: string,
    message: string
  ) {
    super(`[${key}] ${message}`);
    this.name = "ConfigValidationError";
  }
}

export function formatErrors(errors: ConfigValidationError[]): string {
  return errors.map((e) => e.message).join("\n");
}
