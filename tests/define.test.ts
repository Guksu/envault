import { describe, it, expect, vi } from "vitest";
import { defineConfig } from "../src/define";
import { t } from "../src/types";

describe("defineConfig", () => {
  it("should create config from env source", () => {
    const config = defineConfig({
      sources: { env: { PORT: "3000", NODE_ENV: "development" } },
      schema: {
        PORT: t.number().default(8080),
        NODE_ENV: t.string().default("production"),
      },
    });

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe("development");
  });

  it("should apply default values when key is missing", () => {
    const config = defineConfig({
      sources: { env: {} },
      schema: {
        PORT: t.number().default(3000),
        DEBUG: t.boolean().default(false),
      },
    });

    expect(config.PORT).toBe(3000);
    expect(config.DEBUG).toBe(false);
  });

  it("should throw when required field is missing (throwOnError=true)", () => {
    expect(() =>
      defineConfig({
        sources: { env: {} },
        schema: { API_KEY: t.string().required() },
      })
    ).toThrow();
  });

  it("should not throw when throwOnError=false", () => {
    expect(() =>
      defineConfig({
        sources: { env: {} },
        schema: { API_KEY: t.string().required() },
        options: { throwOnError: false, logErrors: false },
      })
    ).not.toThrow();
  });

  it("should return undefined for optional fields not set", () => {
    const config = defineConfig({
      sources: { env: {} },
      schema: { OPTIONAL: t.string() },
      options: { throwOnError: false },
    });

    expect(config.OPTIONAL).toBeUndefined();
  });

  it("toObject() should return plain object of values", () => {
    const config = defineConfig({
      sources: { env: { PORT: "4000" } },
      schema: { PORT: t.number().default(3000) },
    });

    const obj = config.toObject();
    expect(obj).toEqual({ PORT: 4000 });
    expect(typeof obj.print).toBe("undefined");
  });

  it("validate() should return valid=true when all fields pass", () => {
    const config = defineConfig({
      sources: { env: { PORT: "3000" } },
      schema: { PORT: t.number().required() },
    });

    const result = config.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validate() should return errors when fields fail", () => {
    const config = defineConfig({
      sources: { env: {} },
      schema: { PORT: t.number().required() },
      options: { throwOnError: false, logErrors: false },
    });

    const result = config.validate();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("print() should output masked sensitive values", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const config = defineConfig({
      sources: { env: { API_KEY: "sk-1234567890abcdef" } },
      schema: { API_KEY: t.string().required().sensitive() },
    });

    config.print();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("****")
    );

    consoleSpy.mockRestore();
  });

  it("print() should show plain values for non-sensitive fields", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const config = defineConfig({
      sources: { env: { PORT: "3000" } },
      schema: { PORT: t.number().default(3000) },
    });

    config.print();

    expect(consoleSpy).toHaveBeenCalledWith("PORT: 3000");

    consoleSpy.mockRestore();
  });

  it("should use process.env as default source when sources not provided", () => {
    process.env["TEST_VAR_ENVAULT"] = "hello";

    const config = defineConfig({
      schema: { TEST_VAR_ENVAULT: t.string() },
    });

    expect(config.TEST_VAR_ENVAULT).toBe("hello");
    delete process.env["TEST_VAR_ENVAULT"];
  });

  it("should support multiple schema fields with various types", () => {
    const config = defineConfig({
      sources: {
        env: {
          PORT: "8080",
          DEBUG: "true",
          ORIGINS: "a.com,b.com",
          NODE_ENV: "production",
        },
      },
      schema: {
        PORT: t.number().default(3000),
        DEBUG: t.boolean().default(false),
        ORIGINS: t.array(),
        NODE_ENV: t.enum(["development", "production", "test"] as const).required(),
      },
    });

    expect(config.PORT).toBe(8080);
    expect(config.DEBUG).toBe(true);
    expect(config.ORIGINS).toEqual(["a.com", "b.com"]);
    expect(config.NODE_ENV).toBe("production");
  });
});
