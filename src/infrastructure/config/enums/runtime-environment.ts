export const RuntimeEnvironment = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

export type RuntimeEnvironment = (typeof RuntimeEnvironment)[keyof typeof RuntimeEnvironment];

export const RUNTIME_ENVIRONMENTS: readonly RuntimeEnvironment[] =
  Object.values(RuntimeEnvironment);
