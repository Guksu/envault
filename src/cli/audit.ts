import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const SENSITIVE_PATTERNS = [
  { pattern: /KEY/i, hint: "Contains 'KEY' pattern" },
  { pattern: /SECRET/i, hint: "Contains 'SECRET' pattern" },
  { pattern: /PASSWORD/i, hint: "Contains 'PASSWORD' pattern" },
  { pattern: /PASSWD/i, hint: "Contains 'PASSWD' pattern" },
  { pattern: /TOKEN/i, hint: "Contains 'TOKEN' pattern" },
  { pattern: /CREDENTIAL/i, hint: "Contains 'CREDENTIAL' pattern" },
  { pattern: /PRIVATE/i, hint: "Contains 'PRIVATE' pattern" },
  { pattern: /DATABASE_URL|DB_URL/i, hint: "Contains database connection string pattern" },
];

const CONNECTION_STRING_PATTERN = /:\/\/[^:]+:[^@]+@/;

export function runAudit(filePaths: string[]): void {
  const targets = filePaths.length > 0 ? filePaths : [".env"];
  let totalFound = 0;

  for (const filePath of targets) {
    const resolved = resolve(filePath);
    if (!existsSync(resolved)) {
      console.warn(`Skipping: ${filePath} (not found)`);
      continue;
    }

    const content = readFileSync(resolved, "utf-8");
    const lines = content.split("\n");
    const findings: { line: number; key: string; hints: string[] }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) continue;

      const key = line.slice(0, eqIndex).trim();
      const value = line.slice(eqIndex + 1).trim();
      const hints: string[] = [];

      for (const { pattern, hint } of SENSITIVE_PATTERNS) {
        if (pattern.test(key)) {
          hints.push(hint);
        }
      }

      if (CONNECTION_STRING_PATTERN.test(value)) {
        hints.push("Contains password in connection string");
      }

      if (hints.length > 0) {
        findings.push({ line: i + 1, key, hints });
      }
    }

    if (findings.length > 0) {
      console.log(`\nPotential secrets found in ${filePath}:\n`);
      for (const { line, key, hints } of findings) {
        console.log(`  Line ${line}: ${key}`);
        for (const hint of hints) {
          console.log(`    -> ${hint}`);
        }
      }
      totalFound += findings.length;
    } else {
      console.log(`${filePath}: No obvious secrets detected.`);
    }
  }

  if (totalFound > 0) {
    console.log("\nTip: Add .env to .gitignore and use .env.example for documentation");
  }
}
