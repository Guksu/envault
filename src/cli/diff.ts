import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

function padEnd(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

export function runDiff(file1: string, file2: string): void {
  const path1 = resolve(file1);
  const path2 = resolve(file2);

  if (!existsSync(path1)) {
    console.error(`File not found: ${file1}`);
    process.exit(1);
  }
  if (!existsSync(path2)) {
    console.error(`File not found: ${file2}`);
    process.exit(1);
  }

  const env1 = parseEnvFile(path1);
  const env2 = parseEnvFile(path2);

  const allKeys = Array.from(new Set([...Object.keys(env1), ...Object.keys(env2)])).sort();

  const col1Width = Math.max(file1.length, 20);
  const col2Width = Math.max(file2.length, 20);
  const keyWidth = Math.max(...allKeys.map((k) => k.length), 12);

  const separator = `+${"-".repeat(keyWidth + 2)}+${"-".repeat(col1Width + 2)}+${"-".repeat(col2Width + 2)}+`;

  console.log(separator);
  console.log(
    `| ${padEnd("Variable", keyWidth)} | ${padEnd(file1, col1Width)} | ${padEnd(file2, col2Width)} |`
  );
  console.log(separator);

  let diffCount = 0;

  for (const key of allKeys) {
    const v1 = env1[key] ?? "(not set)";
    const v2 = env2[key] ?? "(not set)";

    if (v1 !== v2) {
      diffCount++;
      console.log(
        `| ${padEnd(key, keyWidth)} | ${padEnd(v1, col1Width)} | ${padEnd(v2, col2Width)} |`
      );
    }
  }

  console.log(separator);

  if (diffCount === 0) {
    console.log("\nNo differences found.");
  } else {
    console.log(`\n${diffCount} difference(s) found.`);
  }
}
