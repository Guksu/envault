import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { loadEnvSource } from "../src/sources/env";
import { loadJsonSource } from "../src/sources/json";
import { loadAsyncSource } from "../src/sources/async";

describe("Source Loaders", () => {
  describe("env source", () => {
    it("should return the env object as-is", () => {
      const env = { PORT: "3000", NODE_ENV: "development" };
      expect(loadEnvSource(env)).toEqual(env);
    });

    it("should handle undefined values", () => {
      const env: Record<string, string | undefined> = { PORT: undefined };
      const result = loadEnvSource(env);
      expect(result["PORT"]).toBeUndefined();
    });

    it("should load from process.env", () => {
      process.env["TEST_SOURCE_ENVAULT"] = "test-value";
      const result = loadEnvSource(process.env);
      expect(result["TEST_SOURCE_ENVAULT"]).toBe("test-value");
      delete process.env["TEST_SOURCE_ENVAULT"];
    });
  });

  describe("json source", () => {
    const tmpFile = resolve("__test_config.json");

    beforeEach(() => {
      writeFileSync(tmpFile, JSON.stringify({ PORT: 3000, DEBUG: true, NAME: "app" }));
    });

    afterEach(() => {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    });

    it("should load and parse JSON file", () => {
      const result = loadJsonSource(tmpFile);
      expect(result["PORT"]).toBe(3000);
      expect(result["DEBUG"]).toBe(true);
      expect(result["NAME"]).toBe("app");
    });

    it("should throw on non-existent file", () => {
      expect(() => loadJsonSource("nonexistent.json")).toThrow();
    });

    it("should throw if JSON root is not an object", () => {
      writeFileSync(tmpFile, JSON.stringify([1, 2, 3]));
      expect(() => loadJsonSource(tmpFile)).toThrow("JSON source must be an object");
    });

    it("should throw on invalid JSON", () => {
      writeFileSync(tmpFile, "{invalid json}");
      expect(() => loadJsonSource(tmpFile)).toThrow();
    });
  });

  describe("async source", () => {
    it("should call the loader and return the result", async () => {
      const loader = async () => ({ SECRET: "value" });
      const result = await loadAsyncSource(loader);
      expect(result["SECRET"]).toBe("value");
    });

    it("should propagate errors from the loader", async () => {
      const loader = async () => {
        throw new Error("Vault unavailable");
      };
      await expect(loadAsyncSource(loader)).rejects.toThrow("Vault unavailable");
    });
  });
});
