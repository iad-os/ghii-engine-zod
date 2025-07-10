import { describe, expect, it } from 'vitest';
import * as z from 'zod/v4';
import { zodEngine } from '../ghiiEngineZod.js';

describe('Ghii Engine Zod Test', () => {
  describe('zodEngine with function schema', () => {
    const userSchema = (zod: typeof z) =>
      zod.object({
        name: zod.string().min(1),
        age: zod.number().min(0).max(150),
        email: zod.email(),
        isActive: zod.boolean().optional(),
      });

    const engine = zodEngine(userSchema);

    it('should validate valid data successfully', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        isActive: true,
      };

      const result = engine.validate(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validData);
      }
    });

    it('should validate valid data without optional fields', () => {
      const validData = {
        name: 'Jane Doe',
        age: 25,
        email: 'jane@example.com',
      };

      const result = engine.validate(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validData);
      }
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = {
        name: '',
        age: -5,
        email: 'invalid-email',
        // biome-ignore lint/suspicious/noExplicitAny: Test data
        isActive: 'not-boolean' as any,
      };

      const result = engine.validate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(4);

        const nameError = result.errors.find(e => e.path === 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.message).toContain('Too small');

        const ageError = result.errors.find(e => e.path === 'age');
        expect(ageError).toBeDefined();
        expect(ageError?.message).toContain('Too small');

        const emailError = result.errors.find(e => e.path === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toContain('Invalid email');

        const isActiveError = result.errors.find(e => e.path === 'isActive');
        expect(isActiveError).toBeDefined();
        expect(isActiveError?.message).toContain('Invalid input');
      }
    });

    it('should return validation errors for missing required fields', () => {
      const invalidData = {
        name: 'John Doe',
        // missing age and email
        // biome-ignore lint/suspicious/noExplicitAny: Test data
      } as any;

      const result = engine.validate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);

        const ageError = result.errors.find(e => e.path === 'age');
        expect(ageError).toBeDefined();
        expect(ageError?.message).toContain('Invalid input');

        const emailError = result.errors.find(e => e.path === 'email');
        expect(emailError).toBeDefined();
        expect(emailError?.message).toContain('Invalid input');
      }
    });

    it('should generate JSON schema', () => {
      const schema = engine.toJsonSchema();

      expect(schema).toBeDefined();
      expect(schema).toMatchInlineSnapshot(
        `"{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"name":{"type":"string","minLength":1},"age":{"type":"number","minimum":0,"maximum":150},"email":{"type":"string","format":"email","pattern":"^(?!\\\\.)(?!.*\\\\.\\\\.)([A-Za-z0-9_'+\\\\-\\\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\\\-]*\\\\.)+[A-Za-z]{2,}$"},"isActive":{"type":"boolean"}},"required":["name","age","email"],"additionalProperties":false}"`
      );
    });
  });

  describe('zodEngine with direct schema', () => {
    const directSchema = z.object({
      id: z.number().int().positive(),
      title: z.string().min(1).max(100),
      tags: z.array(z.string()).optional(),
    });

    const engine = zodEngine(directSchema);

    it('should validate valid data successfully', () => {
      const validData = {
        id: 1,
        title: 'Test Title',
        tags: ['tag1', 'tag2'],
      };

      const result = engine.validate(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validData);
      }
    });

    it('should validate valid data without optional fields', () => {
      const validData = {
        id: 2,
        title: 'Another Title',
      };

      const result = engine.validate(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validData);
      }
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = {
        id: 0, // not positive
        title: '', // empty string
        // biome-ignore lint/suspicious/noExplicitAny: Test data
        tags: [123, 'tag2'] as any, // invalid array element
      };

      const result = engine.validate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(3);

        const idError = result.errors.find(e => e.path === 'id');
        expect(idError).toBeDefined();
        expect(idError?.message).toContain('Too small');

        const titleError = result.errors.find(e => e.path === 'title');
        expect(titleError).toBeDefined();
        expect(titleError?.message).toContain('Too small');

        const tagsError = result.errors.find(e => e.path === 'tags.0');
        expect(tagsError).toBeDefined();
        expect(tagsError?.message).toContain('Invalid input');
      }
    });

    it('should generate JSON schema', () => {
      const schema = engine.toJsonSchema();
      expect(schema).toMatchInlineSnapshot(
        `"{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"id":{"type":"integer","exclusiveMinimum":0,"maximum":9007199254740991},"title":{"type":"string","minLength":1,"maxLength":100},"tags":{"type":"array","items":{"type":"string"}}},"required":["id","title"],"additionalProperties":false}"`
      );
    });
  });

  describe('zodEngine with complex nested schema', () => {
    const complexSchema = (zod: typeof z) =>
      zod.object({
        user: zod.object({
          profile: zod.object({
            firstName: zod.string().min(1),
            lastName: zod.string(),
            preferences: zod
              .object({
                theme: zod.enum(['light', 'dark']),
                notifications: zod.boolean(),
              })
              .optional(),
          }),
          settings: zod.array(
            zod.object({
              key: zod.string(),
              value: zod.union([zod.string(), zod.number(), zod.boolean()]),
            })
          ),
        }),
        metadata: zod.object({
          createdAt: zod.string().datetime(),
          version: zod.number().int().positive(),
        }),
      });

    const engine = zodEngine(complexSchema);

    it('should validate complex nested data successfully', () => {
      const validData: z.infer<ReturnType<typeof complexSchema>> = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            preferences: {
              theme: 'dark',
              notifications: true,
            },
          },
          settings: [
            { key: 'language', value: 'en' },
            { key: 'timezone', value: 'UTC' },
            { key: 'debug', value: false },
          ],
        },
        metadata: {
          createdAt: '2023-01-01T00:00:00.000Z',
          version: 1,
        },
      };

      const result = engine.validate(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validData);
      }
    });

    it('should return validation errors for nested invalid data', () => {
      const invalidData = {
        user: {
          profile: {
            firstName: '', // empty string
            lastName: 'Doe',
            preferences: {
              theme: 'invalid-theme', // invalid enum
              notifications: 'not-boolean', // invalid type
            },
          },
          settings: [
            { key: 'language', value: 'en' },
            { key: 'timezone', value: null }, // invalid union type
          ],
        },
        metadata: {
          createdAt: 'invalid-date', // invalid datetime
          version: 0, // not positive
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Test data
      const result = engine.validate(invalidData as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        // Zod v4 may report the path as just ['firstName']
        const firstNameError = result.errors.find(e => e.path.endsWith('firstName'));
        expect(firstNameError).toBeDefined();

        const themeError = result.errors.find(e => e.path.endsWith('theme'));
        expect(themeError).toMatchInlineSnapshot(`
          {
            "_raw": {
              "code": "invalid_value",
              "message": "Invalid option: expected one of "light"|"dark"",
              "path": [
                "user",
                "profile",
                "preferences",
                "theme",
              ],
              "values": [
                "light",
                "dark",
              ],
            },
            "details": "invalid_value",
            "input": undefined,
            "message": "Invalid option: expected one of "light"|"dark"",
            "path": "user.profile.preferences.theme",
          }
        `);

        const notificationsError = result.errors.find(e => e.path.endsWith('notifications'));
        expect(notificationsError).toMatchInlineSnapshot(`
          {
            "_raw": {
              "code": "invalid_type",
              "expected": "boolean",
              "message": "Invalid input: expected boolean, received string",
              "path": [
                "user",
                "profile",
                "preferences",
                "notifications",
              ],
            },
            "details": "invalid_type",
            "input": undefined,
            "message": "Invalid input: expected boolean, received string",
            "path": "user.profile.preferences.notifications",
          }
        `);

        const timezoneError = result.errors.find(e => e.path.endsWith('settings.1.value'));
        expect(timezoneError).toMatchInlineSnapshot(`
          {
            "_raw": {
              "code": "invalid_union",
              "errors": [
                [
                  {
                    "code": "invalid_type",
                    "expected": "string",
                    "message": "Invalid input: expected string, received null",
                    "path": [],
                  },
                ],
                [
                  {
                    "code": "invalid_type",
                    "expected": "number",
                    "message": "Invalid input: expected number, received null",
                    "path": [],
                  },
                ],
                [
                  {
                    "code": "invalid_type",
                    "expected": "boolean",
                    "message": "Invalid input: expected boolean, received null",
                    "path": [],
                  },
                ],
              ],
              "message": "Invalid input",
              "path": [
                "user",
                "settings",
                1,
                "value",
              ],
            },
            "details": "invalid_union",
            "input": undefined,
            "message": "Invalid input",
            "path": "user.settings.1.value",
          }
        `);

        const createdAtError = result.errors.find(e => e.path.endsWith('createdAt'));
        expect(createdAtError).toMatchInlineSnapshot(`
          {
            "_raw": {
              "code": "invalid_format",
              "format": "datetime",
              "message": "Invalid ISO datetime",
              "origin": "string",
              "path": [
                "metadata",
                "createdAt",
              ],
              "pattern": "/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/",
            },
            "details": "invalid_format",
            "input": undefined,
            "message": "Invalid ISO datetime",
            "path": "metadata.createdAt",
          }
        `);

        const versionError = result.errors.find(e => e.path.endsWith('version'));
        expect(versionError).toMatchInlineSnapshot(`
          {
            "_raw": {
              "code": "too_small",
              "inclusive": false,
              "message": "Too small: expected number to be >0",
              "minimum": 0,
              "origin": "number",
              "path": [
                "metadata",
                "version",
              ],
            },
            "details": "too_small",
            "input": undefined,
            "message": "Too small: expected number to be >0",
            "path": "metadata.version",
          }
        `);
      }
    });

    it('should generate JSON schema for complex schema', () => {
      const schema = engine.toJsonSchema();

      expect(schema).toMatchInlineSnapshot(
        `"{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"user":{"type":"object","properties":{"profile":{"type":"object","properties":{"firstName":{"type":"string","minLength":1},"lastName":{"type":"string"},"preferences":{"type":"object","properties":{"theme":{"type":"string","enum":["light","dark"]},"notifications":{"type":"boolean"}},"required":["theme","notifications"],"additionalProperties":false}},"required":["firstName","lastName"],"additionalProperties":false},"settings":{"type":"array","items":{"type":"object","properties":{"key":{"type":"string"},"value":{"anyOf":[{"type":"string"},{"type":"number"},{"type":"boolean"}]}},"required":["key","value"],"additionalProperties":false}}},"required":["profile","settings"],"additionalProperties":false},"metadata":{"type":"object","properties":{"createdAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\\\d\\\\d[2468][048]|\\\\d\\\\d[13579][26]|\\\\d\\\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\\\d|30)|(?:02)-(?:0[1-9]|1\\\\d|2[0-8])))T(?:(?:[01]\\\\d|2[0-3]):[0-5]\\\\d(?::[0-5]\\\\d(?:\\\\.\\\\d+)?)?(?:Z))$"},"version":{"type":"integer","exclusiveMinimum":0,"maximum":9007199254740991}},"required":["createdAt","version"],"additionalProperties":false}},"required":["user","metadata"],"additionalProperties":false}"`
      );
    });
    it('should generate Pretty JSON schema for complex schema', () => {
      const schema = engine.toJsonSchema(true);

      expect(schema).toMatchInlineSnapshot(
        `
        "{
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "user": {
              "type": "object",
              "properties": {
                "profile": {
                  "type": "object",
                  "properties": {
                    "firstName": {
                      "type": "string",
                      "minLength": 1
                    },
                    "lastName": {
                      "type": "string"
                    },
                    "preferences": {
                      "type": "object",
                      "properties": {
                        "theme": {
                          "type": "string",
                          "enum": [
                            "light",
                            "dark"
                          ]
                        },
                        "notifications": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "theme",
                        "notifications"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "firstName",
                    "lastName"
                  ],
                  "additionalProperties": false
                },
                "settings": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "key": {
                        "type": "string"
                      },
                      "value": {
                        "anyOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "boolean"
                          }
                        ]
                      }
                    },
                    "required": [
                      "key",
                      "value"
                    ],
                    "additionalProperties": false
                  }
                }
              },
              "required": [
                "profile",
                "settings"
              ],
              "additionalProperties": false
            },
            "metadata": {
              "type": "object",
              "properties": {
                "createdAt": {
                  "type": "string",
                  "format": "date-time",
                  "pattern": "^(?:(?:\\\\d\\\\d[2468][048]|\\\\d\\\\d[13579][26]|\\\\d\\\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\\\d|30)|(?:02)-(?:0[1-9]|1\\\\d|2[0-8])))T(?:(?:[01]\\\\d|2[0-3]):[0-5]\\\\d(?::[0-5]\\\\d(?:\\\\.\\\\d+)?)?(?:Z))$"
                },
                "version": {
                  "type": "integer",
                  "exclusiveMinimum": 0,
                  "maximum": 9007199254740991
                }
              },
              "required": [
                "createdAt",
                "version"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "user",
            "metadata"
          ],
          "additionalProperties": false
        }"
      `
      );
    });
  });

  describe('zodEngine error structure', () => {
    const simpleSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const engine = zodEngine(simpleSchema);

    it('should return properly structured error objects', () => {
      const invalidData = {
        name: 123, // wrong type
        age: 'not-a-number', // wrong type
      };

      // biome-ignore lint/suspicious/noExplicitAny: Test data
      const result = engine.validate(invalidData as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);

        result.errors.forEach(error => {
          expect(error).toHaveProperty('path');
          expect(error).toHaveProperty('input');
          expect(error).toHaveProperty('details');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('_raw');

          expect(typeof error.path).toBe('string');
          expect(typeof error.message).toBe('string');
          expect(typeof error.details).toBe('string');
          expect(error._raw).toBeDefined();
        });

        // Zod v4 may report the error path as 'name' or 'name.0' for type errors
        const nameError = result.errors.find(e => e.path.startsWith('name'));

        expect(nameError?.message).toContain('Invalid input: expected string, received number');

        const ageError = result.errors.find(e => e.path === 'age');
        expect(ageError?.message).toContain('Invalid input: expected number, received string');
      }
    });
  });
});
