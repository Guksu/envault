import { describe, it, expect } from "vitest";
import { t } from "../src/types";

describe("Type Builders", () => {
  describe("t.string()", () => {
    it("should parse string value", () => {
      const type = t.string();
      expect(type.parse("hello")).toBe("hello");
    });

    it("should return empty string as valid value", () => {
      const type = t.string();
      expect(type.parse("")).toBe("");
    });

    it("should return default when undefined", () => {
      const type = t.string().default("fallback");
      expect(type.parse(undefined)).toBe("fallback");
    });

    it("should return undefined when not required and no default", () => {
      const type = t.string();
      expect(type.parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      const type = t.string().required();
      expect(() => type.parse(undefined)).toThrow("Value is required");
    });

    it("should pass validation", () => {
      const type = t.string().validate((v) => v.length >= 3);
      expect(type.parse("hello")).toBe("hello");
    });

    it("should throw when validation fails", () => {
      const type = t.string().validate((v) => v.length >= 3);
      expect(() => type.parse("hi")).toThrow("Validation failed");
    });

    it("should apply single transformer", () => {
      const type = t.string().transform((v) => v.toUpperCase());
      expect(type.parse("hello")).toBe("HELLO");
    });

    it("should apply multiple transformers in order", () => {
      const type = t
        .string()
        .transform((v) => v.trim())
        .transform((v) => v.toUpperCase());
      expect(type.parse("  hello  ")).toBe("HELLO");
    });

    it("should chain required, default, validate, transform", () => {
      const type = t
        .string()
        .required()
        .validate((v) => v.length > 0)
        .transform((v) => v.toLowerCase());
      expect(type.parse("HELLO")).toBe("hello");
    });
  });

  describe("t.number()", () => {
    it("should parse number value", () => {
      const type = t.number();
      expect(type.parse("42")).toBe(42);
    });

    it("should parse float value", () => {
      const type = t.number();
      expect(type.parse("3.14")).toBe(3.14);
    });

    it("should parse negative value", () => {
      const type = t.number();
      expect(type.parse("-10")).toBe(-10);
    });

    it("should throw on invalid number", () => {
      const type = t.number();
      expect(() => type.parse("abc")).toThrow("Invalid number");
    });

    it("should return default when undefined", () => {
      const type = t.number().default(3000);
      expect(type.parse(undefined)).toBe(3000);
    });

    it("should throw when required and undefined", () => {
      const type = t.number().required();
      expect(() => type.parse(undefined)).toThrow("Value is required");
    });

    it("should validate number range", () => {
      const type = t.number().validate((v) => v >= 0 && v <= 65535);
      expect(type.parse("8080")).toBe(8080);
      expect(() => type.parse("-1")).toThrow("Validation failed");
    });

    it("should transform number", () => {
      const type = t.number().transform((v) => Math.round(v));
      expect(type.parse("3.7")).toBe(4);
    });
  });

  describe("t.boolean()", () => {
    it("should parse 'true'", () => {
      const type = t.boolean();
      expect(type.parse("true")).toBe(true);
    });

    it("should parse 'false'", () => {
      const type = t.boolean();
      expect(type.parse("false")).toBe(false);
    });

    it("should parse '1' as true", () => {
      const type = t.boolean();
      expect(type.parse("1")).toBe(true);
    });

    it("should parse '0' as false", () => {
      const type = t.boolean();
      expect(type.parse("0")).toBe(false);
    });

    it("should parse 'yes' as true (case insensitive)", () => {
      const type = t.boolean();
      expect(type.parse("YES")).toBe(true);
      expect(type.parse("Yes")).toBe(true);
    });

    it("should parse 'no' as false (case insensitive)", () => {
      const type = t.boolean();
      expect(type.parse("NO")).toBe(false);
      expect(type.parse("No")).toBe(false);
    });

    it("should throw on invalid boolean", () => {
      const type = t.boolean();
      expect(() => type.parse("maybe")).toThrow("Invalid boolean");
    });

    it("should return default when undefined", () => {
      const type = t.boolean().default(true);
      expect(type.parse(undefined)).toBe(true);
    });

    it("should throw when required and undefined", () => {
      const type = t.boolean().required();
      expect(() => type.parse(undefined)).toThrow("Value is required");
    });

    it("should accept native boolean from JSON source", () => {
      expect(t.boolean().parse(true)).toBe(true);
      expect(t.boolean().parse(false)).toBe(false);
    });
  });

  describe("t.array()", () => {
    it("should parse comma-separated string", () => {
      expect(t.array().parse("a,b,c")).toEqual(["a", "b", "c"]);
    });

    it("should trim whitespace from items", () => {
      expect(t.array().parse("a, b, c")).toEqual(["a", "b", "c"]);
    });

    it("should use custom separator", () => {
      expect(t.array().separator("|").parse("a|b|c")).toEqual(["a", "b", "c"]);
    });

    it("should return undefined when not set", () => {
      expect(t.array().parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      expect(() => t.array().required().parse(undefined)).toThrow("Value is required");
    });

    it("should return default when undefined", () => {
      expect(t.array().default(["x", "y"]).parse(undefined)).toEqual(["x", "y"]);
    });

    it("should accept native array from JSON source", () => {
      expect(t.array().parse(["a", "b"])).toEqual(["a", "b"]);
    });
  });

  describe("t.json()", () => {
    it("should parse JSON string", () => {
      expect(t.json().parse('{"a":1}')).toEqual({ a: 1 });
    });

    it("should throw on invalid JSON", () => {
      expect(() => t.json().parse("{invalid}")).toThrow("Invalid JSON");
    });

    it("should pass through already-parsed object", () => {
      const obj = { key: "value" };
      expect(t.json().parse(obj)).toEqual(obj);
    });

    it("should return undefined when not set", () => {
      expect(t.json().parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      expect(() => t.json().required().parse(undefined)).toThrow("Value is required");
    });
  });

  describe("t.url()", () => {
    it("should accept valid URL", () => {
      expect(t.url().parse("https://example.com")).toBe("https://example.com");
    });

    it("should throw on invalid URL", () => {
      expect(() => t.url().parse("not-a-url")).toThrow("Invalid URL");
    });

    it("should return undefined when not set", () => {
      expect(t.url().parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      expect(() => t.url().required().parse(undefined)).toThrow("Value is required");
    });
  });

  describe("t.email()", () => {
    it("should accept valid email", () => {
      expect(t.email().parse("user@example.com")).toBe("user@example.com");
    });

    it("should throw on invalid email", () => {
      expect(() => t.email().parse("not-an-email")).toThrow("Invalid email");
    });

    it("should return undefined when not set", () => {
      expect(t.email().parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      expect(() => t.email().required().parse(undefined)).toThrow("Value is required");
    });
  });

  describe("t.enum()", () => {
    it("should accept valid enum value", () => {
      const type = t.enum(["development", "production", "test"] as const);
      expect(type.parse("development")).toBe("development");
    });

    it("should throw on invalid enum value with message", () => {
      expect(() => t.enum(["a", "b", "c"] as const).parse("d")).toThrow(
        'Invalid enum value "d"'
      );
    });

    it("should list allowed values in error message", () => {
      expect(() => t.enum(["a", "b", "c"] as const).parse("x")).toThrow(
        "Must be one of: a, b, c"
      );
    });

    it("should return undefined when not set", () => {
      expect(t.enum(["a", "b"] as const).parse(undefined)).toBeUndefined();
    });

    it("should throw when required and undefined", () => {
      expect(() => t.enum(["a", "b"] as const).required().parse(undefined)).toThrow(
        "Value is required"
      );
    });

    it("should use default when not set", () => {
      expect(t.enum(["a", "b"] as const).default("a").parse(undefined)).toBe("a");
    });
  });
});
