import type { GhiiEngine } from '@ghii/ghii-v2';
import * as z from 'zod/v4';

export type ZodSchemaFactory<T extends z.ZodType> = (zod: typeof z) => T;

export function zodEngine<ZodConfig extends z.ZodType, Config = z.infer<ZodConfig>>(
  schema: ZodSchemaFactory<ZodConfig> | ZodConfig
): GhiiEngine<Config> {
  const _schema = typeof schema === 'function' ? schema(z) : schema;
  return {
    validate: (toValidate: Config) => {
      const result = z.safeParse(_schema, toValidate);
      if (result.success) {
        return { success: true, value: result.data as Config } as const;
      } else {
        return {
          success: false,
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            input: issue.input,
            details: issue.code,
            message: issue.message,
            _raw: issue,
          })),
        } as const;
      }
    },
    toJsonSchema(pretty = false) {
      return JSON.stringify(z.toJSONSchema(_schema), null, pretty ? 2 : 0);
    },
  };
}
