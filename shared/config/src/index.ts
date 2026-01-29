import { z } from 'zod';

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVICE_NAME: z.string(),
  PORT: z.coerce.number().int().positive()
});

export type BaseEnv = z.infer<typeof BaseEnvSchema>;

export const loadBaseEnv = (env: NodeJS.ProcessEnv): BaseEnv => {
  return BaseEnvSchema.parse(env);
};

export const createEnvParser = <T extends z.ZodTypeAny>(schema: T) => {
  return (env: NodeJS.ProcessEnv): z.infer<T> => schema.parse(env);
};
