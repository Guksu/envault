import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { runDiff } from "../src/cli/diff";
import { runAudit } from "../src/cli/audit";

describe("CLI Commands", () => {
  describe("diff", () => {
    const file1 = resolve("__test_env1.env");
    const file2 = resolve("__test_env2.env");

    beforeEach(() => {
      writeFileSync(file1, "PORT=3000\nDEBUG=true\nNODE_ENV=development\n");
      writeFileSync(
        file2,
        "PORT=8080\nDEBUG=false\nNODE_ENV=production\nSENTRY_DSN=https://x\n"
      );
    });

    afterEach(() => {
      if (existsSync(file1)) unlinkSync(file1);
      if (existsSync(file2)) unlinkSync(file2);
    });

    it("should print diff table without throwing", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      runDiff(file1, file2);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should report difference count", () => {
      const output: string[] = [];
      vi.spyOn(console, "log").mockImplementation((msg: string) => output.push(msg));
      runDiff(file1, file2);
      const summary = output.find((l) => l.includes("difference"));
      expect(summary).toBeDefined();
      vi.restoreAllMocks();
    });

    it("should exit when file not found", () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit");
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => runDiff("nonexistent1.env", "nonexistent2.env")).toThrow();
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe("audit", () => {
    const envFile = resolve("__test_audit.env");

    afterEach(() => {
      if (existsSync(envFile)) unlinkSync(envFile);
    });

    it("should detect API_KEY as sensitive", () => {
      writeFileSync(envFile, "API_KEY=sk-1234567890\nPORT=3000\n");
      const output: string[] = [];
      vi.spyOn(console, "log").mockImplementation((msg: string) => output.push(msg));
      runAudit([envFile]);
      expect(output.some((l) => l.includes("API_KEY"))).toBe(true);
      vi.restoreAllMocks();
    });

    it("should detect password in connection string", () => {
      writeFileSync(envFile, "DATABASE_URL=postgresql://user:secret@localhost/db\n");
      const output: string[] = [];
      vi.spyOn(console, "log").mockImplementation((msg: string) => output.push(msg));
      runAudit([envFile]);
      expect(
        output.some((l) => l.includes("DATABASE_URL") || l.includes("connection string"))
      ).toBe(true);
      vi.restoreAllMocks();
    });

    it("should report no secrets when env is clean", () => {
      writeFileSync(envFile, "PORT=3000\nNODE_ENV=development\n");
      const output: string[] = [];
      vi.spyOn(console, "log").mockImplementation((msg: string) => output.push(msg));
      runAudit([envFile]);
      expect(output.some((l) => l.includes("No obvious secrets"))).toBe(true);
      vi.restoreAllMocks();
    });

    it("should skip nonexistent files with a warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      runAudit(["nonexistent.env"]);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
      warnSpy.mockRestore();
    });
  });
});
