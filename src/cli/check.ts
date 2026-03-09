import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface EnvEntry {
  key: string;
  value: string | undefined;
  isSet: boolean;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, "utf-8");
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = value;
  }

  return result;
}

export function runCheck(configPath: string, envPath?: string): void {
  const source: Record<string, string | undefined> = envPath
    ? parseEnvFile(resolve(envPath))
    : (process.env as Record<string, string | undefined>);

  // 설정 파일 로드 시도
  const resolvedConfig = resolve(configPath);
  if (!existsSync(resolvedConfig)) {
    console.error(`Config file not found: ${configPath}`);
    console.error("Tip: Create envault.config.js (compiled) or run with tsx for .ts files");
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(resolvedConfig);
  const config = mod.default ?? mod;

  if (typeof config?.validate !== "function") {
    console.error("Config file must export a defineConfig() result as default export");
    process.exit(1);
  }

  // 환경변수 주입 후 재검증
  const entries: EnvEntry[] = Object.keys(source).map((key) => ({
    key,
    value: source[key],
    isSet: source[key] !== undefined && source[key] !== "",
  }));

  const { valid, errors } = config.validate();

  for (const entry of entries) {
    const mark = entry.isSet ? "✓" : "✗";
    console.log(`${mark} ${entry.key}: ${entry.isSet ? "[set]" : "(not set)"}`);
  }

  if (!valid) {
    console.error(`\nValidation failed: ${errors.length} error(s)`);
    for (const err of errors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  } else {
    console.log("\nAll checks passed.");
  }
}
