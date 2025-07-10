import { describe, expectTypeOf, it } from "vitest";
import * as z from "zod/v4";
import { type ZodSchemaFactory, zodEngine } from "../ghiiEngineZod.js";

describe("Ghii Engine Zod TypesTest", () => {
  it("should have correct ZodSchemaFactory type", () => {
    const factory: ZodSchemaFactory<z.ZodString> = (zod) => zod.string();
    expectTypeOf(factory).toBeFunction();
    expectTypeOf(factory).parameter(0).toEqualTypeOf<typeof z>();
    expectTypeOf(factory).returns.toEqualTypeOf<z.ZodString>();
  });

  it("should work with function schema factory", () => {
    const engine = zodEngine((zod) =>
      zod.object({
        name: zod.string(),
        age: zod.number(),
      })
    );

    expectTypeOf(engine).toMatchTypeOf<{
      validate: (toValidate: { name: string; age: number }) =>
        | { success: true; value: { name: string; age: number } }
        | {
            success: false;
            errors: Array<{
              path: string;
              input: unknown;
              details: string;
              message: string;
              _raw: z.ZodIssue;
            }>;
          };
      toSchema: () => unknown;
    }>();
  });

  it("should work with direct schema", () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const engine = zodEngine(schema);

    expectTypeOf(engine).toMatchTypeOf<{
      validate: (toValidate: { email: string; password: string }) =>
        | { success: true; value: { email: string; password: string } }
        | {
            success: false;
            errors: Array<{
              path: string;
              input: unknown;
              details: string;
              message: string;
              _raw: z.ZodIssue;
            }>;
          };
      toSchema: () => unknown;
    }>();
  });

  it("should handle primitive types", () => {
    const stringEngine = zodEngine(z.string());
    expectTypeOf(stringEngine.validate).parameter(0).toEqualTypeOf<string>();

    const numberEngine = zodEngine(z.number());
    expectTypeOf(numberEngine.validate).parameter(0).toEqualTypeOf<number>();

    const booleanEngine = zodEngine(z.boolean());
    expectTypeOf(booleanEngine.validate).parameter(0).toEqualTypeOf<boolean>();
  });

  it("should handle array types", () => {
    const arrayEngine = zodEngine(z.array(z.string()));
    expectTypeOf(arrayEngine.validate).parameter(0).toEqualTypeOf<string[]>();
  });

  it("should handle union types", () => {
    const unionEngine = zodEngine(z.union([z.string(), z.number()]));
    expectTypeOf(unionEngine.validate).parameter(0).toEqualTypeOf<string | number>();
  });

  it("should handle optional fields", () => {
    const optionalEngine = zodEngine(
      z.object({
        required: z.string(),
        optional: z.string().optional(),
      })
    );

    expectTypeOf(optionalEngine.validate).parameter(0).toEqualTypeOf<{
      required: string;
      optional?: string | undefined;
    }>();
  });

  it("should handle nested objects", () => {
    const nestedEngine = zodEngine(
      z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            avatar: z.string().url().optional(),
          }),
          settings: z.object({
            theme: z.enum(["light", "dark"]),
            notifications: z.boolean(),
          }),
        }),
      })
    );

    expectTypeOf(nestedEngine.validate).parameter(0).toEqualTypeOf<{
      user: {
        profile: {
          name: string;
          avatar?: string | undefined;
        };
        settings: {
          theme: "light" | "dark";
          notifications: boolean;
        };
      };
    }>();
  });

  it("should handle complex schemas with factory function", () => {
    const complexEngine = zodEngine((zod) =>
      zod.object({
        id: zod.string().uuid(),
        metadata: zod.record(zod.string(), zod.unknown()),
        tags: zod.array(zod.string()),
        createdAt: zod.date(),
        updatedAt: zod.date().optional(),
      })
    );

    expectTypeOf(complexEngine.validate).parameter(0).toEqualTypeOf<{
      id: string;
      metadata: Record<string, unknown>;
      tags: string[];
      createdAt: Date;
      updatedAt?: Date | undefined;
    }>();
  });

  it("should have correct return types for validate method", () => {
    const engine = zodEngine(z.object({ name: z.string() }));
    const result = engine.validate({ name: "test" });

    if (result.success) {
      expectTypeOf(result.value).toExtend<{ name: string }>();
    } else {
      expectTypeOf(result.errors).toExtend<
        Array<{ path: string; input: unknown; details: unknown; message: string; _raw: unknown }>
      >();
    }
  });

  it("should have correct return type for toSchema method", () => {
    const engine = zodEngine(z.object({ name: z.string() }));
    const schema = engine.toJsonSchema();

    expectTypeOf(schema).toExtend<string>();
  });

  it("should handle literal types", () => {
    const literalEngine = zodEngine(
      z.object({
        status: z.literal("success"),
        code: z.literal(200),
      })
    );

    expectTypeOf(literalEngine.validate).parameter(0).toEqualTypeOf<{
      status: "success";
      code: 200;
    }>();
  });

  it("should handle enum types", () => {
    const enumEngine = zodEngine(
      z.object({
        role: z.enum(["admin", "user", "guest"]),
        permission: z.enum(["read", "write", "delete"]),
      })
    );

    expectTypeOf(enumEngine.validate).parameter(0).toEqualTypeOf<{
      role: "admin" | "user" | "guest";
      permission: "read" | "write" | "delete";
    }>();
  });
});
