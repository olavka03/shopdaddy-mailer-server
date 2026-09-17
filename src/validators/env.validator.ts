import zod from 'zod';

export const validPortSchema = zod
  .string()
  .trim()
  .transform(Number)
  .refine((port) => Number.isInteger(port) && port >= 1 && port <= 65535, 'Must be an integer between 1 and 65535');

export const booleanStringSchema = zod
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value === 'true' || value === '1');

export const availableOriginsSchema = zod
  .string()
  .trim()
  .optional()
  .default('*')
  .transform((value): string[] | '*' => {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);

    return value === '*' || origins.length === 0 ? '*' : origins;
  });
