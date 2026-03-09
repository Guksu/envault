import { readFileSync } from "fs";
import { resolve } from "path";

export function loadJsonSource(filePath: string): Record<string, unknown> {
  const absolutePath = resolve(filePath);
  const raw = readFileSync(absolutePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`JSON source must be an object: ${filePath}`);
  }

  return parsed as Record<string, unknown>;
}
